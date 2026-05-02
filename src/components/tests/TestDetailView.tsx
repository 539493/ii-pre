import { CheckCircle2, Trophy } from "lucide-react";
import type { TestAnswerFeedback, TestQuestion, TestSection, UserTest } from "@/types/tutor";

interface Props {
  test: UserTest;
  sections: TestSection[];
  answers: Record<string, string>;
  feedback: Record<string, TestAnswerFeedback>;
  checking: string | null;
  onBack: () => void;
  onAnswerChange: (questionId: string, value: string) => void;
  onCheckAnswer: (question: TestQuestion) => void;
}

export default function TestDetailView({
  test,
  sections,
  answers,
  feedback,
  checking,
  onBack,
  onAnswerChange,
  onCheckAnswer,
}: Props) {
  return (
    <div className="flex h-full flex-col overflow-y-auto p-6">
      <button onClick={onBack} className="mb-4 flex items-center gap-1 text-sm text-muted-foreground transition hover:text-foreground">
        ← Назад к тестам
      </button>
      <div className="mb-4">
        <h1 className="text-xl font-bold text-foreground">{test.title}</h1>
        <p className="text-sm text-muted-foreground">
          Тест • {test.questions.length} вопросов • {sections.length} тем
        </p>
        {test.completed && (
          <div className="mt-2 flex items-center gap-2 text-sm text-green-400">
            <Trophy className="h-4 w-4" /> Пройдено! Результат: {test.score}%
          </div>
        )}
      </div>

      <div className="space-y-4">
        {sections.map((section, sectionIndex) => (
          <div key={section.topic} className="rounded-2xl border border-border bg-card p-4">
            <div className="mb-4 flex items-center justify-between gap-3 border-b border-border pb-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  Тема {sectionIndex + 1}
                </p>
                <h2 className="mt-1 text-lg font-semibold text-foreground">{section.topic}</h2>
              </div>
              <span className="rounded-full border border-border bg-secondary px-3 py-1 text-xs text-muted-foreground">
                {section.questions.length} вопросов
              </span>
            </div>

            <div className="space-y-4">
              {section.questions.map((question, questionIndex) => {
                const globalIndex = test.questions.findIndex((item) => item.id === question.id);
                const existingResult = test.results?.[question.id];
                const currentFeedback = feedback[question.id];
                const isCorrect = currentFeedback?.correct || existingResult?.correct;

                return (
                  <div
                    key={question.id}
                    className={`rounded-2xl border p-4 transition-all ${
                      isCorrect ? "border-green-500/30 bg-green-500/5" : "border-border bg-card"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/20 text-xs font-bold text-primary">
                        {globalIndex >= 0 ? globalIndex + 1 : questionIndex + 1}
                      </span>
                      <div className="flex-1 space-y-2">
                        <p className="text-sm font-medium text-foreground">{question.question}</p>
                        {isCorrect ? (
                          <div className="flex items-center gap-2 text-sm text-green-400">
                            <CheckCircle2 className="h-4 w-4" />
                            {existingResult ? `Ответ: ${existingResult.answer}` : "Верно!"}
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <input
                              value={answers[question.id] || ""}
                              onChange={(event) => onAnswerChange(question.id, event.target.value)}
                              onKeyDown={(event) => {
                                if (event.key === "Enter") {
                                  onCheckAnswer(question);
                                }
                              }}
                              placeholder="Твой ответ..."
                              className="flex-1 rounded-xl border border-border bg-secondary px-3 py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-primary/50"
                              disabled={checking === question.id}
                            />
                            <button
                              onClick={() => onCheckAnswer(question)}
                              disabled={checking === question.id || !answers[question.id]?.trim()}
                              className="rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
                            >
                              {checking === question.id ? "..." : "Проверить"}
                            </button>
                          </div>
                        )}
                        {currentFeedback && !currentFeedback.correct && (
                          <div className="whitespace-pre-line rounded-lg border border-orange-500/20 bg-orange-500/10 px-3 py-2 text-xs text-orange-300">
                            {currentFeedback.message}
                            {currentFeedback.attempts >= 3 && (
                              <p className="mt-1 text-[10px] opacity-70">💡 Подсказка: {question.hint}</p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
