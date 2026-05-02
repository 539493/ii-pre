import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  BarChart3,
  BookOpen,
  ChevronRight,
  Clock3,
  GraduationCap,
  Library,
  MoreHorizontal,
  Plus,
  User,
  type LucideIcon,
} from "lucide-react";
import { getCustomSubjects, removeCustomSubject, saveCustomSubject, suggestSubjectAppearance } from "@/lib/subjects";
import { cn } from "@/lib/utils";
import type { Subject } from "@/types/tutor";

type SubjectTone = "blue" | "amber" | "green" | "violet";

type SubjectCardViewModel = {
  id: string;
  title: string;
  description: string;
  icon: string;
  progress: number;
  tests: number;
  materials: number;
  lastActivity: string;
  tone: SubjectTone;
  templateLabel: string;
};

type NavItem = {
  label: string;
  icon: LucideIcon;
  active?: boolean;
};

const navItems: NavItem[] = [
  { label: "Мои предметы", icon: BookOpen, active: true },
  { label: "Мои тесты", icon: Library },
  { label: "Материалы", icon: GraduationCap },
  { label: "Успеваемость", icon: BarChart3 },
  { label: "Профиль", icon: User },
];

const toneStyles: Record<SubjectTone, { soft: string; bar: string; glow: string }> = {
  blue: {
    soft: "bg-[#eff5ff] text-[#175cdf] border-[#d9e6ff]",
    bar: "bg-[#2563eb]",
    glow: "from-[#eff5ff]",
  },
  amber: {
    soft: "bg-[#fff8e8] text-[#9c7428] border-[#f0dfbd]",
    bar: "bg-[#c49a45]",
    glow: "from-[#fff8e8]",
  },
  green: {
    soft: "bg-[#effaf5] text-[#137849] border-[#d4f0e2]",
    bar: "bg-[#1f9d67]",
    glow: "from-[#effaf5]",
  },
  violet: {
    soft: "bg-[#f5f0ff] text-[#6d28d9] border-[#e7dcff]",
    bar: "bg-[#7c3aed]",
    glow: "from-[#f5f0ff]",
  },
};

function BrandMark() {
  return (
    <div className="flex items-center gap-3">
      <div className="relative grid h-9 w-9 place-items-center rounded-[18px] border border-[#e7ddc7] bg-[#fbf8f0] text-[#c49a45] shadow-[0_10px_30px_rgba(15,23,42,0.05)]">
        <GraduationCap className="h-4.5 w-4.5" strokeWidth={1.9} />
        <span className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-[#2563eb] ring-[3px] ring-white" />
      </div>
      <div>
        <div className="font-serif text-[22px] font-semibold leading-none tracking-[-0.03em] text-[#101828]">
          AI Tutor
        </div>
        <div className="mt-1 text-[10px] font-medium uppercase tracking-[0.22em] text-[#9aa3b2]">
          workspace
        </div>
      </div>
    </div>
  );
}

function MobileTopbar() {
  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-[#e8e4dc] bg-[#fbfaf7]/90 px-4 backdrop-blur-xl lg:hidden">
      <BrandMark />
      <button
        type="button"
        className="rounded-xl bg-[#101828] px-3 py-2 text-xs font-semibold text-white"
      >
        Меню
      </button>
    </header>
  );
}

function AddSubjectCard({
  compact = false,
  onClick,
}: {
  compact?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group relative overflow-hidden rounded-[24px] border border-[#e6e1d8] bg-white p-3.5 text-left shadow-[0_18px_50px_rgba(15,23,42,0.05)] transition-all duration-300 hover:-translate-y-0.5 hover:border-[#c9d8ff] hover:shadow-[0_24px_70px_rgba(37,99,235,0.08)]",
        compact ? "min-h-[210px] w-full" : "w-full sm:w-[360px]",
      )}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(37,99,235,0.10),transparent_48%)] opacity-80" />
      <div
        className={cn(
          "relative flex flex-col items-center justify-center rounded-[20px] border border-dashed border-[#b9c9ff] bg-[#fbfdff]/80 px-6 py-6",
          compact ? "h-full min-h-[182px]" : "min-h-[132px]",
        )}
      >
        <span className="grid h-14 w-14 place-items-center rounded-full bg-[#2563eb] text-white shadow-[0_14px_30px_rgba(37,99,235,0.24)] transition-transform duration-300 group-hover:scale-105">
          <Plus className="h-7 w-7" strokeWidth={1.9} />
        </span>
        <span className="mt-4 text-[15px] font-bold text-[#175cdf]">
          Добавить предмет
        </span>
        <span className="mt-2 max-w-[220px] text-center text-[12px] leading-5 text-[#8a94a6]">
          Создай пространство для уроков, тестов и материалов
        </span>
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
    <article className="group relative overflow-hidden rounded-[26px] border border-[#e6e1d8] bg-white p-5 shadow-[0_18px_52px_rgba(15,23,42,0.05)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_26px_72px_rgba(15,23,42,0.08)]">
      <div className={cn("absolute inset-x-0 top-0 h-24 bg-gradient-to-b to-transparent", tone.glow)} />

      <div className="relative flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-white text-[26px] shadow-[0_12px_28px_rgba(15,23,42,0.09)]">
            {subject.icon}
          </div>
          <div>
            <h3 className="text-[19px] font-bold tracking-[-0.03em] text-[#101828]">
              {subject.title}
            </h3>
            <div className="mt-1 flex items-center gap-1.5 text-[12px] font-medium text-[#8a94a6]">
              <Clock3 className="h-3.5 w-3.5" />
              {subject.lastActivity}
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={onDelete}
          className="grid h-8 w-8 place-items-center rounded-full text-[#98a2b3] transition hover:bg-[#f6f3ec] hover:text-[#101828]"
          aria-label={`Удалить предмет ${subject.title}`}
        >
          <MoreHorizontal className="h-4.5 w-4.5" />
        </button>
      </div>

      <p className="relative mt-5 min-h-[44px] text-[13px] leading-6 text-[#667085]">
        {subject.description}
      </p>

      <div className="relative mt-5">
        <div className="mb-2 flex items-center justify-between text-[12px] font-semibold">
          <span className="text-[#667085]">Прогресс</span>
          <span className="text-[#101828]">{subject.progress}%</span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-[#ece8df]">
          <div
            className={cn("h-full rounded-full transition-all", tone.bar)}
            style={{ width: `${subject.progress}%` }}
          />
        </div>
      </div>

      <div className="relative mt-5 grid grid-cols-2 gap-2.5">
        <div className={cn("rounded-2xl border px-3.5 py-3", tone.soft)}>
          <div className="text-[18px] font-bold leading-none">{subject.tests}</div>
          <div className="mt-1 text-[11px] font-semibold opacity-75">тестов</div>
        </div>
        <div className="rounded-2xl border border-[#ece7dd] bg-[#fbfaf7] px-3.5 py-3 text-[#667085]">
          <div className="text-[18px] font-bold leading-none text-[#101828]">
            {subject.materials}
          </div>
          <div className="mt-1 text-[11px] font-semibold">материалов</div>
        </div>
      </div>

      <div className="relative mt-5 flex items-center justify-between gap-3">
        <span className="rounded-full border border-[#ece5d8] bg-[#fcfaf5] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#9aa3b2]">
          {subject.templateLabel}
        </span>
        <button
          type="button"
          onClick={onOpen}
          className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#175cdf] transition group-hover:translate-x-0.5"
        >
          Открыть предмет
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </article>
  );
}

function SubjectsGrid({
  items,
  onOpen,
  onDelete,
  onAdd,
}: {
  items: SubjectCardViewModel[];
  onOpen: (subjectId: string) => void;
  onDelete: (subjectId: string) => void;
  onAdd: () => void;
}) {
  return (
    <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
      {items.map((subject) => (
        <SubjectCard
          key={subject.id}
          subject={subject}
          onOpen={() => onOpen(subject.id)}
          onDelete={() => onDelete(subject.id)}
        />
      ))}
      <AddSubjectCard compact onClick={onAdd} />
    </section>
  );
}

function StudyStillLife() {
  return (
    <div className="relative h-[280px] w-full overflow-hidden rounded-[32px] md:h-[360px] lg:h-full">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_72%_38%,rgba(236,231,220,0.94),transparent_32%),linear-gradient(135deg,rgba(255,255,255,0)_0%,rgba(242,239,232,0.72)_100%)]" />
      <div className="absolute bottom-8 right-8 h-56 w-56 rounded-full bg-[#e9e3d7] opacity-70 blur-[1px] md:h-72 md:w-72" />
      <div className="absolute bottom-0 right-4 h-[260px] w-[310px] rounded-t-full bg-[#e7e1d6] opacity-65 md:right-10 md:h-[330px] md:w-[410px]" />
      <div className="absolute bottom-0 right-0 h-40 w-[310px] rounded-tl-[80px] bg-white/50 blur-[1px]" />

      <div className="absolute bottom-16 right-[285px] hidden h-28 w-28 rounded-full border border-[#ded7ca] bg-[linear-gradient(135deg,#f5f1e7,#d9d2c4)] shadow-[0_24px_40px_rgba(15,23,42,0.10)] md:block" />

      <div className="absolute bottom-16 right-[122px] flex items-end gap-2 md:right-[136px]">
        {["#0f2740", "#5f6672", "#d8cbb7", "#eee4d4", "#f6f1e8"].map((color, index) => (
          <div
            key={color}
            className="rounded-[10px] border border-black/5 shadow-[0_16px_28px_rgba(15,23,42,0.12)]"
            style={{
              width: index === 0 ? 46 : 40,
              height: 190 - index * 8,
              background: color,
            }}
          >
            <div className="flex h-full items-center justify-center">
              <span className="rotate-90 whitespace-nowrap text-[9px] font-semibold uppercase tracking-[0.18em] text-white/40">
                {index === 0 ? "Algebra" : index === 1 ? "History" : "Study"}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="absolute bottom-20 right-10 hidden h-44 w-24 rounded-r-[52px] rounded-l-xl border border-[#d7d0c2] bg-[linear-gradient(135deg,#f8f5ee,#d7d1c4)] shadow-[0_18px_34px_rgba(15,23,42,0.10)] md:block" />

      <div className="absolute bottom-9 right-[330px] hidden h-3 w-36 rotate-[-10deg] rounded-full bg-[#caa65b] shadow-[0_8px_12px_rgba(15,23,42,0.10)] md:block" />
      <div className="absolute bottom-9 right-[332px] hidden h-3 w-8 rotate-[-10deg] rounded-full bg-[#a98a4a] md:block" />

      <div className="absolute bottom-7 right-[192px] h-14 w-56 -rotate-3 rounded-xl border border-[#d9d2c5] bg-[#f6efe2] shadow-[0_20px_34px_rgba(15,23,42,0.14)] md:right-[238px]" />
      <div className="absolute bottom-16 right-[198px] h-4 w-52 -rotate-3 rounded-md bg-[#d2c3aa] md:right-[244px]" />

      <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-white/70 to-transparent" />
    </div>
  );
}

function EmptyState() {
  return (
    <section className="relative overflow-hidden rounded-[30px] border border-[#e3ded3] bg-[#fffefa] shadow-[0_18px_56px_rgba(15,23,42,0.07)]">
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,1)_0%,rgba(255,255,255,0.92)_43%,rgba(247,243,235,0.58)_100%)]" />
      <div className="relative grid min-h-[360px] grid-cols-1 lg:grid-cols-[0.95fr_1.25fr]">
        <div className="flex flex-col justify-center px-7 py-8 sm:px-12 lg:px-16">
          <div className="mb-6 flex h-10 w-10 items-center justify-center rounded-2xl border border-[#eadfc9] bg-[#fff9ed] text-[#c49a45] shadow-[0_14px_32px_rgba(196,154,69,0.10)]">
            <GraduationCap className="h-4.5 w-4.5" strokeWidth={1.8} />
          </div>

          <h2 className="max-w-[430px] font-serif text-[32px] font-semibold leading-[1.08] tracking-[-0.04em] text-[#101828] sm:text-[38px]">
            Пока предметов нет
          </h2>

          <p className="mt-5 max-w-[450px] text-[14px] leading-7 text-[#657083]">
            Создай первый предмет. Иконка подберётся автоматически по названию, а затем этот же предмет появится в тестах и успеваемости.
          </p>

          <div className="mt-7 flex items-center gap-3 text-[#c49a45]">
            <span className="h-px w-10 bg-[#c49a45]" />
            <span className="h-2 w-2 rotate-45 bg-[#c49a45]" />
            <span className="h-px w-10 bg-[#c49a45]" />
          </div>
        </div>

        <StudyStillLife />
      </div>
    </section>
  );
}

function PageHeader({
  hasSubjects,
  onAdd,
}: {
  hasSubjects: boolean;
  onAdd: () => void;
}) {
  return (
    <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
      <div className="max-w-[880px]">
        <div className="inline-flex items-center gap-2 rounded-full border border-[#e6dfd0] bg-white/80 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.22em] text-[#9aa3b2] shadow-[0_10px_24px_rgba(15,23,42,0.03)] lg:hidden">
          Первая страница
        </div>
        <h1 className="mt-3 font-serif text-[38px] font-semibold leading-none tracking-[-0.05em] text-[#101828] sm:text-[44px] lg:mt-0 lg:text-[52px]">
          Мои предметы
        </h1>
        <p className="mt-3 max-w-[700px] text-[15px] leading-6 text-[#667085]">
          Добавь свои предметы и открой по каждому отдельное рабочее пространство
        </p>
      </div>

      {hasSubjects && (
        <button
          type="button"
          onClick={onAdd}
          className="inline-flex h-12 items-center justify-center gap-2.5 rounded-2xl bg-[#2563eb] px-5 text-[14px] font-bold text-white shadow-[0_16px_34px_rgba(37,99,235,0.20)] transition hover:-translate-y-0.5 hover:bg-[#175cdf]"
        >
          <Plus className="h-4.5 w-4.5" />
          Добавить предмет
        </button>
      )}
    </div>
  );
}

function getSubjectTone(subject: Subject, index: number): SubjectTone {
  const normalized = subject.name.toLowerCase();

  if (normalized.includes("мат") || normalized.includes("алгеб") || normalized.includes("геом")) return "blue";
  if (normalized.includes("истор") || normalized.includes("литер") || normalized.includes("прав")) return "amber";
  if (normalized.includes("био") || normalized.includes("хим") || normalized.includes("гео")) return "green";
  if (normalized.includes("англ") || normalized.includes("информ") || normalized.includes("язык")) return "violet";

  return (["blue", "amber", "green", "violet"] as SubjectTone[])[index % 4];
}

function mapSubjectsToCards(subjects: Subject[]): SubjectCardViewModel[] {
  return subjects.map((subject, index) => {
    const appearance = suggestSubjectAppearance(subject.name);

    return {
      id: subject.id,
      title: subject.name,
      description: subject.description,
      icon: subject.icon,
      progress: 0,
      tests: 0,
      materials: 0,
      lastActivity: "Пока нет данных",
      tone: getSubjectTone(subject, index),
      templateLabel: appearance.templateLabel,
    };
  });
}

export default function SubjectsPage() {
  const navigate = useNavigate();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState("");
  const [newIcon, setNewIcon] = useState("📚");
  const [newDesc, setNewDesc] = useState("");
  const [iconEditedManually, setIconEditedManually] = useState(false);
  const [descriptionEditedManually, setDescriptionEditedManually] = useState(false);
  const suggestedAppearance = useMemo(() => suggestSubjectAppearance(newName), [newName]);
  const cardItems = useMemo(() => mapSubjectsToCards(subjects), [subjects]);
  const hasSubjects = subjects.length > 0;

  useEffect(() => {
    setSubjects(getCustomSubjects());
  }, []);

  useEffect(() => {
    if (!showAdd) return;

    if (!iconEditedManually || !newIcon.trim()) {
      setNewIcon(suggestedAppearance.icon);
    }

    if (!descriptionEditedManually || !newDesc.trim()) {
      setNewDesc(suggestedAppearance.description);
    }
  }, [showAdd, suggestedAppearance, iconEditedManually, descriptionEditedManually, newIcon, newDesc]);

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
    <div className="min-h-full bg-[#fbfaf7] text-[#101828]">
      <MobileTopbar />

      <main>
        <div className="mx-auto max-w-[1240px] px-5 py-6 sm:px-7 sm:py-8 lg:px-10 lg:py-10 xl:px-12">
          <PageHeader hasSubjects={hasSubjects} onAdd={openAddModal} />

          {hasSubjects ? (
            <div className="mt-8">
              <SubjectsGrid
                items={cardItems}
                onOpen={(subjectId) => navigate(`/subject/${subjectId}`)}
                onDelete={handleDelete}
                onAdd={openAddModal}
              />
            </div>
          ) : (
            <>
              <div className="mt-8">
                <AddSubjectCard onClick={openAddModal} />
              </div>
              <div className="mt-8">
                <EmptyState />
              </div>
            </>
          )}

          <div className="mt-7 flex flex-wrap gap-2.5 lg:hidden">
            {navItems.map((item) => {
              const Icon = item.icon;

              return (
                <div
                  key={item.label}
                  className={cn(
                    "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[11px] font-semibold",
                    item.active
                      ? "border-[#d9e6ff] bg-[#eff5ff] text-[#175cdf]"
                      : "border-[#e6dfd0] bg-white text-[#667085]",
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {item.label}
                </div>
              );
            })}
          </div>
        </div>
      </main>

      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#101828]/30 px-4 backdrop-blur-md">
          <div className="w-full max-w-lg rounded-[28px] border border-[#e8e0d2] bg-[#fcfaf5] p-5 shadow-[0_26px_72px_rgba(15,23,42,0.14)] sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#9aa3b2]">
                  Новый предмет
                </p>
                <h2 className="mt-2 font-serif text-[28px] font-semibold tracking-[-0.04em] text-[#101828]">
                  Добавить курс
                </h2>
                <p className="mt-2.5 max-w-lg text-[13px] leading-6 text-[#667085]">
                  Введи название, а мы предложим иконку, описание и визуальное направление для этого предмета.
                </p>
              </div>
            </div>

            <div
              className="mt-5 rounded-[24px] border px-4 py-4"
              style={{
                borderColor: `hsl(${suggestedAppearance.color} / 0.24)`,
                backgroundColor: `hsl(${suggestedAppearance.color} / 0.08)`,
              }}
            >
              <div className="flex items-start gap-4">
                <div
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-[24px]"
                  style={{ backgroundColor: `hsl(${suggestedAppearance.color} / 0.15)` }}
                >
                  {newIcon || suggestedAppearance.icon}
                </div>

                <div className="min-w-0">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#9aa3b2]">
                    {suggestedAppearance.templateLabel}
                  </p>
                  <p className="mt-2 font-serif text-[24px] font-semibold leading-none tracking-[-0.04em] text-[#101828]">
                    {newName.trim() || "Предпросмотр предмета"}
                  </p>
                  <p className="mt-2.5 text-[13px] leading-6 text-[#667085]">
                    {newDesc.trim() || suggestedAppearance.description}
                  </p>
                  <p className="mt-2.5 text-[13px] font-medium text-[#175cdf]">
                    Пример запроса: {suggestedAppearance.examplePrompt}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-5 space-y-3.5">
              <div className="flex gap-3">
                <input
                  value={newIcon}
                  onChange={(e) => {
                    setNewIcon(e.target.value);
                    setIconEditedManually(true);
                  }}
                  placeholder="📚"
                  className="w-16 rounded-2xl border border-[#e6dfd0] bg-white px-3 py-2.5 text-center text-xl text-[#101828] outline-none transition focus:border-[#175cdf]/40 focus:ring-4 focus:ring-[#175cdf]/10"
                />
                <input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Название предмета"
                  className="flex-1 rounded-2xl border border-[#e6dfd0] bg-white px-4 py-2.5 text-[13px] text-[#101828] outline-none transition placeholder:text-[#98a2b3] focus:border-[#175cdf]/40 focus:ring-4 focus:ring-[#175cdf]/10"
                />
              </div>

              <p className="text-[11px] leading-5 text-[#98a2b3]">
                Подсказка: для «Английского языка» автоматически подставится флаг, а для математики —
                тематическая иконка и подходящий шаблон.
              </p>

              <input
                value={newDesc}
                onChange={(e) => {
                  setNewDesc(e.target.value);
                  setDescriptionEditedManually(true);
                }}
                placeholder="Описание предмета"
                className="w-full rounded-2xl border border-[#e6dfd0] bg-white px-4 py-2.5 text-[13px] text-[#101828] outline-none transition placeholder:text-[#98a2b3] focus:border-[#175cdf]/40 focus:ring-4 focus:ring-[#175cdf]/10"
              />
            </div>

            <div className="mt-5 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={resetForm}
                className="flex-1 rounded-2xl border border-[#e6dfd0] bg-white px-4 py-2.5 text-[13px] font-medium text-[#667085] transition hover:bg-[#f8f5ee] hover:text-[#111827]"
              >
                Отмена
              </button>
              <button
                type="button"
                onClick={handleAdd}
                disabled={!newName.trim()}
                className={cn(
                  "flex-1 rounded-2xl px-4 py-2.5 text-[13px] font-semibold text-white shadow-[0_18px_35px_rgba(23,92,223,0.22)] transition",
                  newName.trim() ? "bg-[#175cdf] hover:bg-[#144fc1]" : "bg-[#98a2b3] shadow-none",
                )}
              >
                Добавить предмет
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
