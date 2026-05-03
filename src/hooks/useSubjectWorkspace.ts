import { useCallback, useEffect, useMemo, useState } from "react";
import { getSubjectById } from "@/lib/subjects";
import {
  CHAT_VISIBLE_KEY,
  buildConversationHistory,
  getChatHistoryKey,
  getOrCreateDeviceId,
  getStoredBoolean,
  getVisibleBoardItems,
  restoreChatMessages,
} from "@/lib/tutor-session";
import { useIdlePrompter } from "@/hooks/useIdlePrompter";
import { useSpeechNarration } from "@/hooks/useSpeechNarration";
import {
  fetchKnowledgeItems,
  recordProgressRecord,
  requestGenerateTests,
  requestQuizCheck,
  requestTutorBoard,
} from "@/services/tutorData";
import type { ChatMessage, KnowledgeItem, QuizFeedbackItem, TutorResponse } from "@/types/tutor";

const IDLE_PROMPTS = [
  "Какие ещё вопросы по этой теме ты хотел бы разобрать? 🤔",
  "Хочешь решить ещё один пример для закрепления? 💪",
  "Может попробуем что-нибудь посложнее? 🚀",
  "Есть ли что-то, что ещё непонятно? Спрашивай! 😊",
];

const TEST_PLAN_PATTERN = /план\s*(обучения|тест)|составь.*тест|создай.*тест|подготов.*тест/i;

function getLatestResult(messages: ChatMessage[]) {
  return [...messages].reverse().find((message) => message.result)?.result ?? null;
}

export function useSubjectWorkspace(subjectId?: string) {
  const subject = useMemo(() => (subjectId ? getSubjectById(subjectId) : undefined), [subjectId]);
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [activeResult, setActiveResult] = useState<TutorResponse | null>(null);
  const [revealedStepIndex, setRevealedStepIndex] = useState(-1);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [quizFeedback, setQuizFeedback] = useState<Record<string, QuizFeedbackItem | null>>({});
  const [loadingQuestion, setLoadingQuestion] = useState<string | null>(null);
  const [showFormula, setShowFormula] = useState(false);
  const [knowledgeItems, setKnowledgeItems] = useState<KnowledgeItem[]>([]);
  const [attachedImage, setAttachedImage] = useState<string | null>(null);
  const [errorCounts, setErrorCounts] = useState<Record<string, number>>({});
  const [chatVisible, setChatVisible] = useState(() => getStoredBoolean(localStorage.getItem(CHAT_VISIBLE_KEY)));
  const { narrate, stop, isSpeaking, currentStepIndex } = useSpeechNarration();
  const deviceId = useMemo(() => getOrCreateDeviceId(), []);

  const handleIdle = useCallback(() => {
    if (loading || messages.length === 0) return;

    const idleMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: "assistant",
      content: IDLE_PROMPTS[Math.floor(Math.random() * IDLE_PROMPTS.length)],
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, idleMsg]);
  }, [loading, messages.length]);

  const { resetIdleTimer } = useIdlePrompter(handleIdle, messages.length > 0 && !loading, 20000);

  const loadKnowledge = useCallback(async () => {
    try {
      setKnowledgeItems(await fetchKnowledgeItems());
    } catch {
      setKnowledgeItems([]);
    }
  }, []);

  useEffect(() => {
    void loadKnowledge();
  }, [loadKnowledge]);

  useEffect(() => {
    if (!subjectId) {
      setMessages([]);
      setActiveResult(null);
      setRevealedStepIndex(-1);
      return;
    }

    const restoredMessages = restoreChatMessages(localStorage.getItem(getChatHistoryKey(subjectId)));
    const latestResult = getLatestResult(restoredMessages);

    setMessages(restoredMessages);
    setActiveResult(latestResult);
    setRevealedStepIndex(latestResult ? 999 : -1);
  }, [subjectId]);

  useEffect(() => {
    if (!subjectId || messages.length === 0) return;
    localStorage.setItem(getChatHistoryKey(subjectId), JSON.stringify(messages));
  }, [messages, subjectId]);

  useEffect(() => {
    if (currentStepIndex >= 0) {
      setRevealedStepIndex(currentStepIndex);
    }
  }, [currentStepIndex]);

  useEffect(() => {
    localStorage.setItem(CHAT_VISIBLE_KEY, String(chatVisible));
  }, [chatVisible]);

  const mergedKnowledge = useMemo(
    () => knowledgeItems.map((item) => `# ${item.title}\n${item.content}`).join("\n\n"),
    [knowledgeItems],
  );

  const conversationHistory = useMemo(() => buildConversationHistory(messages), [messages]);

  const visibleBoard = useMemo(
    () => getVisibleBoardItems(activeResult, revealedStepIndex, isSpeaking),
    [activeResult, revealedStepIndex, isSpeaking],
  );

  const speakSteps = useCallback((result: TutorResponse) => {
    if (voiceEnabled && result.steps.length > 0) {
      setRevealedStepIndex(-1);
      setTimeout(() => {
        narrate(result.steps, (stepIndex) => setRevealedStepIndex(stepIndex));
      }, 300);
      return;
    }

    setRevealedStepIndex(999);
  }, [narrate, voiceEnabled]);

  const trackProgress = useCallback((score: number, correctAnswers: number) => {
    if (!subject || !activeResult?.title) return;

    void recordProgressRecord({
      subject_id: subject.id,
      topic: activeResult.title,
      score,
      total_questions: 1,
      correct_answers: correctAnswers,
      device_id: deviceId,
    }).catch(() => undefined);
  }, [activeResult?.title, deviceId, subject]);

  const handleTeach = useCallback(async (overridePrompt?: string) => {
    if (!subject) return;

    const textPrompt = (overridePrompt ?? prompt).trim();
    if (!textPrompt && !attachedImage) {
      setError("Напиши, что нужно объяснить.");
      return;
    }

    stop();
    resetIdleTimer();

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: textPrompt || (attachedImage ? "📷 Фото задачи" : ""),
      timestamp: new Date(),
      imageUrl: attachedImage?.startsWith("data:") ? attachedImage : undefined,
    };

    setMessages((prev) => [...prev, userMessage]);
    setLoading(true);
    setError("");
    setActiveResult(null);
    setRevealedStepIndex(-1);
    setErrorCounts({});

    if (TEST_PLAN_PATTERN.test(textPrompt)) {
      try {
        const generatedTest = await requestGenerateTests({
          subjectId: subject.id,
          subjectName: subject.name,
          topic: textPrompt,
          deviceId,
          history: conversationHistory,
        });

        const assistantMessage: ChatMessage = {
          id: crypto.randomUUID(),
          role: "assistant",
          content: `📋 Готово! Я создал тест "${generatedTest.test_title}" на ${generatedTest.question_count} вопросов в одном блоке с разбивкой по темам. Перейди в раздел «Мои тесты» в боковом меню, чтобы начать! 🎯`,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, assistantMessage]);
        setPrompt("");
      } catch (requestError) {
        setError(requestError instanceof Error ? requestError.message : "Ошибка создания тестов.");
      } finally {
        setLoading(false);
        setAttachedImage(null);
      }

      return;
    }

    try {
      const result = await requestTutorBoard({
        prompt: textPrompt || "Проанализируй это изображение и объясни",
        knowledge: mergedKnowledge,
        history: conversationHistory,
        subjectId: subject.id,
        subjectName: subject.name,
        image: attachedImage || undefined,
        deviceId,
      });

      const assistantMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: result.summary,
        result,
        timestamp: new Date(),
      };

      setActiveResult(result);
      setMessages((prev) => [...prev, assistantMessage]);
      setPrompt("");
      speakSteps(result);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Ошибка вызова AI.");
    } finally {
      setLoading(false);
      setAttachedImage(null);
    }
  }, [
    attachedImage,
    conversationHistory,
    deviceId,
    mergedKnowledge,
    prompt,
    resetIdleTimer,
    speakSteps,
    stop,
    subject,
  ]);

  const handleQuizAnswer = useCallback(async (question: string, answer: string) => {
    if (!subject) return;

    if (answer === "__SKIP__") {
      setQuizFeedback((prev) => ({
        ...prev,
        [question]: { correct: false, message: "", skipped: true },
      }));
      trackProgress(0, 0);
      return;
    }

    setLoadingQuestion(question);
    const currentErrors = errorCounts[question] || 0;

    try {
      const response = await requestQuizCheck({
        question,
        answer,
        context: activeResult?.title || "",
        subjectId: subject.id,
        errorCount: currentErrors,
      });

      if (response.correct) {
        setQuizFeedback((prev) => ({
          ...prev,
          [question]: { ...response, errorCount: currentErrors },
        }));
        trackProgress(100, 1);
      } else {
        const nextErrorCount = currentErrors + 1;
        setErrorCounts((prev) => ({ ...prev, [question]: nextErrorCount }));

        if (nextErrorCount >= 3) {
          setQuizFeedback((prev) => ({
            ...prev,
            [question]: {
              correct: false,
              message: response.message || "Давай вернёмся к этому вопросу позже 🔄",
              postponed: true,
              errorCount: nextErrorCount,
            },
          }));
          trackProgress(0, 0);
        } else {
          setQuizFeedback((prev) => ({
            ...prev,
            [question]: {
              correct: false,
              message: response.message,
              errorCount: nextErrorCount,
            },
          }));
        }
      }
    } catch (quizError) {
      setQuizFeedback((prev) => ({
        ...prev,
        [question]: {
          correct: false,
          message: quizError instanceof Error ? quizError.message : "Попробуй ещё раз! 💪",
        },
      }));
    } finally {
      setLoadingQuestion(null);
    }
  }, [activeResult?.title, errorCounts, subject, trackProgress]);

  const toggleVoice = useCallback(() => {
    setVoiceEnabled((prev) => !prev);
    if (isSpeaking) stop();
  }, [isSpeaking, stop]);

  const toggleFormula = useCallback(() => {
    setShowFormula((prev) => !prev);
  }, []);

  const toggleChat = useCallback(() => {
    setChatVisible((prev) => !prev);
  }, []);

  const showChat = useCallback(() => {
    setChatVisible(true);
  }, []);

  const hideChat = useCallback(() => {
    setChatVisible(false);
  }, []);

  const handleFormulaInsert = useCallback((formula: string) => {
    setPrompt((prev) => prev + formula);
  }, []);

  return {
    subject,
    prompt,
    setPrompt,
    loading,
    error,
    messages,
    activeResult,
    knowledgeItems,
    visibleBoard,
    voiceEnabled,
    toggleVoice,
    currentStepIndex,
    isSpeaking,
    stop,
    quizFeedback,
    loadingQuestion,
    showFormula,
    toggleFormula,
    attachedImage,
    setAttachedImage,
    chatVisible,
    toggleChat,
    showChat,
    hideChat,
    handleTeach,
    handleQuizAnswer,
    handleFormulaInsert,
  };
}
