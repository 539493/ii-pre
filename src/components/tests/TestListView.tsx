import { useMemo } from "react";
import { CheckCircle2, ChevronRight, Circle } from "lucide-react";
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

export default function TestListView({
  tests,
  groupedTests,
  subjects,
  selectedSubject,
  onSelectSubject,
  onOpenTest,
}: Props) {
  const subjectMap = useMemo(() => new Map(subjects.map((subject) => [subject.id, subject])), [subjects]);

  return (
    <div className="flex h-full flex-col overflow-y-auto p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Мои тесты</h1>
        <p className="mt-1 text-sm text-muted-foreground">Попроси в чате «составь тест», и он появится здесь одним цельным блоком</p>
      </div>

      {subjects.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-2">
          <button
            onClick={() => onSelectSubject("all")}
            className={`rounded-xl px-3 py-1.5 text-xs font-medium transition ${
              selectedSubject === "all"
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-muted-foreground hover:text-foreground"
            }`}
          >
            Все
          </button>
          {subjects.map((subject) => (
            <button
              key={subject.id}
              onClick={() => onSelectSubject(subject.id)}
              className={`rounded-xl px-3 py-1.5 text-xs font-medium transition ${
                selectedSubject === subject.id
                  ? "text-white"
                  : "bg-secondary text-muted-foreground hover:text-foreground"
              }`}
              style={selectedSubject === subject.id ? { backgroundColor: `hsl(${subject.color})` } : undefined}
            >
              {subject.icon} {subject.name}
            </button>
          ))}
        </div>
      )}

      {tests.length === 0 ? (
        <div className="flex flex-1 items-center justify-center">
          <div className="text-center">
            <p className="mb-3 text-4xl">📋</p>
            <p className="text-sm text-muted-foreground">Тестов пока нет</p>
            <p className="mt-1 text-xs text-muted-foreground">Напиши в чате предмета «составь тест»</p>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {Array.from(groupedTests.entries()).map(([subjectId, subjectTests]) => {
            const { subject, fallbackName, fallbackAppearance } = getSubjectDisplay(subjectId, subjectMap);
            const color = subject?.color || fallbackAppearance.color;

            return (
              <div key={subjectId}>
                <h2 className="mb-2 flex items-center gap-2 text-sm font-semibold text-foreground">
                  <span
                    className="flex h-8 w-8 items-center justify-center rounded-xl"
                    style={{ backgroundColor: `hsl(${color} / 0.14)` }}
                  >
                    {subject?.icon || fallbackAppearance.icon}
                  </span>
                  {subject?.name || fallbackName}
                </h2>
                <div className="space-y-2">
                  {subjectTests.map((test) => (
                    <button
                      key={test.id}
                      onClick={() => onOpenTest(test)}
                      className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left transition hover:border-primary/30 ${
                        test.completed ? "border-green-500/20 bg-green-500/5" : "border-border bg-card"
                      }`}
                      style={!test.completed ? { borderLeft: `4px solid hsl(${color})` } : undefined}
                    >
                      {test.completed ? (
                        <CheckCircle2 className="h-5 w-5 shrink-0 text-green-400" />
                      ) : (
                        <Circle className="h-5 w-5 shrink-0 text-muted-foreground" />
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-foreground">{test.title}</p>
                        <p className="text-xs text-muted-foreground">
                          Тест • {test.questions.length} вопросов • {new Set(test.questions.map((question) => question.topic || "Общий блок")).size} тем
                          {test.completed && ` • ${test.score}%`}
                        </p>
                      </div>
                      <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {subjects.length === 0 && tests.length === 0 && (
        <div className="mt-6 rounded-2xl border border-dashed border-border bg-card/40 px-6 py-8 text-center text-sm text-muted-foreground">
          После добавления предметов и создания теста он появится здесь автоматически.
        </div>
      )}
    </div>
  );
}
