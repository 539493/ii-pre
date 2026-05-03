import { useEffect, useMemo, useState } from "react";
import {
  BarChart3,
  CheckCircle2,
  CircleDashed,
  ClipboardCheck,
  Clock3,
  Import,
  Info,
  Settings,
  Star,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import DashboardShell, { DashboardPanel, DashboardSectionTitle } from "@/components/dashboard/DashboardShell";
import {
  ActivityIllustration,
  MetricEmptyIllustration,
  MiniDocumentIllustration,
  ScoreIllustration,
} from "@/components/dashboard/DashboardIllustrations";
import { getAllSubjects, getSuggestedSubjectName, suggestSubjectAppearance } from "@/lib/subjects";
import {
  buildSubjectStats,
  buildTopicSummaries,
  getGradeLabel,
  getStudyTimeLabel,
} from "@/lib/progress-utils";
import { fetchProgressRecords } from "@/services/tutorData";
import type { ProgressRecord } from "@/types/tutor";

function formatShortDate(value: string | null) {
  if (!value) return "—";

  return new Date(value).toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "short",
  });
}

function EmptyAnalyticsCard({
  title,
  description,
  illustration,
}: {
  title: string;
  description: string;
  illustration: React.ReactNode;
}) {
  return (
    <DashboardPanel className="p-4">
      <DashboardSectionTitle
        title={title}
        trailing={<Info className="h-4.5 w-4.5 text-[#8a97b2]" strokeWidth={1.8} />}
      />
      <div className="flex min-h-[180px] flex-col items-center justify-center px-5 text-center">
        {illustration}
        <p className="mt-4 text-[13px] font-medium leading-6 text-[#6f7f9d]">{description}</p>
      </div>
    </DashboardPanel>
  );
}

export default function ProgressPage() {
  const navigate = useNavigate();
  const [records, setRecords] = useState<ProgressRecord[]>([]);
  const subjects = getAllSubjects();

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
  const subjectStats = useMemo(() => buildSubjectStats(subjects, topicSummaries), [subjects, topicSummaries]);
  const activeSubjects = subjectStats.filter((item) => item.topicCount > 0);
  const totalQuestions = topicSummaries.reduce((sum, item) => sum + item.totalQuestions, 0);
  const totalCorrect = topicSummaries.reduce((sum, item) => sum + item.correctAnswers, 0);
  const averageScore = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0;
  const completionPercent = topicSummaries.length > 0
    ? Math.round((topicSummaries.filter((item) => item.score >= 70).length / topicSummaries.length) * 100)
    : 0;
  const latestUpdate = topicSummaries[0]?.lastStudied ?? null;

  return (
    <DashboardShell
      title="Успеваемость"
      description="Отслеживайте свой прогресс и улучшайте результаты шаг за шагом."
      overviewItems={[
        { label: "Всего", value: records.length, tone: "blue" },
        { label: "Активно", value: activeSubjects.length, tone: "blue" },
        { label: "Завершено", value: topicSummaries.filter((item) => item.score >= 70).length, tone: "amber" },
        { label: "Обновлено", value: formatShortDate(latestUpdate), tone: "slate" },
      ]}
      quickActions={[
        { label: "Добавить", icon: ClipboardCheck, onClick: () => navigate("/tests") },
        { label: "Импорт", icon: Import, onClick: () => navigate("/materials") },
        { label: "Настройки", icon: Settings, onClick: () => navigate("/profile") },
      ]}
      recentActivity={topicSummaries.length > 0 ? (
        <div className="space-y-2.5">
          {topicSummaries.slice(0, 3).map((item) => {
            const subject = subjects.find((entry) => entry.id === item.subjectId);
            const fallbackName = getSuggestedSubjectName(item.subjectId);

            return (
              <div key={`${item.subjectId}-${item.topic}`} className="rounded-[16px] border border-[#ece7dd] bg-[#fcfbf8] px-3.5 py-2.5">
                <p className="line-clamp-1 text-[13px] font-medium text-[#223761]">
                  {subject?.icon || "📘"} {subject?.name || fallbackName}
                </p>
                <p className="mt-1 text-[11px] text-[#8a97b2]">{item.topic}</p>
              </div>
            );
          })}
        </div>
      ) : undefined}
    >
      <DashboardPanel className="px-5 py-4">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <div className="flex items-center gap-2.5">
            <BarChart3 className="h-5 w-5 text-[#8a97b2]" strokeWidth={1.8} />
            <div>
              <p className="text-[13px] text-[#7b89a5]">Всего предметов</p>
              <p className="text-[16px] font-semibold text-[#2563eb]">{subjects.length}</p>
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="h-5 w-5 text-[#8a97b2]" strokeWidth={1.8} />
            <div>
              <p className="text-[13px] text-[#7b89a5]">Активные предметы</p>
              <p className="text-[16px] font-semibold text-[#2563eb]">{activeSubjects.length}</p>
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            <ClipboardCheck className="h-5 w-5 text-[#8a97b2]" strokeWidth={1.8} />
            <div>
              <p className="text-[13px] text-[#7b89a5]">Тестов пройдено</p>
              <p className="text-[16px] font-semibold text-[#2563eb]">{records.length}</p>
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            <Clock3 className="h-5 w-5 text-[#8a97b2]" strokeWidth={1.8} />
            <div>
              <p className="text-[13px] text-[#7b89a5]">Затрачено времени</p>
              <p className="text-[16px] font-semibold text-[#2563eb]">0 ч</p>
            </div>
          </div>
        </div>
      </DashboardPanel>

      {topicSummaries.length === 0 ? (
        <div className="grid grid-cols-1 gap-3.5 lg:grid-cols-2">
          <EmptyAnalyticsCard
            title="Прогресс по предметам"
            description="Нет данных для отображения. Начните изучать предметы, и прогресс появится здесь."
            illustration={<MetricEmptyIllustration icon={BarChart3} />}
          />
          <EmptyAnalyticsCard
            title="Активность"
            description="Нет данных для отображения. Ваша активность появится здесь, когда вы начнёте учиться."
            illustration={<ActivityIllustration />}
          />
          <EmptyAnalyticsCard
            title="Процент завершения"
            description="Нет данных для отображения. Процент завершения появится здесь после изучения материалов."
            illustration={<MetricEmptyIllustration icon={CircleDashed} badge="0%" />}
          />
          <EmptyAnalyticsCard
            title="Средний балл"
            description="Нет данных для отображения. Средний балл появится здесь после прохождения тестов."
            illustration={<ScoreIllustration />}
          />
          <DashboardPanel className="p-4 lg:col-span-2">
            <DashboardSectionTitle
              title="Последние результаты"
              icon={ClipboardCheck}
              trailing={<Info className="h-4.5 w-4.5 text-[#8a97b2]" strokeWidth={1.8} />}
            />
            <div className="flex min-h-[96px] items-center justify-center gap-4 px-5 text-center md:justify-start">
              <MiniDocumentIllustration />
              <p className="max-w-[320px] text-[13px] leading-6 text-[#6f7f9d]">
                Нет результатов для отображения. Пройдите тесты, чтобы увидеть свои последние результаты здесь.
              </p>
            </div>
          </DashboardPanel>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3.5 lg:grid-cols-2">
          <DashboardPanel className="p-4">
            <DashboardSectionTitle title="Прогресс по предметам" icon={BarChart3} />
            <div className="space-y-3.5">
              {subjectStats.filter((item) => item.topicCount > 0).map((item) => (
                <div key={item.id}>
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className="grid h-9 w-9 place-items-center rounded-[12px] bg-[#f5f8ff] text-lg">
                        {item.icon}
                      </span>
                      <div>
                        <p className="text-[14px] font-medium text-[#223761]">{item.name}</p>
                        <p className="text-[11px] text-[#8a97b2]">{item.topicCount} тем изучено</p>
                      </div>
                    </div>
                    <p className="text-[14px] font-semibold text-[#2563eb]">{item.avgScore}%</p>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-[#eee9df]">
                    <div
                      className="h-full rounded-full bg-[#2563eb]"
                      style={{ width: `${item.avgScore}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </DashboardPanel>

          <DashboardPanel className="p-4">
            <DashboardSectionTitle title="Активность" icon={Clock3} />
            <div className="space-y-2.5">
              {topicSummaries.slice(0, 5).map((item) => {
                const subject = subjects.find((entry) => entry.id === item.subjectId);
                const fallbackName = getSuggestedSubjectName(item.subjectId);
                const time = getStudyTimeLabel(item.lastStudied);

                return (
                  <div key={`${item.subjectId}-${item.topic}`} className="rounded-[16px] border border-[#ece7dd] bg-[#fcfbf8] px-3.5 py-2.5">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-[13px] font-medium text-[#223761]">
                        {subject?.icon || "📘"} {subject?.name || fallbackName}
                      </p>
                      <span className="text-[11px] text-[#8a97b2]">{time.timeLabel}</span>
                    </div>
                    <p className="mt-1 text-[12px] text-[#6f7f9d]">{item.topic}</p>
                  </div>
                );
              })}
            </div>
          </DashboardPanel>

          <DashboardPanel className="p-4">
            <DashboardSectionTitle title="Процент завершения" icon={CircleDashed} />
            <div className="flex min-h-[180px] flex-col items-center justify-center text-center">
              <MetricEmptyIllustration icon={CircleDashed} badge={`${completionPercent}%`} />
              <p className="mt-4 text-[13px] leading-6 text-[#6f7f9d]">
                Процент тем с уверенным прохождением и результатом выше среднего.
              </p>
            </div>
          </DashboardPanel>

          <DashboardPanel className="p-4">
            <DashboardSectionTitle title="Средний балл" icon={Star} />
            <div className="flex min-h-[180px] flex-col items-center justify-center text-center">
              <MetricEmptyIllustration icon={Star} badge={`${averageScore}%`} />
              <p className="mt-4 text-[14px] font-medium text-[#223761]">{getGradeLabel(averageScore).text}</p>
              <p className="mt-2 text-[13px] leading-6 text-[#6f7f9d]">
                Средний результат по всем сохранённым попыткам и изученным темам.
              </p>
            </div>
          </DashboardPanel>

          <DashboardPanel className="p-4 lg:col-span-2">
            <DashboardSectionTitle title="Последние результаты" icon={ClipboardCheck} />
            <div className="space-y-2.5">
              {topicSummaries.slice(0, 6).map((item) => {
                const subject = subjects.find((entry) => entry.id === item.subjectId);
                const fallbackName = getSuggestedSubjectName(item.subjectId);
                const fallbackAppearance = suggestSubjectAppearance(subject?.name || fallbackName);

                return (
                  <div
                    key={`${item.subjectId}-${item.topic}-result`}
                    className="flex items-center gap-3 rounded-[16px] border border-[#ece7dd] bg-[#fcfbf8] px-3.5 py-2.5"
                    style={{ borderLeft: `4px solid hsl(${subject?.color || fallbackAppearance.color})` }}
                  >
                    <div className="grid h-10 w-10 place-items-center rounded-[12px] bg-[#f5f8ff] text-lg">
                      {subject?.icon || fallbackAppearance.icon}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-1 text-[14px] font-medium text-[#223761]">{item.topic}</p>
                      <p className="mt-1 text-[11px] text-[#8a97b2]">
                        {subject?.name || fallbackName} • {item.correctAnswers}/{item.totalQuestions} верно
                      </p>
                    </div>
                    <span className="text-[14px] font-semibold text-[#2563eb]">{item.score}%</span>
                  </div>
                );
              })}
            </div>
          </DashboardPanel>
        </div>
      )}
    </DashboardShell>
  );
}
