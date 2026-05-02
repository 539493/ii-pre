import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, CheckCircle2, ClipboardCheck, Import, Trophy, UserRound } from "lucide-react";
import DashboardShell, { DashboardPanel } from "@/components/dashboard/DashboardShell";
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
  const navigate = useNavigate();
  const answeredCount = useMemo(
    () => Object.values(test.results || {}).filter((item) => item.correct).length,
    [test.results],
  );

  return (
    <DashboardShell
      title={test.title}
      description={`Тест • ${test.questions.length} вопросов • ${sections.length} тем`}
      overviewItems={[
        { label: "Всего", value: test.questions.length, tone: "blue" },
        { label: "Активно", value: test.questions.length - answeredCount, tone: "blue" },
        { label: "Завершено", value: answeredCount, tone: "amber" },
        { label: "Результат", value: `${test.score}%`, tone: "slate" },
      ]}
      quickActions={[
        { label: "Добавить", icon: ClipboardCheck, onClick: onBack },
        { label: "Импорт", icon: Import, onClick: () => navigate("/materials") },
        { label: "Настройки", icon: UserRound, onClick: () => navigate("/profile") },
      ]}
      recentActivity={test.completed ? (
        <div className="rounded-[18px] border border-[#d8f0e4] bg-[#f2fbf6] px-4 py-3">
          <p className="text-[14px] font-medium text-[#249360]">Тест завершён</p>
          <p className="mt-1 text-[12px] text-[#63a883]">Результат: {test.score}%</p>
        </div>
      ) : undefined}
      toolbar={(
        <button
          type="button"
          onClick={onBack}
          className="inline-flex h-11 items-center gap-2 rounded-2xl border border-[#e7e1d8] bg-white px-4 text-[15px] font-medium text-[#5d7095] transition hover:text-[#2563eb]"
        >
          <ArrowLeft className="h-4.5 w-4.5" strokeWidth={1.8} />
          Назад к тестам
        </button>
      )}
    >
      {test.completed && (
        <DashboardPanel className="border-[#d8f0e4] bg-[#f6fcf8] p-5">
          <div className="flex items-center gap-3 text-[15px] font-medium text-[#249360]">
            <Trophy className="h-5 w-5" strokeWidth={1.8} />
            Тест пройден. Итоговый результат: {test.score}%
          </div>
        </DashboardPanel>
      )}

      <div className="space-y-4">
        {sections.map((section, sectionIndex) => (
          <DashboardPanel key={section.topic} className="p-5">
            <div className="mb-5 flex items-center justify-between gap-3 border-b border-[#eee8de] pb-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#9aa7bf]">
                  Тема {sectionIndex + 1}
                </p>
                <h2 className="mt-2 font-serif text-[24px] font-semibold tracking-[-0.03em] text-[#132b5b]">
                  {section.topic}
                </h2>
              </div>
              <span className="rounded-full border border-[#ece6da] bg-[#fdfbf6] px-3 py-1.5 text-[12px] font-medium text-[#5d7095]">
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
                    className={`rounded-[22px] border p-4 transition ${
                      isCorrect
                        ? "border-[#d8f0e4] bg-[#f2fbf6]"
                        : "border-[#ece7dd] bg-[#fcfbf8]"
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#eef4ff] text-[12px] font-semibold text-[#2563eb]">
                        {globalIndex >= 0 ? globalIndex + 1 : questionIndex + 1}
                      </span>
                      <div className="flex-1 space-y-3">
                        <p className="text-[15px] font-medium leading-7 text-[#223761]">{question.question}</p>
                        {isCorrect ? (
                          <div className="flex items-center gap-2 text-[14px] text-[#249360]">
                            <CheckCircle2 className="h-4.5 w-4.5" strokeWidth={1.8} />
                            {existingResult ? `Ответ: ${existingResult.answer}` : "Верно!"}
                          </div>
                        ) : (
                          <div className="flex flex-col gap-3 sm:flex-row">
                            <input
                              value={answers[question.id] || ""}
                              onChange={(event) => onAnswerChange(question.id, event.target.value)}
                              onKeyDown={(event) => {
                                if (event.key === "Enter") {
                                  onCheckAnswer(question);
                                }
                              }}
                              placeholder="Твой ответ..."
                              className="flex-1 rounded-2xl border border-[#e7e1d8] bg-white px-4 py-2.5 text-[14px] text-[#223761] outline-none transition placeholder:text-[#8b99b4] focus:border-[#cedcff] focus:ring-4 focus:ring-[#2563eb]/8"
                              disabled={checking === question.id}
                            />
                            <button
                              type="button"
                              onClick={() => onCheckAnswer(question)}
                              disabled={checking === question.id || !answers[question.id]?.trim()}
                              className="rounded-2xl bg-[#2563eb] px-5 py-2.5 text-[14px] font-medium text-white transition hover:bg-[#175cdf] disabled:cursor-not-allowed disabled:bg-[#98a2b3]"
                            >
                              {checking === question.id ? "..." : "Проверить"}
                            </button>
                          </div>
                        )}
                        {currentFeedback && !currentFeedback.correct && (
                          <div className="whitespace-pre-line rounded-[18px] border border-[#f1d8b8] bg-[#fff8ea] px-4 py-3 text-[13px] leading-6 text-[#8d6b31]">
                            {currentFeedback.message}
                            {currentFeedback.attempts >= 3 && (
                              <p className="mt-2 text-[12px] opacity-80">Подсказка: {question.hint}</p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </DashboardPanel>
        ))}
      </div>
    </DashboardShell>
  );
}
