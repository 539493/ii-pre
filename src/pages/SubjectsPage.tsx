import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Trash2 } from "lucide-react";
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

  return (
    <div className="flex h-full flex-col p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Мои предметы</h1>
        <p className="mt-1 text-sm text-muted-foreground">Выбери предмет для начала урока</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {allSubjects.map((subject) => (
          <button
            key={subject.id}
            onClick={() => navigate(`/subject/${subject.id}`)}
            className="group relative flex flex-col items-start gap-3 rounded-2xl border border-border bg-card p-5 text-left shadow-lg transition-all hover:border-primary/30 hover:shadow-xl"
          >
            {!DEFAULT_SUBJECTS.find((s) => s.id === subject.id) && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete(subject.id);
                }}
                className="absolute right-3 top-3 rounded-lg p-1.5 text-muted-foreground opacity-0 transition hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
            <span className="text-4xl">{subject.icon}</span>
            <div>
              <h3 className="text-lg font-semibold text-card-foreground">{subject.name}</h3>
              <p className="mt-1 text-xs text-muted-foreground">{subject.description}</p>
            </div>
          </button>
        ))}

        {/* Add subject button */}
        <button
          onClick={() => setShowAdd(true)}
          className="flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-border bg-card/50 p-5 text-muted-foreground transition hover:border-primary/30 hover:text-foreground"
        >
          <Plus className="h-8 w-8" />
          <span className="text-sm font-medium">Добавить предмет</span>
        </button>
      </div>

      {/* Add subject modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-xl">
            <h2 className="mb-4 text-lg font-semibold text-card-foreground">Новый предмет</h2>
            <div className="space-y-3">
              <div className="flex gap-3">
                <input
                  value={newIcon}
                  onChange={(e) => setNewIcon(e.target.value)}
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
              <input
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                placeholder="Описание (необязательно)"
                className="w-full rounded-xl border border-border bg-secondary px-3 py-2.5 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:ring-1 focus:ring-ring"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => setShowAdd(false)}
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
