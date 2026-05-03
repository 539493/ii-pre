import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronRight, Import, MoreHorizontal, Plus, Settings } from "lucide-react";
import {
  getCustomSubjects,
  removeCustomSubject,
  saveCustomSubject,
  suggestSubjectAppearance,
} from "@/lib/subjects";
import { cn } from "@/lib/utils";
import {
  DashboardEmptyHero,
  DashboardPanel,
} from "@/components/dashboard/DashboardShell";
import DashboardShell from "@/components/dashboard/DashboardShell";
import { SubjectsHeroIllustration } from "@/components/dashboard/DashboardIllustrations";
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

const toneStyles: Record<SubjectTone, { soft: string; bar: string }> = {
  blue: {
    soft: "border-[#dbe7ff] bg-[#eef4ff] text-[#2563eb]",
    bar: "bg-[#2563eb]",
  },
  amber: {
    soft: "border-[#f1e2be] bg-[#fff8ea] text-[#be8c27]",
    bar: "bg-[#d3a34e]",
  },
  green: {
    soft: "border-[#dcefe7] bg-[#eff8f4] text-[#1f8d62]",
    bar: "bg-[#1f8d62]",
  },
  violet: {
    soft: "border-[#e8dff8] bg-[#f4f0ff] text-[#7a48d6]",
    bar: "bg-[#7a48d6]",
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

function AddSubjectTile({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex h-[138px] w-full max-w-[286px] flex-col items-center justify-center rounded-[20px] border border-dashed border-[#d7deeb] bg-white px-5 text-center shadow-[0_14px_32px_rgba(15,23,42,0.03)] transition hover:border-[#c7d8ff] hover:text-[#175cdf]"
    >
      <Plus className="h-6.5 w-6.5 text-[#2563eb]" strokeWidth={1.8} />
      <span className="mt-4 text-[14px] font-semibold text-[#28416d]">Добавить предмет</span>
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
          <div className="grid h-12 w-12 place-items-center rounded-[16px] border border-[#e8edf7] bg-[#fbfcff] text-[24px] shadow-[0_12px_22px_rgba(15,23,42,0.05)]">
            {subject.icon}
          </div>
          <div>
            <h3 className="text-[17px] font-semibold tracking-[-0.03em] text-[#162d58]">
              {subject.title}
            </h3>
            <p className="mt-1 text-[12px] text-[#8a97b2]">{subject.lastActivity}</p>
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

      <p className="mt-4 min-h-[48px] text-[13px] leading-6 text-[#7282a0]">
        {subject.description}
      </p>

      <div className="mt-4">
        <div className="mb-2 flex items-center justify-between text-[12px] font-medium">
          <span className="text-[#6f7f9d]">Прогресс</span>
          <span className="text-[#1b315d]">{subject.progress}%</span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-[#eee9df]">
          <div className={cn("h-full rounded-full", tone.bar)} style={{ width: `${subject.progress}%` }} />
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-2.5">
        <div className={cn("rounded-[18px] border px-3.5 py-2.5", tone.soft)}>
          <div className="text-[18px] font-semibold leading-none">{subject.tests}</div>
          <div className="mt-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] opacity-75">
            тестов
          </div>
        </div>
        <div className="rounded-[18px] border border-[#ede7dd] bg-[#fdfcf8] px-3.5 py-2.5">
          <div className="text-[18px] font-semibold leading-none text-[#162d58]">{subject.materials}</div>
          <div className="mt-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#8a97b2]">
            материалов
          </div>
        </div>
      </div>

      <div className="mt-5 flex items-center justify-between gap-3">
        <span className="rounded-full border border-[#ece6da] bg-[#fdfbf6] px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.18em] text-[#9aa7bf]">
          {subject.templateLabel}
        </span>
        <button
          type="button"
          onClick={onOpen}
          className="inline-flex items-center gap-1 text-[13px] font-semibold text-[#2563eb] transition hover:translate-x-0.5"
        >
          Открыть предмет
          <ChevronRight className="h-3.5 w-3.5" strokeWidth={1.8} />
        </button>
      </div>
    </DashboardPanel>
  );
}

export default function SubjectsPage() {
  const navigate = useNavigate();
  const [subjects, setSubjects] = useState<Subject[]>([]);
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

  const cardItems = useMemo(() => mapSubjectsToCards(visibleSubjects), [visibleSubjects]);

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

  const recentActivity = subjects.length > 0 ? (
    <div className="space-y-3">
      {subjects.slice(-3).reverse().map((subject) => (
        <div key={subject.id} className="rounded-[18px] border border-[#ece7dd] bg-[#fcfbf8] px-4 py-3">
          <p className="text-[14px] font-medium text-[#213a67]">{subject.icon} {subject.name}</p>
          <p className="mt-1 text-[12px] text-[#8a97b2]">Пространство готово к работе</p>
        </div>
      ))}
    </div>
  ) : undefined;

  return (
    <DashboardShell
      title="Мои предметы"
      description="Добавь свои предметы и открой по каждому отдельное рабочее пространство"
      searchValue={searchTerm}
      onSearchChange={setSearchTerm}
      overviewItems={[
        { label: "Всего", value: subjects.length, tone: "blue" },
        { label: "Активно", value: subjects.length, tone: "blue" },
        { label: "Завершено", value: 0, tone: "amber" },
        { label: "Обновлено", value: "—", tone: "slate" },
      ]}
      quickActions={[
        { label: "Добавить", icon: Plus, onClick: openAddModal },
        { label: "Импорт", icon: Import, onClick: () => navigate("/materials") },
        { label: "Настройки", icon: Settings, onClick: () => navigate("/profile") },
      ]}
      recentActivity={recentActivity}
    >
      <div className="max-w-[286px]">
        <AddSubjectTile onClick={openAddModal} />
      </div>

      {cardItems.length === 0 ? (
        <DashboardEmptyHero
          illustration={<SubjectsHeroIllustration />}
          title={subjects.length === 0 ? "Пока предметов нет" : "Ничего не найдено"}
          description={subjects.length === 0
            ? "Создай первый предмет. Иконка подберётся автоматически по названию, а затем этот же предмет появится в тестах и успеваемости."
            : "Попробуй изменить поисковый запрос или очистить строку поиска, чтобы снова увидеть свои предметы."}
        />
      ) : (
        <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
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
