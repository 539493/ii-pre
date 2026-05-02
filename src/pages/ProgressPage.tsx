import { useState, useEffect, useMemo } from "react";
import { ProgressRecord } from "@/types/tutor";
import { getAllSubjects, getSuggestedSubjectName, suggestSubjectAppearance } from "@/lib/subjects";
import { buildSubjectStats, buildTopicSummaries, getGradeLabel, getStudyTimeLabel } from "@/lib/progress-utils";
import { fetchProgressRecords } from "@/services/tutorData";
import { BarChart3, TrendingUp, Award, AlertCircle } from "lucide-react";

export default function ProgressPage() {
  const [records, setRecords] = useState<ProgressRecord[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<string>("all");
  const subjects = getAllSubjects();
  const subjectMap = useMemo(() => new Map(subjects.map((subject) => [subject.id, subject])), [subjects]);

  useEffect(() => {
    void loadProgress();
  }, []);

  async function loadProgress() {
    try {
      setRecords(await fetchProgressRecords());
    } catch {
      setRecords([]);
    }
  }

  const topicSummaries = useMemo(() => buildTopicSummaries(records), [records]);

  const filtered = selectedSubject === "all"
    ? topicSummaries
    : topicSummaries.filter((t) => t.subjectId === selectedSubject);

  const subjectStats = useMemo(() => buildSubjectStats(subjects, topicSummaries), [subjects, topicSummaries]);

  return (
    <div className="flex h-full flex-col overflow-y-auto p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Моя успеваемость</h1>
        <p className="mt-1 text-sm text-muted-foreground">Аналитика по изученным темам и оценки</p>
      </div>

      {/* Subject cards */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {subjectStats.map((s) => (
          <div
            key={s.id}
            className={`cursor-pointer rounded-2xl border bg-card p-4 shadow transition-all hover:border-primary/30 ${
              selectedSubject === s.id ? "border-primary/50 ring-1 ring-primary/20" : "border-border"
            }`}
            style={{
              boxShadow: selectedSubject === s.id ? `0 0 0 1px hsl(${s.color} / 0.22)` : undefined,
            }}
            onClick={() => setSelectedSubject(selectedSubject === s.id ? "all" : s.id)}
          >
            <div className="flex items-center gap-3">
              <div
                className="flex h-12 w-12 items-center justify-center rounded-2xl text-2xl"
                style={{ backgroundColor: `hsl(${s.color} / 0.14)` }}
              >
                {s.icon}
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-card-foreground">{s.name}</h3>
                <p className="text-xs text-muted-foreground">{s.topicCount} тем изучено</p>
                {s.skippedTopics > 0 && (
                  <p className="text-xs text-orange-400">{s.skippedTopics} тем нужно повторить</p>
                )}
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-primary">{s.avgScore}%</div>
                <p className="text-xs text-muted-foreground">средний балл</p>
              </div>
            </div>
            {s.totalQ > 0 && (
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-secondary">
                <div
                  className="h-full rounded-full transition-all"
                  style={{ backgroundColor: `hsl(${s.color})`, width: `${s.avgScore}%` }}
                  aria-hidden="true"
                />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Topic list grouped by theme */}
      <div className="rounded-2xl border border-border bg-card p-4 shadow-lg">
        <div className="mb-3 flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold text-card-foreground">
            {selectedSubject === "all" ? "Все темы" : subjects.find((s) => s.id === selectedSubject)?.name}
          </h2>
        </div>

        {filtered.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            Пока нет данных. Начни изучать предмет, чтобы увидеть прогресс!
          </p>
        ) : (
          <div className="space-y-2">
            {filtered.map((t, i) => {
              const subj = subjectMap.get(t.subjectId);
              const fallbackName = getSuggestedSubjectName(t.subjectId);
              const fallbackAppearance = suggestSubjectAppearance(subj?.name || fallbackName);
              const color = subj?.color || fallbackAppearance.color;
              const grade = getGradeLabel(t.score);
              const { date: studiedDate, timeLabel } = getStudyTimeLabel(t.lastStudied);

              return (
                <div
                  key={i}
                  className="flex items-center gap-3 rounded-xl border border-border bg-secondary/50 px-4 py-3"
                  style={{ borderLeft: `4px solid hsl(${color})` }}
                >
                  <div
                    className="flex h-10 w-10 items-center justify-center rounded-xl text-lg"
                    style={{ backgroundColor: `hsl(${color} / 0.14)` }}
                  >
                    {subj?.icon || fallbackAppearance.icon}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">{t.topic}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{t.correctAnswers}/{t.totalQuestions} верно</span>
                      <span>•</span>
                      <span>{timeLabel}</span>
                      <span>•</span>
                      <span>{studiedDate.toLocaleDateString("ru", { day: "numeric", month: "short" })}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {t.hasSkipped && t.score < 50 && (
                      <span title="Нужно повторить"><AlertCircle className="h-4 w-4 text-orange-400" /></span>
                    )}
                    {t.score >= 80 ? (
                      <Award className="h-4 w-4 text-yellow-400" />
                    ) : t.score >= 50 ? (
                      <TrendingUp className="h-4 w-4 text-primary" />
                    ) : null}
                    <div className="text-right">
                      <span className={`text-sm font-bold ${grade.color}`}>{t.score}%</span>
                      <p className={`text-[10px] ${grade.color}`}>{grade.text}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {subjects.length === 0 && records.length === 0 && (
        <div className="mt-6 rounded-2xl border border-dashed border-border bg-card/40 px-6 py-8 text-center text-sm text-muted-foreground">
          Сначала добавь предметы на главной странице. После занятий и тестов здесь появится аналитика.
        </div>
      )}
    </div>
  );
}
