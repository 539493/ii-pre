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
    <div className="space-y-2">
      <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#8a97b2]">
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
          <div key={i} className="space-y-1.5">
            <button
              onClick={() => {
                if (isCorrect) return;
                setOpenQuestion(isOpen ? null : q);
                setInputValue("");
              }}
              className={`w-full text-left rounded-[14px] border px-3 py-2.5 text-[12px] transition-all ${
                isCorrect
                  ? "border-[#d8f0e4] bg-[#f2fbf6] text-[#249360]"
                  : isSkipped
                  ? "border-[#f3e2b4] bg-[#fff8ea] text-[#9c7a2f]"
                  : isPostponed
                  ? "border-[#f1d8b8] bg-[#fff5e8] text-[#b86b31]"
                  : "border-[#ece7dd] bg-[#fcfbf8] text-[#5d7095] hover:border-[#d8e2fb] hover:text-[#223761] cursor-pointer"
              }`}
            >
              <div className="flex items-center gap-2">
                {isCorrect && <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-[#249360]" />}
                {isSkipped && <SkipForward className="h-3.5 w-3.5 shrink-0 text-[#c69a37]" />}
                {isPostponed && <RotateCcw className="h-3.5 w-3.5 shrink-0 text-[#d57d3d]" />}
                <span>{q}</span>
              </div>
            </button>

            {feedback && !isSkipped && (
              <div className={`whitespace-pre-line rounded-[12px] px-3 py-2 text-[12px] ${
                feedback.correct
                  ? "border border-[#d8f0e4] bg-[#f2fbf6] text-[#249360]"
                  : "border border-[#f1d8b8] bg-[#fff5e8] text-[#b86b31]"
              }`}>
                {feedback.message}
                {feedback.postponed && (
                  <p className="mt-1 text-[10px] opacity-70">⏳ Вернёмся к этому позже</p>
                )}
              </div>
            )}

            {isSkipped && (
              <div className="rounded-[12px] border border-[#f3e2b4] bg-[#fff8ea] px-3 py-2 text-[12px] text-[#9c7a2f]">
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
                  className="flex-1 rounded-[12px] border border-[#e7e1d8] bg-white px-3 py-2 text-[12px] text-[#223761] outline-none placeholder:text-[#8a97b2] focus:border-[#cedcff] focus:ring-4 focus:ring-[#2563eb]/8"
                  disabled={isLoading}
                  autoFocus
                />
                <button
                  onClick={() => handleSubmit(q)}
                  disabled={isLoading || !inputValue.trim()}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[12px] bg-[#2563eb] text-white disabled:opacity-50"
                >
                  {isLoading ? (
                    <div className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
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
