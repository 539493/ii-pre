import { useEffect, useMemo, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { TutorResponse, KnowledgeItem, ChatMessage } from "@/types/tutor";
import { getSubjectById, isFormulaSubject } from "@/lib/subjects";
import BoardRenderer from "@/components/BoardRenderer";
import ChatPanel from "@/components/ChatPanel";
import PromptInput from "@/components/PromptInput";
import FormulaInput from "@/components/FormulaInput";
import { useSpeechNarration } from "@/hooks/useSpeechNarration";
import { useIdlePrompter } from "@/hooks/useIdlePrompter";
import { ArrowLeft, Volume2, VolumeX, Calculator, ChevronLeft, ChevronRight, MessageSquare } from "lucide-react";
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable";

const HISTORY_KEY = (id: string) => `ai-tutor-history-${id}`;
const DEVICE_ID_KEY = "ai-tutor-device-id";
const CHAT_VISIBLE_KEY = "ai-tutor-chat-visible";

function getDeviceId() {
  let id = localStorage.getItem(DEVICE_ID_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(DEVICE_ID_KEY, id);
  }
  return id;
}

function getInitialChatVisibility() {
  const raw = localStorage.getItem(CHAT_VISIBLE_KEY);
  return raw === null ? true : raw === "true";
}

interface QuizFeedbackItem {
  correct: boolean;
  message: string;
  errorCount?: number;
  skipped?: boolean;
  postponed?: boolean;
}

export default function SubjectWorkspace() {
  const { subjectId } = useParams<{ subjectId: string }>();
  const navigate = useNavigate();
  const subject = subjectId ? getSubjectById(subjectId) : undefined;

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
  const [chatVisible, setChatVisible] = useState(getInitialChatVisibility);

  const { narrate, stop, isSpeaking, currentStepIndex } = useSpeechNarration();
  const deviceId = useMemo(() => getDeviceId(), []);

  // Idle prompter — system asks a question after 20s of inactivity
  const handleIdle = useCallback(() => {
    if (loading || messages.length === 0) return;
    const idlePrompts = [
      "Какие ещё вопросы по этой теме ты хотел бы разобрать? 🤔",
      "Хочешь решить ещё один пример для закрепления? 💪",
      "Может попробуем что-нибудь посложнее? 🚀",
      "Есть ли что-то, что ещё непонятно? Спрашивай! 😊",
    ];
    const randomPrompt = idlePrompts[Math.floor(Math.random() * idlePrompts.length)];
    const idleMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: "assistant",
      content: randomPrompt,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, idleMsg]);
  }, [loading, messages.length]);

  const { resetIdleTimer } = useIdlePrompter(handleIdle, messages.length > 0 && !loading, 20000);

  // Load knowledge
  useEffect(() => {
    supabase
      .from("knowledge_items")
      .select("*")
      .order("created_at", { ascending: false })
      .then(({ data }) => { if (data) setKnowledgeItems(data as any); });
  }, []);

  // Load saved history
  useEffect(() => {
    if (!subjectId) return;
    try {
      const raw = localStorage.getItem(HISTORY_KEY(subjectId));
      if (raw) {
        const parsed = JSON.parse(raw);
        setMessages(parsed.map((m: any) => ({ ...m, timestamp: new Date(m.timestamp) })));
      }
    } catch { /* ignore */ }
  }, [subjectId]);

  // Save history
  useEffect(() => {
    if (!subjectId || messages.length === 0) return;
    localStorage.setItem(HISTORY_KEY(subjectId), JSON.stringify(messages));
  }, [messages, subjectId]);

  useEffect(() => {
    if (currentStepIndex >= 0) setRevealedStepIndex(currentStepIndex);
  }, [currentStepIndex]);

  useEffect(() => {
    localStorage.setItem(CHAT_VISIBLE_KEY, String(chatVisible));
  }, [chatVisible]);

  if (!subject) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-muted-foreground">Предмет не найден</p>
      </div>
    );
  }

  const mergedKnowledge = knowledgeItems.map((item) => `# ${item.title}\n${item.content}`).join("\n\n");

  const conversationHistory = messages.map((m) => ({
    role: m.role,
    content: m.role === "user" ? m.content : (m.result ? `${m.result.title}: ${m.result.summary}\nSteps: ${m.result.steps?.join("; ")}` : m.content),
  }));

  const visibleBoard = (() => {
    if (!activeResult?.board?.length) return [];
    if (revealedStepIndex === -1 && !isSpeaking) return activeResult.board;
    return activeResult.board.filter((item) => {
      const step = (item as any).stepIndex ?? 0;
      return step <= revealedStepIndex;
    });
  })();

  function parseRequestedQuestionCount(text: string) {
    const direct = text.match(/(\d+)\s*(?:вопрос|вопроса|вопросов|questions?)/i);
    const onTest = text.match(/(?:тест|экзамен|викторин[аы])\s*на\s*(\d+)/i);
    const fallback = direct || onTest || text.match(/(?:тест|экзамен|викторин[аы]).*?(\d+)/i);
    if (!fallback) return null;
    const value = Number(fallback[1]);
    if (!Number.isFinite(value)) return null;
    return Math.max(1, Math.min(100, value));
  }

  const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

  async function handleTeach() {
    const textPrompt = prompt.trim();
    if (!textPrompt && !attachedImage) {
      setError("Напиши, что нужно объяснить.");
      return;
    }

    stop();
    resetIdleTimer();

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: textPrompt || (attachedImage ? "📷 Фото задачи" : ""),
      timestamp: new Date(),
      imageUrl: attachedImage?.startsWith("data:") ? attachedImage : undefined,
    };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);
    setError("");
    setActiveResult(null);
    setRevealedStepIndex(-1);

    // Detect test plan request
    const isTestPlanRequest = /план\s*(обучения|тест)|составь.*тест|создай.*тест|подготов.*тест/i.test(textPrompt);

    if (isTestPlanRequest) {
      const desiredQuestionCount = parseRequestedQuestionCount(textPrompt);
      let data: any = null;
      let err: any = null;
      for (let attempt = 0; attempt < 3; attempt += 1) {
        const res = await supabase.functions.invoke("generate-tests", {
          body: {
            subjectId: subject.id,
            subjectName: subject.name,
            topic: textPrompt,
            deviceId,
            history: conversationHistory,
            desiredQuestionCount: desiredQuestionCount ?? undefined,
          },
        });
        data = res.data;
        err = res.error;
        if (!err) break;

        const status = (err as any)?.context?.status;
        const isRetryable = status === 429 || status === 502 || status === 422;
        if (!isRetryable || attempt === 2) break;
        await sleep(700 * (attempt + 1));
      }
      setLoading(false);
      setAttachedImage(null);

      if (err) {
        let details = err.message || "Неизвестная ошибка";
        const contextBody = (err as any)?.context?.body;
        if (contextBody) {
          try {
            const parsed = JSON.parse(contextBody);
            details = parsed?.error || details;
          } catch {
            details = String(contextBody) || details;
          }
        } else if ((data as any)?.error) {
          details = (data as any)?.error;
        }
        setError(`Ошибка создания тестов: ${details}`);
        return;
      }

      const testTitle = data?.test_title || "Тест";
      const questionsCount = data?.question_count || (
        Array.isArray(data?.sections)
          ? data.sections.reduce((total: number, section: { questions?: unknown[] }) => total + (section.questions?.length || 0), 0)
          : data?.questions?.length || 0
      );
      const assistantMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: `📋 Готово! Я создал тест "${testTitle}" на ${questionsCount} вопросов в одном блоке с разбивкой по темам. Перейди в раздел «Мои тесты» в боковом меню, чтобы начать! 🎯`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMsg]);
      setPrompt("");
      return;
    }

    const { data, error: err } = await supabase.functions.invoke("tutor-board", {
      body: {
        prompt: textPrompt || "Проанализируй это изображение и объясни",
        knowledge: mergedKnowledge,
        history: conversationHistory,
        subjectId: subject.id,
        subjectName: subject.name,
        image: attachedImage || undefined,
        deviceId,
      },
    });

    setLoading(false);
    setAttachedImage(null);

    if (err) {
      setError(err.message || "Ошибка вызова AI.");
      return;
    }

    const result = data as TutorResponse;
    setActiveResult(result);

    const assistantMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: "assistant",
      content: result.summary,
      result,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, assistantMsg]);
    setPrompt("");

    if (voiceEnabled && result.steps?.length) {
      setRevealedStepIndex(-1);
      setTimeout(() => {
        narrate(result.steps, (stepIdx) => setRevealedStepIndex(stepIdx));
      }, 300);
    } else {
      setRevealedStepIndex(999);
    }
  }

  const handleQuizAnswer = async (question: string, answer: string) => {
    // Handle skip
    if (answer === "__SKIP__") {
      setQuizFeedback((prev) => ({
        ...prev,
        [question]: { correct: false, message: "", skipped: true },
      }));

      // Track skipped in analytics
      if (activeResult?.title) {
        await supabase.from("progress_records").insert({
          subject_id: subject.id,
          topic: activeResult.title,
          score: 0,
          total_questions: 1,
          correct_answers: 0,
        } as any);
      }
      return;
    }

    setLoadingQuestion(question);
    const currentErrors = errorCounts[question] || 0;

    try {
      const { data, error: err } = await supabase.functions.invoke("quiz-check", {
        body: {
          question,
          answer,
          context: activeResult?.title || "",
          subjectId: subject.id,
          errorCount: currentErrors,
        },
      });
      if (err) {
        setQuizFeedback((prev) => ({ ...prev, [question]: { correct: false, message: "Ошибка проверки, попробуй ещё раз 🔄" } }));
      } else {
        if (data?.correct) {
          setQuizFeedback((prev) => ({ ...prev, [question]: { ...data, errorCount: currentErrors } }));
          // Track correct in analytics
          if (activeResult?.title) {
            await supabase.from("progress_records").insert({
              subject_id: subject.id,
              topic: activeResult.title,
              score: 100,
              total_questions: 1,
              correct_answers: 1,
            } as any);
          }
        } else {
          const newCount = currentErrors + 1;
          setErrorCounts((prev) => ({ ...prev, [question]: newCount }));

          if (newCount >= 3) {
            // Postpone after 3 errors
            setQuizFeedback((prev) => ({
              ...prev,
              [question]: {
                correct: false,
                message: data.message || "Давай вернёмся к этому вопросу позже 🔄",
                postponed: true,
                errorCount: newCount,
              },
            }));
            // Track postponed
            if (activeResult?.title) {
              await supabase.from("progress_records").insert({
                subject_id: subject.id,
                topic: activeResult.title,
                score: 0,
                total_questions: 1,
                correct_answers: 0,
              } as any);
            }
          } else {
            setQuizFeedback((prev) => ({ ...prev, [question]: { ...data, errorCount: newCount } }));
          }
        }
      }
    } catch {
      setQuizFeedback((prev) => ({ ...prev, [question]: { correct: false, message: "Попробуй ещё раз! 💪" } }));
    }
    setLoadingQuestion(null);
  };

  const handleFormulaInsert = (formula: string) => {
    setPrompt((p) => p + formula);
  };

  const boardContent = (
    <ResizablePanel defaultSize={chatVisible ? 72 : 100} minSize={35}>
      <div className="flex h-full flex-col gap-2 px-1">
        <div className="rounded-2xl border border-border bg-card p-3 shadow-lg flex-1 min-h-0 overflow-hidden">
          <div className="mb-2 flex items-center justify-between gap-3">
            <h2 className="text-base font-semibold text-card-foreground">📝 Доска</h2>
            <div className="flex items-center gap-2">
              {!chatVisible && (
                <button
                  onClick={() => setChatVisible(true)}
                  className="flex items-center gap-1 rounded-full border border-border bg-secondary px-3 py-1 text-xs text-muted-foreground transition hover:text-foreground"
                >
                  <MessageSquare className="h-3.5 w-3.5" />
                  Показать чат
                  <ChevronLeft className="h-3.5 w-3.5" />
                </button>
              )}
              {loading && (
                <span className="rounded-full border border-border bg-secondary px-3 py-1 text-xs text-muted-foreground">Генерация…</span>
              )}
              {isSpeaking && (
                <button onClick={stop} className="rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs text-primary hover:bg-primary/20">
                  ⏹ Стоп
                </button>
              )}
            </div>
          </div>
          <BoardRenderer items={visibleBoard} />
        </div>

        {showFormula && (
          <div className="shrink-0 rounded-xl border border-border bg-card px-3 py-2">
            <FormulaInput onInsert={handleFormulaInsert} />
          </div>
        )}

        <div className="shrink-0">
          <PromptInput
            prompt={prompt}
            setPrompt={setPrompt}
            onSubmit={() => handleTeach()}
            loading={loading}
            attachedImage={attachedImage}
            onAttachImage={setAttachedImage}
          />
        </div>

        {error && (
          <div className="shrink-0 rounded-xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</div>
        )}
      </div>
    </ResizablePanel>
  );

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Header */}
      <header className="flex items-center gap-3 border-b border-border px-4 py-3 shrink-0">
        <button onClick={() => navigate("/")} className="rounded-lg p-1.5 text-muted-foreground transition hover:bg-secondary hover:text-foreground">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <span className="text-2xl">{subject.icon}</span>
        <h1 className="text-lg font-bold text-foreground">{subject.name}</h1>
        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={() => setChatVisible((prev) => !prev)}
            className={`flex items-center gap-1.5 rounded-xl border px-3 py-2 text-sm transition ${
              chatVisible ? "border-primary/30 bg-primary/10 text-primary" : "border-border bg-secondary text-muted-foreground hover:text-foreground"
            }`}
          >
            <MessageSquare className="h-4 w-4" />
            {chatVisible ? "Скрыть чат" : "Показать чат"}
            {chatVisible ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
          {isFormulaSubject(subject) && (
            <button
              onClick={() => setShowFormula(!showFormula)}
              className={`flex items-center gap-1.5 rounded-xl border px-3 py-2 text-sm transition ${
                showFormula ? "border-primary/30 bg-primary/10 text-primary" : "border-border bg-secondary text-muted-foreground hover:text-foreground"
              }`}
            >
              <Calculator className="h-4 w-4" /> Формулы
            </button>
          )}
          <button
            onClick={() => { setVoiceEnabled((v) => !v); if (isSpeaking) stop(); }}
            className="flex items-center gap-1.5 rounded-xl border border-border bg-secondary px-3 py-2 text-sm text-muted-foreground transition hover:text-foreground"
          >
            {voiceEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
            {voiceEnabled ? "Голос вкл" : "Голос выкл"}
          </button>
        </div>
      </header>

      {/* Main layout */}
      <main className="flex-1 overflow-hidden p-2">
        <ResizablePanelGroup direction="horizontal" className="h-full rounded-xl">
          {boardContent}

          {chatVisible && (
            <>
              <ResizableHandle withHandle />

              <ResizablePanel defaultSize={28} minSize={18} maxSize={45}>
                <div className="h-full overflow-hidden pl-1">
                  <ChatPanel
                    messages={messages}
                    currentStepIndex={currentStepIndex}
                    quizFeedback={quizFeedback}
                    loadingQuestion={loadingQuestion}
                    onQuizAnswer={handleQuizAnswer}
                    onHide={() => setChatVisible(false)}
                  />
                </div>
              </ResizablePanel>
            </>
          )}
        </ResizablePanelGroup>
      </main>
    </div>
  );
}
