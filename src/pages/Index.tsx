import { useEffect, useMemo, useState, useCallback } from "react";
import { TutorResponse, KnowledgeItem, ChatMessage } from "@/types/tutor";
import KnowledgePanel from "@/components/KnowledgePanel";
import BoardRenderer from "@/components/BoardRenderer";
import ChatPanel from "@/components/ChatPanel";
import PromptInput from "@/components/PromptInput";
import { useSpeechNarration } from "@/hooks/useSpeechNarration";
import { buildConversationHistory, getVisibleBoardItems } from "@/lib/tutor-session";
import { fetchKnowledgeItems, requestQuizCheck, requestTutorBoard } from "@/services/tutorData";
import { GraduationCap, Volume2, VolumeX } from "lucide-react";
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable";

export default function Index() {
  const [prompt, setPrompt] = useState("");
  const [knowledgeItems, setKnowledgeItems] = useState<KnowledgeItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [activeResult, setActiveResult] = useState<TutorResponse | null>(null);
  const [revealedStepIndex, setRevealedStepIndex] = useState(-1);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [quizFeedback, setQuizFeedback] = useState<Record<string, { correct: boolean; message: string } | null>>({});
  const [loadingQuestion, setLoadingQuestion] = useState<string | null>(null);

  const { narrate, stop, isSpeaking, currentStepIndex } = useSpeechNarration();

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
    if (currentStepIndex >= 0) {
      setRevealedStepIndex(currentStepIndex);
    }
  }, [currentStepIndex]);

  const mergedKnowledge = useMemo(() => {
    return knowledgeItems.map((item) => `# ${item.title}\n${item.content}`).join("\n\n");
  }, [knowledgeItems]);

  const conversationHistory = useMemo(() => buildConversationHistory(messages), [messages]);

  const visibleBoard = useMemo(
    () => getVisibleBoardItems(activeResult, revealedStepIndex, isSpeaking),
    [activeResult, revealedStepIndex, isSpeaking],
  );

  async function handleTeach() {
    if (!prompt.trim()) {
      setError("Напиши, что нужно объяснить.");
      return;
    }

    stop();

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: prompt.trim(),
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);
    setError("");
    setActiveResult(null);
    setRevealedStepIndex(-1);

    try {
      const result = await requestTutorBoard({
        prompt: prompt.trim(),
        knowledge: mergedKnowledge,
        history: conversationHistory,
      });

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
          narrate(result.steps, (stepIdx) => {
            setRevealedStepIndex(stepIdx);
          });
        }, 300);
      } else {
        setRevealedStepIndex(999);
      }
    } catch (teachError) {
      setError(teachError instanceof Error ? teachError.message : "Ошибка вызова AI.");
    } finally {
      setLoading(false);
    }
  }

  const handleQuizAnswer = useCallback(async (question: string, answer: string) => {
    setLoadingQuestion(question);
    try {
      const data = await requestQuizCheck({
        question,
        answer,
        context: activeResult?.title || "",
      });
      setQuizFeedback((prev) => ({ ...prev, [question]: data }));
    } catch (quizError) {
      setQuizFeedback((prev) => ({
        ...prev,
        [question]: {
          correct: false,
          message: quizError instanceof Error ? quizError.message : "Попробуй ещё раз! 💪",
        },
      }));
    }
    setLoadingQuestion(null);
  }, [activeResult]);

  return (
    <div className="flex h-screen flex-col bg-background overflow-hidden">
      {/* Header */}
      <header className="flex items-center gap-3 border-b border-border px-6 py-3 shrink-0">
        <GraduationCap className="h-7 w-7 text-primary" />
        <h1 className="text-xl font-bold text-foreground">AI Tutor Board</h1>
        <div className="ml-auto">
          <button
            onClick={() => {
              setVoiceEnabled((v) => !v);
              if (isSpeaking) stop();
            }}
            className="flex items-center gap-2 rounded-xl border border-border bg-secondary px-3 py-2 text-sm text-muted-foreground transition hover:text-foreground"
          >
            {voiceEnabled ? (
              <>
                <Volume2 className="h-4 w-4" />
                Голос вкл
              </>
            ) : (
              <>
                <VolumeX className="h-4 w-4" />
                Голос выкл
              </>
            )}
          </button>
        </div>
      </header>

      {/* Main resizable layout */}
      <main className="flex-1 overflow-hidden p-2">
        <ResizablePanelGroup direction="horizontal" className="h-full rounded-xl">
          {/* Left: Knowledge */}
          <ResizablePanel defaultSize={18} minSize={12} maxSize={30}>
            <div className="h-full overflow-hidden pr-1">
              <KnowledgePanel items={knowledgeItems} onRefresh={loadKnowledge} />
            </div>
          </ResizablePanel>

          <ResizableHandle withHandle />

          {/* Center: Board + Input */}
          <ResizablePanel defaultSize={55} minSize={35}>
            <div className="flex h-full flex-col gap-2 px-1">
              <div className="rounded-2xl border border-border bg-card p-3 shadow-lg flex-1 min-h-0 overflow-hidden">
                <div className="mb-2 flex items-center justify-between">
                  <h2 className="text-base font-semibold text-card-foreground">📝 Доска</h2>
                  {loading && (
                    <span className="rounded-full border border-border bg-secondary px-3 py-1 text-xs text-muted-foreground">
                      Генерация…
                    </span>
                  )}
                  {isSpeaking && (
                    <button
                      onClick={stop}
                      className="rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs text-primary hover:bg-primary/20"
                    >
                      ⏹ Стоп
                    </button>
                  )}
                </div>
                <BoardRenderer items={visibleBoard} />
              </div>

              <div className="shrink-0">
                <PromptInput
                  prompt={prompt}
                  setPrompt={setPrompt}
                  onSubmit={handleTeach}
                  loading={loading}
                />
              </div>

              {error && (
                <div className="shrink-0 rounded-xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                  {error}
                </div>
              )}
            </div>
          </ResizablePanel>

          <ResizableHandle withHandle />

          {/* Right: Chat */}
          <ResizablePanel defaultSize={27} minSize={15} maxSize={45}>
            <div className="h-full overflow-hidden pl-1">
              <ChatPanel
                messages={messages}
                currentStepIndex={currentStepIndex}
                quizFeedback={quizFeedback}
                loadingQuestion={loadingQuestion}
                onQuizAnswer={handleQuizAnswer}
              />
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </main>
    </div>
  );
}
