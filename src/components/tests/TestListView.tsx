import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  CheckCircle2,
  ChevronRight,
  Circle,
  ClipboardCheck,
  Import,
  Plus,
  Search,
  Settings,
} from "lucide-react";
import DashboardShell, { DashboardEmptyHero, DashboardPanel } from "@/components/dashboard/DashboardShell";
import { TestsHeroIllustration } from "@/components/dashboard/DashboardIllustrations";
import { getSubjectDisplay } from "@/lib/progress-utils";
import type { Subject, UserTest } from "@/types/tutor";

interface Props {
  tests: UserTest[];
  groupedTests: Map<string, UserTest[]>;
  subjects: Subject[];
  selectedSubject: string;
  onSelectSubject: (subjectId: string) => void;
  onOpenTest: (test: UserTest) => void;
}

type StatusFilter = "all" | "drafts" | "completed";

function formatShortDate(value: string | null) {
  if (!value) return "—";

  return new Date(value).toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "short",
  });
}

export default function TestListView({
  tests,
  groupedTests: _groupedTests,
  subjects,
  selectedSubject,
  onSelectSubject,
  onOpenTest,
}: Props) {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const subjectMap = useMemo(() => new Map(subjects.map((subject) => [subject.id, subject])), [subjects]);

  const visibleTests = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return tests.filter((test) => {
      if (selectedSubject !== "all" && test.subject_id !== selectedSubject) return false;
      if (statusFilter === "drafts" && test.completed) return false;
      if (statusFilter === "completed" && !test.completed) return false;

      if (normalizedSearch) {
        const haystack = `${test.title} ${test.questions.map((question) => `${question.question} ${question.topic || ""}`).join(" ")}`.toLowerCase();
        if (!haystack.includes(normalizedSearch)) return false;
      }

      return true;
    });
  }, [searchTerm, selectedSubject, statusFilter, tests]);

  const groupedTests = useMemo(() => {
    const grouped = new Map<string, UserTest[]>();

    for (const test of visibleTests) {
      if (!grouped.has(test.subject_id)) {
        grouped.set(test.subject_id, []);
      }
      grouped.get(test.subject_id)?.push(test);
    }

    return grouped;
  }, [visibleTests]);

  const latestUpdate = tests[0]?.created_at ?? null;

  return (
    <DashboardShell
      title="Мои тесты"
      description="Создавайте тесты, управляйте ими и отслеживайте свой прогресс в обучении."
      searchValue={searchTerm}
      onSearchChange={setSearchTerm}
      overviewItems={[
        { label: "Всего", value: tests.length, tone: "blue" },
        { label: "Активно", value: tests.filter((test) => !test.completed).length, tone: "blue" },
        { label: "Завершено", value: tests.filter((test) => test.completed).length, tone: "amber" },
        { label: "Обновлено", value: formatShortDate(latestUpdate), tone: "slate" },
      ]}
      quickActions={[
        {
          label: "Добавить",
          icon: Plus,
          onClick: () => {
            if (subjects[0]) {
              navigate(`/subject/${subjects[0].id}`);
              return;
            }

            navigate("/");
          },
        },
        { label: "Импорт", icon: Import, onClick: () => navigate("/materials") },
        { label: "Настройки", icon: Settings, onClick: () => navigate("/profile") },
      ]}
      recentActivity={tests.length > 0 ? (
        <div className="space-y-2.5">
          {tests.slice(0, 3).map((test) => (
            <button
              key={test.id}
              type="button"
              onClick={() => onOpenTest(test)}
              className="w-full rounded-[16px] border border-[#ece7dd] bg-[#fcfbf8] px-3.5 py-2.5 text-left transition hover:border-[#d7e2fb]"
            >
              <p className="line-clamp-1 text-[13px] font-medium text-[#223761]">{test.title}</p>
              <p className="mt-1 text-[11px] text-[#8a97b2]">{formatShortDate(test.created_at)}</p>
            </button>
          ))}
        </div>
      ) : undefined}
      toolbar={(
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
          <label className="relative max-w-[280px] flex-1">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8a97b2]" strokeWidth={1.8} />
            <input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Поиск по тестам..."
              className="h-10 w-full rounded-[18px] border border-[#e7e1d8] bg-white pl-10 pr-4 text-[14px] text-[#223761] outline-none transition placeholder:text-[#8b99b4] focus:border-[#cedcff] focus:ring-4 focus:ring-[#2563eb]/8"
            />
          </label>

          <div className="inline-flex h-10 items-center rounded-[18px] border border-[#e7e1d8] bg-white p-1">
            {[
              { id: "all", label: "Все тесты" },
              { id: "drafts", label: "Черновики" },
              { id: "completed", label: "Пройденные" },
            ].map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setStatusFilter(item.id as StatusFilter)}
                className={`rounded-[12px] px-4 py-1.5 text-[13px] font-medium transition ${
                  statusFilter === item.id
                    ? "bg-[#eef4ff] text-[#2563eb]"
                    : "text-[#55688d] hover:text-[#2563eb]"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => {
              if (subjects[0]) {
                navigate(`/subject/${subjects[0].id}`);
                return;
              }

              navigate("/");
            }}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-[18px] bg-[#2563eb] px-4 text-[14px] font-medium text-white shadow-[0_18px_35px_rgba(37,99,235,0.22)] transition hover:bg-[#175cdf]"
          >
            <Plus className="h-4.5 w-4.5" strokeWidth={1.8} />
            Новый тест
          </button>
        </div>
      )}
    >
      {subjects.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => onSelectSubject("all")}
            className={`rounded-full border px-3.5 py-1.5 text-[12px] font-medium transition ${
              selectedSubject === "all"
                ? "border-[#dbe7ff] bg-[#eef4ff] text-[#2563eb]"
                : "border-[#e7e1d8] bg-white text-[#60708f] hover:text-[#2563eb]"
            }`}
          >
            Все предметы
          </button>
          {subjects.map((subject) => (
            <button
              key={subject.id}
              type="button"
              onClick={() => onSelectSubject(subject.id)}
              className={`rounded-full border px-3.5 py-1.5 text-[12px] font-medium transition ${
                selectedSubject === subject.id
                  ? "border-[#dbe7ff] bg-[#eef4ff] text-[#2563eb]"
                  : "border-[#e7e1d8] bg-white text-[#60708f] hover:text-[#2563eb]"
              }`}
            >
              {subject.icon} {subject.name}
            </button>
          ))}
        </div>
      )}

      {visibleTests.length === 0 ? (
        <DashboardEmptyHero
          illustration={<TestsHeroIllustration />}
          title="У вас пока нет тестов"
          description="Создайте свой первый тест, чтобы проверить знания и отслеживать прогресс в обучении."
          actions={(
            <>
              <button
                type="button"
                onClick={() => {
                  if (subjects[0]) {
                    navigate(`/subject/${subjects[0].id}`);
                    return;
                  }

                  navigate("/");
                }}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-[18px] bg-[#2563eb] px-4 text-[14px] font-medium text-white shadow-[0_18px_35px_rgba(37,99,235,0.22)] transition hover:bg-[#175cdf]"
              >
                <Plus className="h-4.5 w-4.5" strokeWidth={1.8} />
                Создать тест
              </button>
              <button
                type="button"
                onClick={() => navigate("/materials")}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-[18px] border border-[#e7e1d8] bg-white px-4 text-[14px] font-medium text-[#5d7095] transition hover:text-[#2563eb]"
              >
                <Import className="h-4.5 w-4.5" strokeWidth={1.8} />
                Импортировать
              </button>
            </>
          )}
        />
      ) : (
        <div className="space-y-4">
          {Array.from(groupedTests.entries()).map(([subjectId, subjectTests]) => {
            const { subject, fallbackName, fallbackAppearance } = getSubjectDisplay(subjectId, subjectMap);
            const icon = subject?.icon || fallbackAppearance.icon;

            return (
              <div key={subjectId} className="space-y-2.5">
                <div className="flex items-center gap-3">
                  <span className="grid h-10 w-10 place-items-center rounded-[12px] bg-[#f5f8ff] text-lg">
                    {icon}
                  </span>
                  <div>
                    <h2 className="font-serif text-[19px] font-semibold tracking-[-0.03em] text-[#132b5b]">
                      {subject?.name || fallbackName}
                    </h2>
                    <p className="text-[12px] text-[#8a97b2]">{subjectTests.length} тестов</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3.5 lg:grid-cols-2">
                  {subjectTests.map((test) => (
                    <DashboardPanel key={test.id} className="p-4">
                      <button
                        type="button"
                        onClick={() => onOpenTest(test)}
                        className="w-full text-left"
                      >
                        <div className="flex items-start gap-3">
                          {test.completed ? (
                            <CheckCircle2 className="mt-0.5 h-4.5 w-4.5 shrink-0 text-[#29a36a]" strokeWidth={1.9} />
                          ) : (
                            <Circle className="mt-0.5 h-4.5 w-4.5 shrink-0 text-[#8a97b2]" strokeWidth={1.9} />
                          )}
                          <div className="min-w-0 flex-1">
                            <h3 className="line-clamp-1 text-[15px] font-semibold tracking-[-0.03em] text-[#162d58]">
                              {test.title}
                            </h3>
                            <p className="mt-1.5 text-[12px] leading-5 text-[#7282a0]">
                              {test.questions.length} вопросов • {new Set(test.questions.map((question) => question.topic || "Общий блок")).size} тем
                              {test.completed && ` • ${test.score}%`}
                            </p>

                            <div className="mt-4 flex items-center justify-between gap-3">
                              <span className={`rounded-full border px-2.5 py-1 text-[11px] font-medium ${
                                test.completed
                                  ? "border-[#d8f0e4] bg-[#f2fbf6] text-[#249360]"
                                  : "border-[#e7e1d8] bg-[#fdfbf6] text-[#657792]"
                              }`}
                              >
                                {test.completed ? "Пройден" : "Черновик"}
                              </span>
                              <span className="inline-flex items-center gap-1 text-[13px] font-semibold text-[#2563eb]">
                                Открыть
                                <ChevronRight className="h-3.5 w-3.5" strokeWidth={1.8} />
                              </span>
                            </div>
                          </div>
                        </div>
                      </button>
                    </DashboardPanel>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </DashboardShell>
  );
}
