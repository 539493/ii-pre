import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ProgressRecord } from "@/types/tutor";
import { getAllSubjects } from "@/lib/subjects";
import { BarChart3, TrendingUp, Award, AlertCircle } from "lucide-react";

interface TopicSummary {
  topic: string;
  subjectId: string;
  totalQuestions: number;
  correctAnswers: number;
  score: number;
  lastStudied: string;
  hasSkipped: boolean;
}

export default function ProgressPage() {
  const [records, setRecords] = useState<ProgressRecord[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<string>("all");
  const subjects = getAllSubjects();

  useEffect(() => {
    loadProgress();
  }, []);

  async function loadProgress() {
    const { data } = await supabase
      .from("progress_records")
      .select("*")
      .order("created_at", { ascending: false });
    if (data) setRecords(data as any);
  }

  // Group by topic (not individual answers)
  const topicSummaries = useMemo(() => {
    const map = new Map<string, TopicSummary>();

    for (const r of records) {
      const key = `${r.subject_id}::${r.topic}`;
      const existing = map.get(key);
      if (existing) {
        existing.totalQuestions += r.total_questions;
        existing.correctAnswers += r.correct_answers;
        existing.score = existing.totalQuestions > 0
          ? Math.round((existing.correctAnswers / existing.totalQuestions) * 100)
          : 0;
        if (r.created_at > existing.lastStudied) existing.lastStudied = r.created_at;
        if (r.correct_answers === 0) existing.hasSkipped = true;
      } else {
        map.set(key, {
          topic: r.topic,
          subjectId: r.subject_id,
          totalQuestions: r.total_questions,
          correctAnswers: r.correct_answers,
          score: r.total_questions > 0 ? Math.round((r.correct_answers / r.total_questions) * 100) : 0,
          lastStudied: r.created_at,
          hasSkipped: r.correct_answers === 0,
        });
      }
    }

    return Array.from(map.values()).sort((a, b) => b.lastStudied.localeCompare(a.lastStudied));
  }, [records]);

  const filtered = selectedSubject === "all"
    ? topicSummaries
    : topicSummaries.filter((t) => t.subjectId === selectedSubject);

  const subjectStats = subjects.map((s) => {
    const topics = topicSummaries.filter((t) => t.subjectId === s.id);
    const totalQ = topics.reduce((a, t) => a + t.totalQuestions, 0);
    const totalC = topics.reduce((a, t) => a + t.correctAnswers, 0);
    const avgScore = totalQ > 0 ? Math.round((totalC / totalQ) * 100) : 0;
    const skippedTopics = topics.filter((t) => t.hasSkipped && t.score < 50).length;
    return { ...s, topicCount: topics.length, avgScore, totalQ, totalC, skippedTopics };
  });

  const gradeLabel = (score: number) => {
    if (score >= 90) return { text: "Отлично", color: "text-green-400" };
    if (score >= 70) return { text: "Хорошо", color: "text-blue-400" };
    if (score >= 50) return { text: "Удовл.", color: "text-yellow-400" };
    if (score > 0) return { text: "Нужна работа", color: "text-orange-400" };
    return { text: "Не пройдено", color: "text-red-400" };
  };

  return (
    <div className="page-shell">
      <section className="page-hero mb-6">
        <p className="page-kicker">Аналитика обучения</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-foreground">Моя успеваемость</h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">
          Смотри, какие темы уже освоены, где нужно повторение и как меняется качество ответов по каждому предмету.
        </p>
      </section>

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {subjectStats.map((s) => (
          <div
            key={s.id}
            className={`panel-surface cursor-pointer p-4 transition-all hover:-translate-y-0.5 ${
              selectedSubject === s.id ? "border-primary/50 ring-1 ring-primary/20" : ""
            }`}
            onClick={() => setSelectedSubject(selectedSubject === s.id ? "all" : s.id)}
          >
            <div className="flex items-center gap-3">
              <span className="text-3xl">{s.icon}</span>
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
                  className="h-full rounded-full bg-primary transition-all"
                  style={{ width: `${s.avgScore}%` }}
                />
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="panel-surface p-4">
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
              const subj = subjects.find((s) => s.id === t.subjectId);
              const grade = gradeLabel(t.score);
              const studiedDate = new Date(t.lastStudied);
              const now = new Date();
              const daysAgo = Math.floor((now.getTime() - studiedDate.getTime()) / (1000 * 60 * 60 * 24));
              const timeLabel = daysAgo === 0 ? "Сегодня" : daysAgo === 1 ? "Вчера" : `${daysAgo} дн. назад`;

              return (
                <div key={i} className="flex items-center gap-3 rounded-2xl border border-border/80 bg-secondary/50 px-4 py-3">
                  <span className="text-lg">{subj?.icon || "📚"}</span>
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
    </div>
  );
}
