import { useState } from "react";
import { HelpCircle, CheckCircle2, ArrowRight, SkipForward, RotateCcw } from "lucide-react";

interface QuizFeedbackItem {
  correct: boolean;
  message: string;
  errorCount?: number;
  skipped?: boolean;
  postponed?: boolean;
}

interface Props {
  questions: string[];
  onAnswer: (question: string, answer: string) => void;
  quizFeedback: Record<string, QuizFeedbackItem | null>;
  loadingQuestion: string | null;
}

export default function QuizSection({ questions, onAnswer, quizFeedback, loadingQuestion }: Props) {
  const [openQuestion, setOpenQuestion] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState("");

  const handleSubmit = (q: string) => {
    const val = inputValue.trim();
    if (!val) return;

    // Dash = skip
    if (val === "-" || val === "—" || val === "–") {
      onAnswer(q, "__SKIP__");
      setInputValue("");
      setOpenQuestion(null);
      return;
    }

    onAnswer(q, val);
    setInputValue("");
  };

  return (
    <div className="mt-2 space-y-1.5">
      <div className="flex items-center gap-1 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
        <HelpCircle className="h-3 w-3" />
        Проверь себя
      </div>
      {questions.map((q, i) => {
        const feedback = quizFeedback[q];
        const isLoading = loadingQuestion === q;
        const isOpen = openQuestion === q;
        const isCorrect = feedback?.correct;
        const isSkipped = feedback?.skipped;
        const isPostponed = feedback?.postponed;

        return (
          <div key={i} className="space-y-1">
            <button
              onClick={() => {
                if (isCorrect) return;
                setOpenQuestion(isOpen ? null : q);
                setInputValue("");
              }}
              className={`w-full text-left rounded-xl border px-3 py-2 text-xs transition-all ${
                isCorrect
                  ? "border-green-500/30 bg-green-500/10 text-green-300"
                  : isSkipped
                  ? "border-yellow-500/30 bg-yellow-500/10 text-yellow-300"
                  : isPostponed
                  ? "border-orange-500/30 bg-orange-500/10 text-orange-300"
                  : "border-border/50 bg-secondary/20 text-muted-foreground hover:bg-secondary/40 hover:text-foreground cursor-pointer"
              }`}
            >
              <div className="flex items-center gap-2">
                {isCorrect && <CheckCircle2 className="h-3.5 w-3.5 text-green-400 shrink-0" />}
                {isSkipped && <SkipForward className="h-3.5 w-3.5 text-yellow-400 shrink-0" />}
                {isPostponed && <RotateCcw className="h-3.5 w-3.5 text-orange-400 shrink-0" />}
                <span>{q}</span>
              </div>
            </button>

            {feedback && !isSkipped && (
              <div className={`rounded-lg px-3 py-2 text-xs ${
                feedback.correct
                  ? "bg-green-500/10 text-green-300 border border-green-500/20"
                  : "bg-orange-500/10 text-orange-300 border border-orange-500/20"
              }`}>
                {feedback.message}
                {feedback.postponed && (
                  <p className="mt-1 text-[10px] opacity-70">⏳ Вернёмся к этому позже</p>
                )}
              </div>
            )}

            {isSkipped && (
              <div className="rounded-lg px-3 py-2 text-xs bg-yellow-500/10 text-yellow-300 border border-yellow-500/20">
                Пропущено — вернёмся позже 📌
              </div>
            )}

            {/* Allow retry on postponed/skipped questions */}
            {(isOpen && !isCorrect && !isPostponed) || (isOpen && (isSkipped || isPostponed)) ? (
              <div className="flex items-center gap-2 pl-1">
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSubmit(q);
                  }}
                  placeholder="Твой ответ (— для пропуска)…"
                  className="flex-1 rounded-lg border border-border bg-background px-3 py-1.5 text-xs text-foreground outline-none placeholder:text-muted-foreground focus:border-primary/50"
                  disabled={isLoading}
                  autoFocus
                />
                <button
                  onClick={() => handleSubmit(q)}
                  disabled={isLoading || !inputValue.trim()}
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground disabled:opacity-50"
                >
                  {isLoading ? (
                    <div className="h-3 w-3 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                  ) : (
                    <ArrowRight className="h-3.5 w-3.5" />
                  )}
                </button>
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
