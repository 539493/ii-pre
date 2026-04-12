import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Trash2 } from "lucide-react";
import { getCustomSubjects, saveCustomSubject, removeCustomSubject, suggestSubjectAppearance } from "@/lib/subjects";
import { Subject } from "@/types/tutor";

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
    <div className="flex h-full flex-col p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Мои предметы</h1>
        <p className="mt-1 text-sm text-muted-foreground">Добавь свои предметы и открой по каждому отдельное рабочее пространство</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {subjects.map((subject) => (
          <button
            key={subject.id}
            onClick={() => navigate(`/subject/${subject.id}`)}
            className="group relative flex flex-col items-start gap-3 overflow-hidden rounded-2xl border border-border bg-card p-5 text-left shadow-lg transition-all hover:border-primary/30 hover:shadow-xl"
          >
            <div
              className="pointer-events-none absolute inset-x-0 top-0 h-1.5"
              style={{ backgroundColor: `hsl(${subject.color})` }}
            />
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleDelete(subject.id);
              }}
              className="absolute right-3 top-3 rounded-lg p-1.5 text-muted-foreground opacity-0 transition hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100"
            >
              <Trash2 className="h-4 w-4" />
            </button>
            <div
              className="flex h-14 w-14 items-center justify-center rounded-2xl text-4xl"
              style={{ backgroundColor: `hsl(${subject.color} / 0.14)` }}
            >
              <span>{subject.icon}</span>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-card-foreground">{subject.name}</h3>
              <p className="mt-1 text-xs text-muted-foreground">{subject.description}</p>
            </div>
          </button>
        ))}

        <button
          onClick={() => {
            setShowAdd(true);
            setIconEditedManually(false);
            if (!newIcon.trim()) {
              setNewIcon("📚");
            }
          }}
          className="flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-border bg-card/50 p-5 text-muted-foreground transition hover:border-primary/30 hover:text-foreground"
        >
          <Plus className="h-8 w-8" />
          <span className="text-sm font-medium">Добавить предмет</span>
        </button>
      </div>

      {subjects.length === 0 && (
        <div className="mt-6 rounded-2xl border border-dashed border-border bg-card/50 px-6 py-10 text-center">
          <p className="text-lg font-semibold text-foreground">Пока предметов нет</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Создай первый предмет. Иконка подберётся автоматически по названию, а затем этот же предмет появится в тестах и успеваемости.
          </p>
        </div>
      )}

      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-xl">
            <h2 className="mb-4 text-lg font-semibold text-card-foreground">Новый предмет</h2>
            <div className="space-y-3">
              <div
                className="rounded-2xl border px-4 py-3"
                style={{
                  borderColor: `hsl(${suggestedAppearance.color} / 0.3)`,
                  backgroundColor: `hsl(${suggestedAppearance.color} / 0.08)`,
                }}
              >
                <div className="flex items-start gap-3">
                  <div
                    className="flex h-12 w-12 items-center justify-center rounded-2xl text-2xl"
                    style={{ backgroundColor: `hsl(${suggestedAppearance.color} / 0.16)` }}
                  >
                    {newIcon || suggestedAppearance.icon}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                      {suggestedAppearance.templateLabel}
                    </p>
                    <p className="mt-1 text-sm font-medium text-foreground">
                      {newName.trim() || "Предпросмотр предмета"}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {newDesc.trim() || suggestedAppearance.description}
                    </p>
                    <p className="mt-2 text-xs text-muted-foreground">
                      Пример запроса: {suggestedAppearance.examplePrompt}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <input
                  value={newIcon}
                  onChange={(e) => {
                    setNewIcon(e.target.value);
                    setIconEditedManually(true);
                  }}
                  className="w-16 rounded-xl border border-border bg-secondary px-3 py-2.5 text-center text-2xl outline-none focus:ring-1 focus:ring-ring"
                  placeholder="📚"
                />
                <input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Название предмета"
                  className="flex-1 rounded-xl border border-border bg-secondary px-3 py-2.5 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:ring-1 focus:ring-ring"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Подсказка: для «Английского языка» автоматически подставится флаг, для математики — тематическая иконка.
              </p>
              <input
                value={newDesc}
                onChange={(e) => {
                  setNewDesc(e.target.value);
                  setDescriptionEditedManually(true);
                }}
                placeholder="Описание (необязательно)"
                className="w-full rounded-xl border border-border bg-secondary px-3 py-2.5 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:ring-1 focus:ring-ring"
              />
              <div className="flex gap-2">
                <button
                  onClick={resetForm}
                  className="flex-1 rounded-xl border border-border px-4 py-2.5 text-sm text-muted-foreground transition hover:text-foreground"
                >
                  Отмена
                </button>
                <button
                  onClick={handleAdd}
                  disabled={!newName.trim()}
                  className="flex-1 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
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
