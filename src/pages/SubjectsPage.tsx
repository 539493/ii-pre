import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowUpRight,
  Brain,
  ChevronRight,
  CircleAlert,
  MoreHorizontal,
  Plus,
  RotateCcw,
  Sparkles,
  Target,
} from "lucide-react";
import {
  buildDailyMissions,
  buildMistakeNotebook,
  buildSubjectLearningSnapshots,
  buildWeakTopicInsights,
  type DailyMission,
  type MistakeNotebookEntry,
  type SubjectLearningSnapshot,
  type WeakTopicInsight,
} from "@/lib/learning-insights";
import {
  getCustomSubjects,
  removeCustomSubject,
  saveCustomSubject,
  suggestSubjectAppearance,
} from "@/lib/subjects";
import { getOrCreateDeviceId } from "@/lib/tutor-session";
import { cn } from "@/lib/utils";
import {
  DashboardEmptyHero,
  DashboardPanel,
  DashboardSectionTitle,
} from "@/components/dashboard/DashboardShell";
import DashboardShell from "@/components/dashboard/DashboardShell";
import { SubjectsHeroIllustration } from "@/components/dashboard/DashboardIllustrations";
import { fetchProgressRecords, fetchUserTests } from "@/services/tutorData";
import type { ProgressRecord, Subject, UserTest } from "@/types/tutor";

type SubjectTone = "blue" | "amber" | "green" | "violet";

type SubjectCardViewModel = {
  id: string;
  title: string;
  description: string;
  icon: string;
  progress: number;
  tests: number;
  topics: number;
  lastActivity: string;
  tone: SubjectTone;
  templateLabel: string;
  nextFocus: string;
  weakTopics: number;
};

const toneStyles: Record<SubjectTone, { soft: string; bar: string; accent: string }> = {
  blue: {
    soft: "border-[#dbe7ff] bg-[#eef4ff] text-[#2563eb]",
    bar: "bg-[#2563eb]",
    accent: "text-[#2563eb]",
  },
  amber: {
    soft: "border-[#f1e2be] bg-[#fff8ea] text-[#be8c27]",
    bar: "bg-[#d3a34e]",
    accent: "text-[#c4902e]",
  },
  green: {
    soft: "border-[#dcefe7] bg-[#eff8f4] text-[#1f8d62]",
    bar: "bg-[#1f8d62]",
    accent: "text-[#1f8d62]",
  },
  violet: {
    soft: "border-[#e8dff8] bg-[#f4f0ff] text-[#7a48d6]",
    bar: "bg-[#7a48d6]",
    accent: "text-[#7a48d6]",
  },
};

function getSubjectTone(subject: Subject, index: number): SubjectTone {
  const normalized = subject.name.toLowerCase();

  if (normalized.includes("мат") || normalized.includes("алгеб") || normalized.includes("геом")) return "blue";
  if (normalized.includes("истор") || normalized.includes("литер") || normalized.includes("прав")) return "amber";
  if (normalized.includes("био") || normalized.includes("хим") || normalized.includes("гео")) return "green";
  if (normalized.includes("англ") || normalized.includes("информ") || normalized.includes("язык")) return "violet";

  return (["blue", "amber", "green", "violet"] as SubjectTone[])[index % 4];
}

function mapSubjectsToCards(
  subjects: Subject[],
  snapshotsBySubject: Map<string, SubjectLearningSnapshot>,
): SubjectCardViewModel[] {
  return subjects.map((subject, index) => {
    const appearance = suggestSubjectAppearance(subject.name);
    const snapshot = snapshotsBySubject.get(subject.id);

    return {
      id: subject.id,
      title: subject.name,
      description: subject.description,
      icon: subject.icon,
      progress: snapshot?.avgScore || 0,
      tests: snapshot?.testsCount || 0,
      topics: snapshot?.topicCount || 0,
      lastActivity: snapshot?.lastActivityLabel || "Пока нет данных",
      tone: getSubjectTone(subject, index),
      templateLabel: appearance.templateLabel,
      nextFocus: snapshot?.nextFocus || "Начни с короткого объяснения по теме",
      weakTopics: snapshot?.weakTopicsCount || 0,
    };
  });
}

function getMissionTone(kind: DailyMission["kind"]) {
  switch (kind) {
    case "mistake-review":
      return {
        badge: "Повторение",
        badgeClass: "border-[#f1ddbd] bg-[#fff8ec] text-[#a36d20]",
        icon: RotateCcw,
      };
    case "finish-test":
      return {
        badge: "Тест",
        badgeClass: "border-[#d7e4ff] bg-[#eef4ff] text-[#2563eb]",
        icon: Target,
      };
    case "weak-topic":
      return {
        badge: "Слабая тема",
        badgeClass: "border-[#ece2ff] bg-[#f7f2ff] text-[#7a48d6]",
        icon: Brain,
      };
    default:
      return {
        badge: "Старт",
        badgeClass: "border-[#dcefe7] bg-[#eff8f4] text-[#1f8d62]",
        icon: Sparkles,
      };
  }
}

function AddSubjectTile({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex h-[132px] w-full flex-col justify-between rounded-[18px] border border-dashed border-[#d7deeb] bg-[linear-gradient(180deg,#ffffff_0%,#fbfcff_100%)] p-4 text-left shadow-[0_14px_28px_rgba(15,23,42,0.03)] transition hover:border-[#c7d8ff] hover:shadow-[0_18px_34px_rgba(37,99,235,0.08)]"
    >
      <div className="flex items-center justify-between">
        <span className="grid h-8 w-8 place-items-center rounded-[12px] border border-[#d9e4fb] bg-[#f5f8ff] text-[#2563eb] transition group-hover:bg-[#eef4ff]">
          <Plus className="h-4.5 w-4.5" strokeWidth={1.9} />
        </span>
        <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#a0acc1]">Новый</span>
      </div>
      <div>
        <span className="text-[15px] font-semibold tracking-[-0.02em] text-[#28416d]">Добавить предмет</span>
        <p className="mt-1 text-[12px] leading-5 text-[#7f8ba4]">
          Создай новое пространство и сразу встрои его в учебный ритм.
        </p>
      </div>
    </button>
  );
}

function SubjectCard({
  subject,
  onOpen,
  onDelete,
}: {
  subject: SubjectCardViewModel;
  onOpen: () => void;
  onDelete: () => void;
}) {
  const tone = toneStyles[subject.tone];

  return (
    <DashboardPanel className="p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-[14px] border border-[#e8edf7] bg-[#fbfcff] text-[22px] shadow-[0_10px_18px_rgba(15,23,42,0.04)]">
            {subject.icon}
          </div>
          <div>
            <h3 className="text-[15px] font-semibold tracking-[-0.03em] text-[#162d58]">
              {subject.title}
            </h3>
            <p className="mt-1 text-[11px] text-[#8a97b2]">{subject.lastActivity}</p>
          </div>
        </div>

        <button
          type="button"
          onClick={onDelete}
          className="grid h-8 w-8 place-items-center rounded-full text-[#9aa7bf] transition hover:bg-[#f5f7fb] hover:text-[#244477]"
          aria-label={`Удалить предмет ${subject.title}`}
        >
          <MoreHorizontal className="h-4 w-4" strokeWidth={1.8} />
        </button>
      </div>

      <p className="mt-3 min-h-[44px] text-[12px] leading-[1.35rem] text-[#7282a0]">
        {subject.description}
      </p>

      <div className="mt-3 rounded-[16px] border border-[#ece7dd] bg-[#fcfbf8] px-3 py-2.5">
        <div className="flex items-center justify-between gap-2">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#8a97b2]">
            Следующий фокус
          </p>
          <span className={cn(
            "rounded-full px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.14em]",
            subject.weakTopics > 0
              ? "bg-[#fff4e6] text-[#a36d20]"
              : "bg-[#eff8f4] text-[#1f8d62]",
          )}>
            {subject.weakTopics > 0 ? `${subject.weakTopics} тем на повтор` : "В ритме"}
          </span>
        </div>
        <p className="mt-1.5 line-clamp-2 text-[12px] leading-5 text-[#31466e]">{subject.nextFocus}</p>
      </div>

      <div className="mt-3.5">
        <div className="mb-2 flex items-center justify-between text-[11px] font-medium">
          <span className="text-[#6f7f9d]">Уверенность по предмету</span>
          <span className="text-[#1b315d]">{subject.progress}%</span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-[#eee9df]">
          <div className={cn("h-full rounded-full", tone.bar)} style={{ width: `${subject.progress}%` }} />
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2.5">
        <div className={cn("rounded-[16px] border px-3 py-2.5", tone.soft)}>
          <div className="text-[16px] font-semibold leading-none">{subject.tests}</div>
          <div className="mt-1 text-[9px] font-semibold uppercase tracking-[0.16em] opacity-75">
            тестов
          </div>
        </div>
        <div className="rounded-[16px] border border-[#ede7dd] bg-[#fdfcf8] px-3 py-2.5">
          <div className="text-[16px] font-semibold leading-none text-[#162d58]">{subject.topics}</div>
          <div className="mt-1 text-[9px] font-semibold uppercase tracking-[0.16em] text-[#8a97b2]">
            тем
          </div>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between gap-3">
        <span className={cn(
          "rounded-full border px-2.5 py-1 text-[8px] font-semibold uppercase tracking-[0.18em]",
          subject.weakTopics > 0
            ? "border-[#f0dfbf] bg-[#fff9ef] text-[#ad7728]"
            : "border-[#ece6da] bg-[#fdfbf6] text-[#9aa7bf]",
        )}>
          {subject.weakTopics > 0 ? "Есть слабые темы" : subject.templateLabel}
        </span>
        <button
          type="button"
          onClick={onOpen}
          className={cn(
            "inline-flex items-center gap-1 text-[12px] font-semibold transition hover:translate-x-0.5",
            tone.accent,
          )}
        >
          Открыть предмет
          <ChevronRight className="h-3.5 w-3.5" strokeWidth={1.8} />
        </button>
      </div>
    </DashboardPanel>
  );
}

function MissionCard({
  mission,
  onOpen,
}: {
  mission: DailyMission;
  onOpen: () => void;
}) {
  const tone = getMissionTone(mission.kind);
  const Icon = tone.icon;

  return (
    <button
      type="button"
      onClick={onOpen}
      className="group flex h-full flex-col rounded-[18px] border border-[#ebe5da] bg-[linear-gradient(180deg,#ffffff_0%,#fcfbf8_100%)] p-4 text-left transition hover:border-[#d5e0fb] hover:shadow-[0_14px_30px_rgba(37,99,235,0.08)]"
    >
      <div className="flex items-start justify-between gap-3">
        <span className={cn("inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em]", tone.badgeClass)}>
          <Icon className="h-3.5 w-3.5" strokeWidth={1.9} />
          {tone.badge}
        </span>
        <ArrowUpRight className="h-4 w-4 text-[#9aa7bf] transition group-hover:text-[#2563eb]" strokeWidth={1.8} />
      </div>

      <h3 className="mt-3 font-serif text-[20px] font-semibold leading-tight tracking-[-0.03em] text-[#132b5b]">
        {mission.title}
      </h3>
      <p className="mt-2 text-[12px] leading-5 text-[#7282a0]">{mission.description}</p>

      <span className="mt-4 inline-flex items-center gap-1 text-[12px] font-semibold text-[#2563eb]">
        {mission.ctaLabel}
        <ChevronRight className="h-3.5 w-3.5" strokeWidth={1.8} />
      </span>
    </button>
  );
}

function WeakTopicCard({
  item,
  onOpen,
}: {
  item: WeakTopicInsight;
  onOpen: () => void;
}) {
  return (
    <div className="rounded-[18px] border border-[#ece7dd] bg-[#fcfbf8] px-4 py-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#98a4bb]">
            {item.subjectIcon} {item.subjectName}
          </p>
          <h3 className="mt-1.5 line-clamp-2 text-[14px] font-semibold leading-5 text-[#213a67]">
            {item.topic}
          </h3>
        </div>
        <span className={cn(
          "shrink-0 rounded-full border px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.14em]",
          item.confidence === "weak"
            ? "border-[#f0dfbf] bg-[#fff8ea] text-[#a36d20]"
            : item.confidence === "fragile"
              ? "border-[#dddff8] bg-[#f5f3ff] text-[#6f52c9]"
              : "border-[#d9efe3] bg-[#eff8f4] text-[#1f8d62]",
        )}>
          {item.confidenceLabel}
        </span>
      </div>

      <div className="mt-3 flex items-center justify-between gap-3">
        <div className="text-[11px] text-[#7f8ba4]">
          {item.activityLabel}
          {item.mistakeCount > 0 && ` • ошибок: ${item.mistakeCount}`}
        </div>
        <div className="text-[13px] font-semibold text-[#132b5b]">{item.score}%</div>
      </div>

      <button
        type="button"
        onClick={onOpen}
        className="mt-3 inline-flex items-center gap-1 text-[12px] font-semibold text-[#2563eb]"
      >
        Открыть предмет
        <ChevronRight className="h-3.5 w-3.5" strokeWidth={1.8} />
      </button>
    </div>
  );
}

function MistakeCard({
  item,
  onOpen,
}: {
  item: MistakeNotebookEntry;
  onOpen: () => void;
}) {
  return (
    <div className="rounded-[18px] border border-[#ece7dd] bg-[#fcfbf8] px-4 py-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#98a4bb]">
            {item.subjectIcon} {item.subjectName} • {item.topic}
          </p>
          <h3 className="mt-1.5 line-clamp-2 text-[14px] font-semibold leading-5 text-[#213a67]">
            {item.question}
          </h3>
        </div>
        <span className={cn(
          "shrink-0 rounded-full border px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.14em]",
          item.corrected
            ? "border-[#dddff8] bg-[#f5f3ff] text-[#6f52c9]"
            : "border-[#f0dfbf] bg-[#fff8ea] text-[#a36d20]",
        )}>
          {item.corrected ? "Исправлено" : "Повторить"}
        </span>
      </div>

      <p className="mt-2 line-clamp-2 text-[12px] leading-5 text-[#7282a0]">
        Последний ответ: {item.answer || "—"} • попыток: {item.attempts}
      </p>
      {!item.corrected && (
        <p className="mt-1 text-[11px] text-[#8d6b31]">Подсказка: {item.hint}</p>
      )}

      <button
        type="button"
        onClick={onOpen}
        className="mt-3 inline-flex items-center gap-1 text-[12px] font-semibold text-[#2563eb]"
      >
        Перейти к тестам
        <ChevronRight className="h-3.5 w-3.5" strokeWidth={1.8} />
      </button>
    </div>
  );
}

export default function SubjectsPage() {
  const navigate = useNavigate();
  const deviceId = useMemo(() => getOrCreateDeviceId(), []);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [progressRecords, setProgressRecords] = useState<ProgressRecord[]>([]);
  const [tests, setTests] = useState<UserTest[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState("");
  const [newIcon, setNewIcon] = useState("📚");
  const [newDesc, setNewDesc] = useState("");
  const [iconEditedManually, setIconEditedManually] = useState(false);
  const [descriptionEditedManually, setDescriptionEditedManually] = useState(false);
  const suggestedAppearance = useMemo(() => suggestSubjectAppearance(newName), [newName]);

  useEffect(() => {
    setSubjects(getCustomSubjects());
  }, []);

  const loadLearningData = useCallback(async () => {
    try {
      const [records, userTests] = await Promise.all([
        fetchProgressRecords(deviceId),
        fetchUserTests(deviceId),
      ]);
      setProgressRecords(records);
      setTests(userTests);
    } catch {
      setProgressRecords([]);
      setTests([]);
    }
  }, [deviceId]);

  useEffect(() => {
    void loadLearningData();
  }, [loadLearningData]);

  useEffect(() => {
    if (!showAdd) return;

    if (!iconEditedManually || !newIcon.trim()) {
      setNewIcon(suggestedAppearance.icon);
    }

    if (!descriptionEditedManually || !newDesc.trim()) {
      setNewDesc(suggestedAppearance.description);
    }
  }, [showAdd, suggestedAppearance, iconEditedManually, descriptionEditedManually, newIcon, newDesc]);

  const visibleSubjects = useMemo(() => {
    const normalized = searchTerm.trim().toLowerCase();
    if (!normalized) return subjects;

    return subjects.filter((subject) => (
      subject.name.toLowerCase().includes(normalized) ||
      subject.description.toLowerCase().includes(normalized)
    ));
  }, [searchTerm, subjects]);

  const weakTopics = useMemo(
    () => buildWeakTopicInsights(progressRecords, tests, subjects),
    [progressRecords, tests, subjects],
  );
  const repeatTopics = useMemo(
    () => weakTopics.filter((item) => item.confidence !== "strong"),
    [weakTopics],
  );
  const mistakes = useMemo(
    () => buildMistakeNotebook(tests, subjects),
    [tests, subjects],
  );
  const missions = useMemo(
    () => buildDailyMissions(subjects, weakTopics, mistakes, tests),
    [subjects, weakTopics, mistakes, tests],
  );
  const snapshots = useMemo(
    () => buildSubjectLearningSnapshots(subjects, progressRecords, tests, weakTopics),
    [subjects, progressRecords, tests, weakTopics],
  );
  const snapshotsBySubject = useMemo(
    () => new Map(snapshots.map((snapshot) => [snapshot.subjectId, snapshot])),
    [snapshots],
  );
  const cardItems = useMemo(
    () => mapSubjectsToCards(visibleSubjects, snapshotsBySubject),
    [visibleSubjects, snapshotsBySubject],
  );
  const unresolvedMistakes = useMemo(
    () => mistakes.filter((item) => !item.corrected),
    [mistakes],
  );

  const openAddModal = () => {
    setShowAdd(true);
    setIconEditedManually(false);
    if (!newIcon.trim()) {
      setNewIcon("📚");
    }
  };

  const resetForm = () => {
    setNewName("");
    setNewIcon("📚");
    setNewDesc("");
    setIconEditedManually(false);
    setDescriptionEditedManually(false);
    setShowAdd(false);
  };

  const handleAdd = () => {
    if (!newName.trim()) return;

    const appearance = suggestSubjectAppearance(newName);
    const subject: Subject = {
      id: `custom-${Date.now()}`,
      name: newName.trim(),
      icon: newIcon.trim() || appearance.icon,
      color: appearance.color,
      description: newDesc.trim() || appearance.description,
    };

    saveCustomSubject(subject);
    setSubjects(getCustomSubjects());
    resetForm();
  };

  const handleDelete = (id: string) => {
    removeCustomSubject(id);
    setSubjects(getCustomSubjects());
  };

  return (
    <DashboardShell
      title="Мои предметы"
      description="Здесь теперь не просто список курсов, а учебный центр: что повторить, где слабое место и какой шаг сделать сегодня."
      searchValue={searchTerm}
      onSearchChange={setSearchTerm}
      compactHeader
      compactRail
      overviewItems={[
        { label: "Фокус", value: missions.length, tone: "blue" },
        { label: "На повторе", value: repeatTopics.length, tone: "blue" },
        { label: "Ошибки", value: unresolvedMistakes.length, tone: "amber" },
        { label: "Активно", value: tests.filter((test) => !test.completed).length, tone: "slate" },
      ]}
    >
      <section className="grid grid-cols-1 gap-3.5 xl:grid-cols-[248px_minmax(0,1fr)]">
        <div className="max-w-[248px]">
          <AddSubjectTile onClick={openAddModal} />
        </div>

        {subjects.length > 0 && (
          <DashboardPanel className="p-4">
            <DashboardSectionTitle
              icon={Sparkles}
              title="Фокус на сегодня"
              trailing={(
                <span className="rounded-full border border-[#ece6da] bg-[#fdfbf6] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#9aa7bf]">
                  {missions.length} шага
                </span>
              )}
            />
            <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
              {missions.map((mission) => (
                <MissionCard
                  key={mission.id}
                  mission={mission}
                  onOpen={() => navigate(mission.href)}
                />
              ))}
            </div>
          </DashboardPanel>
        )}
      </section>

      {cardItems.length === 0 ? (
        <DashboardEmptyHero
          compact
          illustration={<div className="origin-center scale-90"><SubjectsHeroIllustration /></div>}
          title={subjects.length === 0 ? "Пока предметов нет" : "Ничего не найдено"}
          description={subjects.length === 0
            ? "Создай первый предмет. После первых объяснений и тестов здесь появятся слабые темы, ошибки для повторения и фокус на сегодня."
            : "Попробуй изменить поисковый запрос или очистить строку поиска, чтобы снова увидеть свои предметы."}
          className="bg-[radial-gradient(circle_at_top,#fbfdff_0%,#ffffff_46%,#fcfaf6_100%)]"
        />
      ) : (
        <section className="grid grid-cols-1 gap-3.5 md:grid-cols-2 xl:grid-cols-3">
          {cardItems.map((subject) => (
            <SubjectCard
              key={subject.id}
              subject={subject}
              onOpen={() => navigate(`/subject/${subject.id}`)}
              onDelete={() => handleDelete(subject.id)}
            />
          ))}
        </section>
      )}

      {repeatTopics.length > 0 && (
        <DashboardPanel className="p-4">
          <DashboardSectionTitle
            icon={CircleAlert}
            title="Слабые темы"
            trailing={(
              <button
                type="button"
                onClick={() => navigate("/progress")}
                className="inline-flex items-center gap-1 text-[12px] font-semibold text-[#2563eb]"
              >
                Вся статистика
                <ChevronRight className="h-3.5 w-3.5" strokeWidth={1.8} />
              </button>
            )}
          />
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            {repeatTopics.slice(0, 4).map((item) => (
              <WeakTopicCard
                key={item.id}
                item={item}
                onOpen={() => navigate(`/subject/${item.subjectId}`)}
              />
            ))}
          </div>
        </DashboardPanel>
      )}

      {mistakes.length > 0 && (
        <DashboardPanel className="p-4">
          <DashboardSectionTitle
            icon={RotateCcw}
            title="Тетрадь ошибок"
            trailing={(
              <button
                type="button"
                onClick={() => navigate("/tests")}
                className="inline-flex items-center gap-1 text-[12px] font-semibold text-[#2563eb]"
              >
                Все тесты
                <ChevronRight className="h-3.5 w-3.5" strokeWidth={1.8} />
              </button>
            )}
          />
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            {mistakes.slice(0, 4).map((item) => (
              <MistakeCard
                key={item.id}
                item={item}
                onOpen={() => navigate("/tests")}
              />
            ))}
          </div>
        </DashboardPanel>
      )}

      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#10244d]/25 px-4 backdrop-blur-md">
          <DashboardPanel className="w-full max-w-md p-4 sm:p-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#9aa7bf]">
              Новый предмет
            </p>
            <h2 className="mt-2.5 font-serif text-[24px] font-semibold tracking-[-0.04em] text-[#132b5b]">
              Добавить курс
            </h2>
            <p className="mt-2.5 text-[13px] leading-6 text-[#7282a0]">
              Введи название, а мы предложим иконку, описание и визуальное направление для этого предмета.
            </p>

            <div
              className="mt-4 rounded-[20px] border px-3.5 py-3.5"
              style={{
                borderColor: `hsl(${suggestedAppearance.color} / 0.22)`,
                backgroundColor: `hsl(${suggestedAppearance.color} / 0.07)`,
              }}
            >
              <div className="flex items-start gap-3">
                <div
                  className="grid h-10 w-10 place-items-center rounded-[16px] text-[20px]"
                  style={{ backgroundColor: `hsl(${suggestedAppearance.color} / 0.14)` }}
                >
                  {newIcon || suggestedAppearance.icon}
                </div>

                <div className="min-w-0">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#9aa7bf]">
                    {suggestedAppearance.templateLabel}
                  </p>
                  <p className="mt-1.5 font-serif text-[20px] font-semibold leading-none tracking-[-0.04em] text-[#132b5b]">
                    {newName.trim() || "Предпросмотр предмета"}
                  </p>
                  <p className="mt-2 text-[12px] leading-5 text-[#7282a0]">
                    {newDesc.trim() || suggestedAppearance.description}
                  </p>
                  <p className="mt-2 text-[12px] font-medium text-[#2563eb]">
                    Пример запроса: {suggestedAppearance.examplePrompt}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-4 space-y-3">
              <div className="flex gap-3">
                <input
                  value={newIcon}
                  onChange={(event) => {
                    setNewIcon(event.target.value);
                    setIconEditedManually(true);
                  }}
                  placeholder="📚"
                  className="w-14 rounded-[18px] border border-[#e6dfd0] bg-white px-3 py-2 text-center text-lg text-[#132b5b] outline-none transition focus:border-[#175cdf]/40 focus:ring-4 focus:ring-[#175cdf]/10"
                />
                <input
                  value={newName}
                  onChange={(event) => setNewName(event.target.value)}
                  placeholder="Название предмета"
                  className="flex-1 rounded-[18px] border border-[#e6dfd0] bg-white px-4 py-2 text-[13px] text-[#132b5b] outline-none transition placeholder:text-[#98a2b3] focus:border-[#175cdf]/40 focus:ring-4 focus:ring-[#175cdf]/10"
                />
              </div>

              <p className="text-[10px] leading-5 text-[#98a2b3]">
                Для языка автоматически подставится флаг, а для математики или естественных наук —
                тематическая иконка и подходящий шаблон.
              </p>

              <input
                value={newDesc}
                onChange={(event) => {
                  setNewDesc(event.target.value);
                  setDescriptionEditedManually(true);
                }}
                placeholder="Описание предмета"
                className="w-full rounded-[18px] border border-[#e6dfd0] bg-white px-4 py-2 text-[13px] text-[#132b5b] outline-none transition placeholder:text-[#98a2b3] focus:border-[#175cdf]/40 focus:ring-4 focus:ring-[#175cdf]/10"
              />
            </div>

            <div className="mt-4 flex flex-col gap-2.5 sm:flex-row">
              <button
                type="button"
                onClick={resetForm}
                className="flex-1 rounded-[18px] border border-[#e6dfd0] bg-white px-4 py-2 text-[13px] font-medium text-[#667085] transition hover:bg-[#f8f5ee] hover:text-[#111827]"
              >
                Отмена
              </button>
              <button
                type="button"
                onClick={handleAdd}
                disabled={!newName.trim()}
                className={cn(
                  "flex-1 rounded-[18px] px-4 py-2 text-[13px] font-semibold text-white shadow-[0_18px_35px_rgba(23,92,223,0.22)] transition",
                  newName.trim() ? "bg-[#175cdf] hover:bg-[#144fc1]" : "bg-[#98a2b3] shadow-none",
                )}
              >
                Добавить предмет
              </button>
            </div>
          </DashboardPanel>
        </div>
      )}
    </DashboardShell>
  );
}
