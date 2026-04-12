import { ChatMessage } from "@/types/tutor";
import { ScrollArea } from "@/components/ui/scroll-area";
import { User, Bot } from "lucide-react";
import { useEffect, useRef } from "react";
import QuizSection from "@/components/QuizSection";

interface Props {
  messages: ChatMessage[];
  currentStepIndex: number;
  quizFeedback: Record<string, { correct: boolean; message: string } | null>;
  loadingQuestion: string | null;
  onQuizAnswer: (question: string, answer: string) => void;
}

export default function ChatPanel({ messages, currentStepIndex, quizFeedback, loadingQuestion, onQuizAnswer }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, currentStepIndex]);

  if (messages.length === 0) {
    return (
      <div className="panel-surface flex h-full flex-col overflow-hidden">
        <div className="flex items-center justify-between border-b border-border/70 px-5 py-4">
          <div className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold text-card-foreground">Диалог с наставником</h2>
          </div>
          <span className="rounded-full border border-border/80 bg-secondary/70 px-3 py-1 text-xs font-medium text-muted-foreground">
            Ожидает вопрос
          </span>
        </div>
        <div className="flex flex-1 items-center justify-center p-6">
          <div className="max-w-sm text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[24px] bg-primary/10">
              <Bot className="h-8 w-8 text-primary" />
            </div>
            <p className="mt-5 text-lg font-semibold text-foreground">Здесь появится ход объяснения</p>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              После вопроса справа появятся шаги решения, пояснения и блок проверки понимания.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="panel-surface flex h-full flex-col overflow-hidden">
      <div className="flex items-center justify-between border-b border-border/70 px-5 py-4">
        <div className="flex items-center gap-2">
          <Bot className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold text-card-foreground">Диалог с наставником</h2>
        </div>
        <span className="rounded-full border border-border/80 bg-secondary/70 px-3 py-1 text-xs font-medium text-muted-foreground">
          {messages.length} сообщений
        </span>
      </div>

      <ScrollArea className="soft-scrollbar flex-1 p-4">
        <div className="space-y-4 pr-1">
          {messages.map((msg, msgIdx) => (
            <div key={msg.id}>
              {msg.role === "user" ? (
                <div className="flex justify-end">
                  <div className="max-w-[88%] rounded-[22px] rounded-tr-sm bg-primary px-4 py-3 text-sm text-primary-foreground shadow-[0_18px_34px_-28px_rgba(37,99,235,0.7)]">
                    <div className="mb-2 flex items-center gap-2 text-[11px] uppercase tracking-[0.24em] text-primary-foreground/70">
                      <User className="h-3.5 w-3.5" />
                      Вы
                      <span className="ml-auto normal-case tracking-normal text-primary-foreground/70">
                        {msg.timestamp.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                    {msg.imageUrl && (
                      <img src={msg.imageUrl} alt="Загруженное фото" className="mb-3 max-h-48 rounded-xl border border-white/15 object-contain" />
                    )}
                    {msg.content}
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-2">
                  <div className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-accent/10">
                    <Bot className="h-3.5 w-3.5 text-accent" />
                  </div>
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.24em] text-muted-foreground">
                      <span>AI-наставник</span>
                      <span className="h-1 w-1 rounded-full bg-border" />
                      <span className="normal-case tracking-normal">
                        {msg.timestamp.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                    {msg.result && (
                      <>
                        <div className="rounded-[22px] rounded-tl-sm border border-border/80 bg-white/88 px-4 py-4 shadow-[0_18px_40px_-34px_rgba(15,23,42,0.35)]">
                          <p className="text-sm font-semibold text-foreground">{msg.result.title}</p>
                          <p className="mt-2 text-xs leading-6 text-muted-foreground">{msg.result.summary}</p>
                        </div>

                        {msg.result.steps?.map((step, i) => {
                          const isLatest = msgIdx === messages.length - 1 || messages.slice(msgIdx + 1).every(m => m.role === "user");
                          const isActive = isLatest && i === currentStepIndex;
                          const isPast = !isLatest || currentStepIndex === -1 || i <= currentStepIndex;
                          return (
                            <div
                              key={i}
                              className={`rounded-2xl border px-4 py-3 text-sm transition-all duration-300 ${
                                isActive
                                  ? "border-primary/35 bg-primary/10 text-foreground ring-1 ring-primary/20"
                                  : isPast
                                  ? "border-border/80 bg-secondary/45 text-foreground"
                                  : "border-border/50 bg-secondary/20 text-muted-foreground opacity-60"
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
