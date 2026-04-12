import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Trash2, ArrowUpRight, BookOpenCheck } from "lucide-react";
import { DEFAULT_SUBJECTS, getCustomSubjects, saveCustomSubject, removeCustomSubject } from "@/lib/subjects";
import { Subject } from "@/types/tutor";

export default function SubjectsPage() {
  const navigate = useNavigate();
  const [customSubjects, setCustomSubjects] = useState<Subject[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState("");
  const [newIcon, setNewIcon] = useState("📚");
  const [newDesc, setNewDesc] = useState("");

  useEffect(() => {
    setCustomSubjects(getCustomSubjects());
  }, []);

  const handleAdd = () => {
    if (!newName.trim()) return;
    const subject: Subject = {
      id: `custom-${Date.now()}`,
      name: newName.trim(),
      icon: newIcon || "📚",
      color: "280 67% 60%",
      description: newDesc.trim() || newName.trim(),
    };
    saveCustomSubject(subject);
    setCustomSubjects(getCustomSubjects());
    setNewName("");
    setNewIcon("📚");
    setNewDesc("");
    setShowAdd(false);
  };

  const handleDelete = (id: string) => {
    removeCustomSubject(id);
    setCustomSubjects(getCustomSubjects());
  };

  const allSubjects = [...DEFAULT_SUBJECTS, ...customSubjects];
  const openSubject = (id: string) => navigate(`/subject/${id}`);

  return (
    <div className="page-shell">
      <section className="page-hero mb-6">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-2xl">
            <p className="page-kicker">Рабочее пространство</p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
              Профессиональный кабинет для предметов и персональных уроков
            </h1>
            <p className="mt-3 text-sm leading-6 text-muted-foreground md:text-base">
              Выбирай предмет, запускай объяснения на доске, собирай свои материалы и двигайся по темам в одном аккуратном интерфейсе.
            </p>
          </div>

          <div className="grid w-full gap-3 sm:grid-cols-3 xl:max-w-xl">
            <div className="metric-tile">
              <p className="page-kicker">Предметов</p>
              <p className="mt-2 text-3xl font-semibold text-foreground">{allSubjects.length}</p>
              <p className="mt-1 text-sm text-muted-foreground">готово к работе</p>
            </div>
            <div className="metric-tile">
              <p className="page-kicker">Своих</p>
              <p className="mt-2 text-3xl font-semibold text-foreground">{customSubjects.length}</p>
              <p className="mt-1 text-sm text-muted-foreground">можно расширять под себя</p>
            </div>
            <div className="metric-tile">
              <p className="page-kicker">Формат</p>
              <div className="mt-2 flex items-center gap-2 text-foreground">
                <BookOpenCheck className="h-5 w-5 text-primary" />
                <span className="text-sm font-medium">AI + доска + тесты</span>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">без переключения между экранами</p>
            </div>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {allSubjects.map((subject) => (
          <div
            key={subject.id}
            role="button"
            tabIndex={0}
            onClick={() => openSubject(subject.id)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                openSubject(subject.id);
              }
            }}
            className="group panel-surface relative cursor-pointer overflow-hidden p-5 text-left transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_28px_70px_-46px_rgba(15,23,42,0.45)]"
          >
            <div
              className="pointer-events-none absolute inset-x-0 top-0 h-32 opacity-90 transition-transform duration-300 group-hover:scale-105"
              style={{
                background: `linear-gradient(135deg, hsl(${subject.color} / 0.26) 0%, transparent 72%)`,
              }}
            />
            {!DEFAULT_SUBJECTS.find((s) => s.id === subject.id) && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete(subject.id);
                }}
                className="absolute right-4 top-4 rounded-xl border border-white/70 bg-white/80 p-2 text-muted-foreground opacity-0 shadow-sm transition hover:border-destructive/20 hover:bg-destructive/5 hover:text-destructive group-hover:opacity-100"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}

            <div className="relative flex h-full flex-col">
              <div className="flex items-start justify-between gap-4">
                <div
                  className="flex h-16 w-16 items-center justify-center rounded-[22px] border border-white/70 text-3xl shadow-[0_20px_35px_-28px_rgba(15,23,42,0.45)]"
                  style={{ backgroundColor: `hsl(${subject.color} / 0.16)` }}
                >
                  {subject.icon}
                </div>
                <span className="rounded-full border border-white/80 bg-white/80 px-3 py-1 text-xs font-medium text-muted-foreground">
                  Персональный маршрут
                </span>
              </div>

              <div className="mt-10">
                <p className="page-kicker">Предмет</p>
                <h3 className="mt-2 text-2xl font-semibold tracking-tight text-card-foreground">{subject.name}</h3>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">{subject.description}</p>
              </div>

              <div className="mt-8 flex items-center justify-between border-t border-border/70 pt-4 text-sm">
                <span className="font-medium text-foreground">Открыть кабинет</span>
                <ArrowUpRight className="h-4 w-4 text-muted-foreground transition group-hover:text-primary" />
              </div>
            </div>
          </div>
        ))}

        <button
          onClick={() => setShowAdd(true)}
          className="panel-surface flex min-h-[292px] flex-col items-center justify-center gap-4 border-2 border-dashed border-border bg-white/45 p-6 text-center text-muted-foreground transition hover:border-primary/30 hover:bg-white/65 hover:text-foreground"
        >
          <div className="flex h-16 w-16 items-center justify-center rounded-[22px] border border-dashed border-primary/30 bg-primary/5">
            <Plus className="h-8 w-8 text-primary" />
          </div>
          <div>
            <p className="text-lg font-semibold text-foreground">Добавить свой предмет</p>
            <p className="mt-2 max-w-xs text-sm leading-6 text-muted-foreground">
              Создай отдельное пространство под олимпиадную тему, подготовку к экзамену или любой другой курс.
            </p>
          </div>
        </button>
      </div>

      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-[30px] border border-white/75 bg-white/90 p-6 shadow-[0_30px_80px_-45px_rgba(15,23,42,0.55)]">
            <p className="page-kicker">Новая область обучения</p>
            <h2 className="mt-2 text-2xl font-semibold text-card-foreground">Создать предмет</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Добавь название, символ и краткое описание. Всё остальное интерфейс подхватит автоматически.
            </p>

            <div className="mt-6 space-y-4">
              <div className="flex gap-3">
                <input
                  value={newIcon}
                  onChange={(e) => setNewIcon(e.target.value)}
                  className="w-20 rounded-2xl border border-border bg-secondary/80 px-3 py-3 text-center text-2xl outline-none transition focus:border-primary/40 focus:ring-2 focus:ring-primary/10"
                  placeholder="📚"
                />
                <input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Название предмета"
                  className="flex-1 rounded-2xl border border-border bg-secondary/80 px-4 py-3 text-sm text-foreground outline-none placeholder:text-muted-foreground transition focus:border-primary/40 focus:ring-2 focus:ring-primary/10"
                />
              </div>
              <input
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                placeholder="Описание (необязательно)"
                className="w-full rounded-2xl border border-border bg-secondary/80 px-4 py-3 text-sm text-foreground outline-none placeholder:text-muted-foreground transition focus:border-primary/40 focus:ring-2 focus:ring-primary/10"
              />
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowAdd(false)}
                  className="flex-1 rounded-2xl border border-border px-4 py-3 text-sm text-muted-foreground transition hover:bg-secondary/60 hover:text-foreground"
                >
                  Отмена
                </button>
                <button
                  onClick={handleAdd}
                  disabled={!newName.trim()}
                  className="flex-1 rounded-2xl bg-primary px-4 py-3 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
                >
                  Добавить
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
