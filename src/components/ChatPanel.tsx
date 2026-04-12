import { ChatMessage } from "@/types/tutor";
import { ScrollArea } from "@/components/ui/scroll-area";
import { User, Bot, ChevronRight } from "lucide-react";
import { useEffect, useRef } from "react";
import QuizSection from "@/components/QuizSection";

interface Props {
  messages: ChatMessage[];
  currentStepIndex: number;
  quizFeedback: Record<string, { correct: boolean; message: string } | null>;
  loadingQuestion: string | null;
  onQuizAnswer: (question: string, answer: string) => void;
  onHide?: () => void;
}

export default function ChatPanel({ messages, currentStepIndex, quizFeedback, loadingQuestion, onQuizAnswer, onHide }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, currentStepIndex]);

  if (messages.length === 0) {
    return (
      <div className="flex h-full flex-col rounded-2xl border border-border bg-card shadow-lg">
        <div className="flex items-center gap-2 border-b border-border px-4 py-3">
          <Bot className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold text-card-foreground">Чат</h2>
          {onHide && (
            <button
              onClick={onHide}
              className="ml-auto flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-muted-foreground transition hover:bg-secondary hover:text-foreground"
            >
              Скрыть
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
        <div className="flex flex-1 items-center justify-center p-4">
          <p className="text-center text-sm text-muted-foreground">
            Задай вопрос — здесь появится объяснение
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col rounded-2xl border border-border bg-card shadow-lg">
      <div className="flex items-center gap-2 border-b border-border px-4 py-3">
        <Bot className="h-5 w-5 text-primary" />
        <h2 className="text-lg font-semibold text-card-foreground">Чат</h2>
        {onHide && (
          <button
            onClick={onHide}
            className="ml-auto flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-muted-foreground transition hover:bg-secondary hover:text-foreground"
          >
            Скрыть
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      <ScrollArea className="flex-1 p-3">
        <div className="space-y-3">
          {messages.map((msg, msgIdx) => (
            <div key={msg.id}>
              {msg.role === "user" ? (
                <div className="flex items-start gap-2">
                  <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/20">
                    <User className="h-3.5 w-3.5 text-primary" />
                  </div>
                  <div className="rounded-2xl rounded-tl-sm border border-border bg-secondary px-3 py-2 text-sm text-foreground">
                    {msg.imageUrl && (
                      <img src={msg.imageUrl} alt="Загруженное фото" className="mb-2 max-h-40 rounded-lg object-contain" />
                    )}
                    {msg.content}
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-2">
                  <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent/20">
                    <Bot className="h-3.5 w-3.5 text-accent" />
                  </div>
                  <div className="flex-1 space-y-2">
                    {msg.result && (
                      <>
                        <div className="rounded-2xl rounded-tl-sm border border-border bg-secondary/50 px-3 py-2">
                          <p className="text-sm font-semibold text-foreground">{msg.result.title}</p>
                          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{msg.result.summary}</p>
                        </div>

                        {msg.result.steps?.map((step, i) => {
                          const isLatest = msgIdx === messages.length - 1 || messages.slice(msgIdx + 1).every(m => m.role === "user");
                          const isActive = isLatest && i === currentStepIndex;
                          const isPast = !isLatest || currentStepIndex === -1 || i <= currentStepIndex;
                          return (
                            <div
                              key={i}
                              className={`rounded-xl border px-3 py-2 text-sm transition-all duration-300 ${
                                isActive
                                  ? "border-primary/40 bg-primary/10 text-foreground ring-1 ring-primary/20"
                                  : isPast
                                  ? "border-border bg-secondary/30 text-foreground"
                                  : "border-border/50 bg-secondary/10 text-muted-foreground opacity-50"
                              }`}
                            >
                              <span className="mr-2 font-bold text-primary">{i + 1}.</span>
                              {step}
                            </div>
                          );
                        })}

                        {msg.result.checkUnderstanding?.length > 0 && (
                          <QuizSection
                            questions={msg.result.checkUnderstanding}
                            onAnswer={onQuizAnswer}
                            quizFeedback={quizFeedback}
                            loadingQuestion={loadingQuestion}
                          />
                        )}
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
          <div ref={bottomRef} />
        </div>
      </ScrollArea>
    </div>
  );
}
