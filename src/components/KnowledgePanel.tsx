import { useState } from "react";
import { KnowledgeItem } from "@/types/tutor";
import { createKnowledgeItem, deleteKnowledgeItem } from "@/services/tutorData";
import { BookOpen, Plus, Trash2 } from "lucide-react";

interface Props {
  items: KnowledgeItem[];
  onRefresh: () => void;
}

export default function KnowledgePanel({ items, onRefresh }: Props) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSave() {
    if (!title.trim() || !content.trim()) {
      setError("Добавь название и текст.");
      return;
    }
    setError("");
    setSaving(true);

    try {
      await createKnowledgeItem({
        title: title.trim(),
        content: content.trim(),
      });
      setTitle("");
      setContent("");
      onRefresh();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Не удалось сохранить материал.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteKnowledgeItem(id);
      onRefresh();
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Не удалось удалить материал.");
    }
  }

  return (
    <div className="flex h-full flex-col gap-4 rounded-2xl border border-border bg-card p-4 shadow-lg">
      <div className="flex items-center gap-2">
        <BookOpen className="h-5 w-5 text-primary" />
        <h2 className="text-lg font-semibold text-card-foreground">Knowledge Base</h2>
      </div>

      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Название заметки"
        className="w-full rounded-xl border border-border bg-secondary px-3 py-2.5 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:ring-1 focus:ring-ring"
      />

      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Формулы, теория, определения…"
        className="h-32 w-full resize-none rounded-xl border border-border bg-secondary px-3 py-2.5 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:ring-1 focus:ring-ring"
      />

      <button
        onClick={handleSave}
        disabled={saving}
        className="flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
      >
        <Plus className="h-4 w-4" />
        {saving ? "Сохраняю…" : "Сохранить"}
      </button>

      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}

      <div className="mt-2 flex-1 space-y-2 overflow-y-auto">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Сохранённые
        </p>
        {items.length === 0 && (
          <p className="rounded-xl border border-dashed border-border p-3 text-center text-sm text-muted-foreground">
            Пока пусто
          </p>
        )}
        {items.map((item) => (
          <div key={item.id} className="group rounded-xl border border-border bg-secondary p-3">
            <div className="flex items-start justify-between gap-2">
              <div className="font-medium text-sm text-foreground">{item.title}</div>
              <button
                onClick={() => handleDelete(item.id)}
                className="opacity-0 group-hover:opacity-100 transition text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
            <p className="mt-1 line-clamp-3 text-xs text-muted-foreground">{item.content}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
