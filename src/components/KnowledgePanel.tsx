import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { KnowledgeItem } from "@/types/tutor";
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

    const { error: err } = await supabase.from("knowledge_items").insert({
      title: title.trim(),
      content: content.trim(),
    } as any);

    setSaving(false);
    if (err) {
      setError(err.message);
      return;
    }
    setTitle("");
    setContent("");
    onRefresh();
  }

  async function handleDelete(id: string) {
    await supabase.from("knowledge_items").delete().eq("id", id);
    onRefresh();
  }

  return (
    <div className="panel-surface flex h-full flex-col gap-4 p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold text-card-foreground">База знаний</h2>
          </div>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Сохраняй формулы, определения и свои заметки. AI будет опираться на них в ответах.
          </p>
        </div>
        <span className="rounded-full border border-border/80 bg-secondary/70 px-3 py-1 text-xs font-medium text-muted-foreground">
          {items.length} записей
        </span>
      </div>

      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Название заметки"
        className="w-full rounded-2xl border border-border bg-secondary/80 px-4 py-3 text-sm text-foreground outline-none transition focus:border-primary/40 focus:ring-2 focus:ring-primary/10"
      />

      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Формулы, теория, определения…"
        className="h-32 w-full resize-none rounded-2xl border border-border bg-secondary/80 px-4 py-3 text-sm text-foreground outline-none transition focus:border-primary/40 focus:ring-2 focus:ring-primary/10"
      />

      <button
        onClick={handleSave}
        disabled={saving}
        className="flex items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-3 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
      >
        <Plus className="h-4 w-4" />
        {saving ? "Сохраняю…" : "Сохранить"}
      </button>

      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}

      <div className="soft-scrollbar mt-2 flex-1 space-y-2 overflow-y-auto pr-1">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Сохранённые
        </p>
        {items.length === 0 && (
          <p className="rounded-2xl border border-dashed border-border bg-secondary/30 p-4 text-center text-sm text-muted-foreground">
            Пока пусто
          </p>
        )}
        {items.map((item) => (
          <div key={item.id} className="group rounded-2xl border border-border/80 bg-secondary/55 p-4 shadow-[0_12px_24px_-24px_rgba(15,23,42,0.55)]">
            <div className="flex items-start justify-between gap-2">
              <div className="font-medium text-sm text-foreground">{item.title}</div>
              <button
                onClick={() => handleDelete(item.id)}
                className="opacity-0 group-hover:opacity-100 transition text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
            <p className="mt-2 line-clamp-3 text-xs leading-6 text-muted-foreground">{item.content}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
