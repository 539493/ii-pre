import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Import, Plus, Search, Settings, Trash2 } from "lucide-react";
import DashboardShell, { DashboardEmptyHero, DashboardPanel } from "@/components/dashboard/DashboardShell";
import {
  MaterialsHeroIllustration,
  MiniDocumentIllustration,
} from "@/components/dashboard/DashboardIllustrations";
import { getAllSubjects } from "@/lib/subjects";
import { cn } from "@/lib/utils";
import { createKnowledgeItem, deleteKnowledgeItem, fetchKnowledgeItems } from "@/services/tutorData";
import type { KnowledgeItem } from "@/types/tutor";

type MaterialKind = "all" | "theory" | "notes" | "formulas";

function formatShortDate(value: string | null) {
  if (!value) return "—";

  return new Date(value).toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "short",
  });
}

function detectMaterialKind(item: KnowledgeItem): Exclude<MaterialKind, "all"> {
  const normalized = `${item.title} ${item.content}`.toLowerCase();

  if (/[=+\-/*]/.test(normalized) || /\d/.test(normalized)) return "formulas";
  if (normalized.includes("конспект") || normalized.includes("замет")) return "notes";
  return "theory";
}

function toolbarInputClassName() {
  return "h-11 w-full rounded-2xl border border-[#e7e1d8] bg-white px-4 text-[15px] text-[#223761] outline-none transition placeholder:text-[#8b99b4] focus:border-[#cedcff] focus:ring-4 focus:ring-[#2563eb]/8";
}

function FilePreviewCard({ item }: { item?: KnowledgeItem }) {
  return (
    <DashboardPanel className="min-h-[142px] p-5">
      <MiniDocumentIllustration />
      {item ? (
        <>
          <p className="mt-5 line-clamp-1 text-[14px] font-medium text-[#223761]">{item.title}</p>
          <p className="mt-2 line-clamp-2 text-[12px] leading-5 text-[#8a97b2]">{item.content}</p>
        </>
      ) : (
        <>
          <div className="mt-5 h-2.5 w-24 rounded-full bg-[#eef2f8]" />
          <div className="mt-2 h-2.5 w-16 rounded-full bg-[#f2f5fa]" />
        </>
      )}
    </DashboardPanel>
  );
}

export default function MaterialsPage() {
  const navigate = useNavigate();
  const subjects = getAllSubjects();
  const [items, setItems] = useState<KnowledgeItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<MaterialKind>("all");
  const [subjectFilter, setSubjectFilter] = useState("all");
  const [showCreate, setShowCreate] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    void loadMaterials();
  }, []);

  async function loadMaterials() {
    try {
      setItems(await fetchKnowledgeItems());
    } catch {
      setItems([]);
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteKnowledgeItem(id);
      await loadMaterials();
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Не удалось удалить материал.");
    }
  }

  async function handleCreate() {
    if (!title.trim() || !content.trim()) {
      setError("Добавь название и текст материала.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      await createKnowledgeItem({
        title: title.trim(),
        content: content.trim(),
      });
      setTitle("");
      setContent("");
      setShowCreate(false);
      await loadMaterials();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Не удалось сохранить материал.");
    } finally {
      setSaving(false);
    }
  }

  const filteredItems = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return items.filter((item) => {
      if (normalizedSearch) {
        const haystack = `${item.title} ${item.content}`.toLowerCase();
        if (!haystack.includes(normalizedSearch)) return false;
      }

      if (typeFilter !== "all" && detectMaterialKind(item) !== typeFilter) return false;

      if (subjectFilter !== "all") {
        const subject = subjects.find((entry) => entry.id === subjectFilter);
        if (!subject) return false;

        const haystack = `${item.title} ${item.content}`.toLowerCase();
        if (!haystack.includes(subject.name.toLowerCase())) return false;
      }

      return true;
    });
  }, [items, searchTerm, subjects, subjectFilter, typeFilter]);

  const recentItems = items.slice(0, 5);
  const latestUpdate = items[0]?.created_at ?? null;

  return (
    <DashboardShell
      title="Материалы"
      description="Храните и упорядочивайте учебные материалы для быстрого доступа и эффективного обучения."
      searchValue={searchTerm}
      onSearchChange={setSearchTerm}
      overviewItems={[
        { label: "Всего", value: items.length, tone: "blue" },
        { label: "Активно", value: filteredItems.length, tone: "blue" },
        { label: "Закреплено", value: 0, tone: "amber" },
        { label: "Обновлено", value: formatShortDate(latestUpdate), tone: "slate" },
      ]}
      quickActions={[
        { label: "Добавить", icon: Plus, onClick: () => setShowCreate(true) },
        { label: "Импорт", icon: Import, onClick: () => setShowCreate(true) },
        { label: "Настройки", icon: Settings, onClick: () => navigate("/profile") },
      ]}
      toolbar={(
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
          <label className="relative max-w-[286px] flex-1">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-[17px] w-[17px] -translate-y-1/2 text-[#8a97b2]" strokeWidth={1.8} />
            <input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Поиск материалов..."
              className={cn(toolbarInputClassName(), "pl-11")}
            />
          </label>

          <select
            value={typeFilter}
            onChange={(event) => setTypeFilter(event.target.value as MaterialKind)}
            className="h-11 rounded-2xl border border-[#e7e1d8] bg-white px-4 text-[15px] text-[#415276] outline-none transition focus:border-[#cedcff] focus:ring-4 focus:ring-[#2563eb]/8"
          >
            <option value="all">Все типы</option>
            <option value="theory">Теория</option>
            <option value="notes">Конспекты</option>
            <option value="formulas">Формулы</option>
          </select>

          <select
            value={subjectFilter}
            onChange={(event) => setSubjectFilter(event.target.value)}
            className="h-11 rounded-2xl border border-[#e7e1d8] bg-white px-4 text-[15px] text-[#415276] outline-none transition focus:border-[#cedcff] focus:ring-4 focus:ring-[#2563eb]/8"
          >
            <option value="all">Все предметы</option>
            {subjects.map((subject) => (
              <option key={subject.id} value={subject.id}>
                {subject.name}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={() => setShowCreate(true)}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-[#bcd0ff] bg-white px-5 text-[15px] font-medium text-[#2563eb] transition hover:border-[#9cb8ff] hover:bg-[#f6f9ff]"
          >
            <Plus className="h-5 w-5" strokeWidth={1.8} />
            Добавить материал
          </button>
        </div>
      )}
      recentActivity={items.length > 0 ? (
        <div className="space-y-3">
          {items.slice(0, 3).map((item) => (
            <div key={item.id} className="rounded-[18px] border border-[#ece7dd] bg-[#fcfbf8] px-4 py-3">
              <p className="line-clamp-1 text-[14px] font-medium text-[#223761]">{item.title}</p>
              <p className="mt-1 text-[12px] text-[#8a97b2]">{formatShortDate(item.created_at)}</p>
            </div>
          ))}
        </div>
      ) : undefined}
    >
      {filteredItems.length === 0 ? (
        <DashboardEmptyHero
          illustration={<MaterialsHeroIllustration />}
          title="Материалов пока нет"
          description="Добавьте первый материал, чтобы начать формировать свою библиотеку знаний."
        />
      ) : (
        <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {filteredItems.map((item) => (
            <DashboardPanel key={item.id} className="p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4">
                  <MiniDocumentIllustration />
                  <div className="min-w-0">
                    <h3 className="line-clamp-1 text-[18px] font-semibold tracking-[-0.03em] text-[#162d58]">
                      {item.title}
                    </h3>
                    <p className="mt-1 text-[13px] text-[#8a97b2]">
                      {detectMaterialKind(item) === "formulas"
                        ? "Формулы"
                        : detectMaterialKind(item) === "notes"
                          ? "Конспект"
                          : "Теория"}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => void handleDelete(item.id)}
                  className="grid h-9 w-9 place-items-center rounded-full text-[#9aa7bf] transition hover:bg-[#f5f7fb] hover:text-[#244477]"
                  aria-label={`Удалить материал ${item.title}`}
                >
                  <Trash2 className="h-4.5 w-4.5" strokeWidth={1.8} />
                </button>
              </div>

              <p className="mt-5 line-clamp-5 text-[14px] leading-7 text-[#7282a0]">
                {item.content}
              </p>

              <div className="mt-5 flex items-center justify-between gap-3">
                <span className="rounded-full border border-[#ece6da] bg-[#fdfbf6] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#9aa7bf]">
                  {formatShortDate(item.created_at)}
                </span>
                <span className="text-[13px] font-medium text-[#8a97b2]">В библиотеке знаний</span>
              </div>
            </DashboardPanel>
          ))}
        </section>
      )}

      <section className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-serif text-[24px] font-semibold tracking-[-0.03em] text-[#132b5b]">
            Недавние файлы
          </h2>
          <button type="button" className="text-[15px] text-[#5f7fc0] transition hover:text-[#2563eb]">
            Смотреть все
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-5">
          {Array.from({ length: 5 }).map((_, index) => (
            <FilePreviewCard key={index} item={recentItems[index]} />
          ))}
        </div>
      </section>

      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#10244d]/25 px-4 backdrop-blur-md">
          <DashboardPanel className="w-full max-w-xl p-5 sm:p-6">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#9aa7bf]">
              Новый материал
            </p>
            <h2 className="mt-3 font-serif text-[28px] font-semibold tracking-[-0.04em] text-[#132b5b]">
              Добавить в библиотеку
            </h2>

            <div className="mt-5 space-y-3.5">
              <input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Название материала"
                className={toolbarInputClassName()}
              />

              <textarea
                value={content}
                onChange={(event) => setContent(event.target.value)}
                placeholder="Теория, конспект, формулы или пояснения..."
                rows={8}
                className="w-full rounded-[24px] border border-[#e7e1d8] bg-white px-4 py-3 text-[15px] leading-7 text-[#223761] outline-none transition placeholder:text-[#8b99b4] focus:border-[#cedcff] focus:ring-4 focus:ring-[#2563eb]/8"
              />

              {error && (
                <p className="text-[13px] text-[#d55656]">{error}</p>
              )}
            </div>

            <div className="mt-5 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() => {
                  setShowCreate(false);
                  setError("");
                }}
                className="flex-1 rounded-2xl border border-[#e6dfd0] bg-white px-4 py-2.5 text-[14px] font-medium text-[#667085] transition hover:bg-[#f8f5ee] hover:text-[#111827]"
              >
                Отмена
              </button>
              <button
                type="button"
                onClick={() => void handleCreate()}
                disabled={saving}
                className="flex-1 rounded-2xl bg-[#175cdf] px-4 py-2.5 text-[14px] font-semibold text-white shadow-[0_18px_35px_rgba(23,92,223,0.22)] transition hover:bg-[#144fc1] disabled:cursor-not-allowed disabled:bg-[#98a2b3] disabled:shadow-none"
              >
                {saving ? "Сохраняю..." : "Сохранить материал"}
              </button>
            </div>
          </DashboardPanel>
        </div>
      )}
    </DashboardShell>
  );
}
