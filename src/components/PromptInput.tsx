import { Send, ImagePlus, X } from "lucide-react";
import { useRef } from "react";

interface Props {
  prompt: string;
  setPrompt: (v: string) => void;
  onSubmit: () => void;
  loading: boolean;
  attachedImage?: string | null;
  onAttachImage?: (base64: string | null) => void;
}

export default function PromptInput({ prompt, setPrompt, onSubmit, loading, attachedImage, onAttachImage }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert("Файл слишком большой (макс. 5MB)");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => onAttachImage?.(reader.result as string);
    reader.readAsDataURL(file);
    if (fileRef.current) fileRef.current.value = "";
  };

  return (
    <div className="rounded-2xl border border-border bg-card p-3 shadow-lg">
      {/* Attached image preview */}
      {attachedImage && (
        <div className="mb-2 flex items-start gap-2">
          <img src={attachedImage} alt="Прикреплённое фото" className="h-20 rounded-lg object-contain border border-border" />
          <button
            onClick={() => onAttachImage?.(null)}
            className="rounded-full p-1 text-muted-foreground hover:bg-secondary hover:text-foreground transition"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      <div className="flex items-end gap-3">
        {/* Image attach button */}
        <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} className="hidden" />
        <button
          onClick={() => fileRef.current?.click()}
          disabled={loading}
          title="Прикрепить фото"
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-border bg-secondary text-muted-foreground transition hover:bg-primary/20 hover:text-primary disabled:opacity-50"
        >
          <ImagePlus className="h-5 w-5" />
        </button>

        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              onSubmit();
            }
          }}
          placeholder="Что ты хочешь изучить? Например: Объясни производную…"
          className="min-h-[56px] flex-1 resize-none rounded-xl border-0 bg-transparent px-3 py-3 text-sm text-foreground outline-none placeholder:text-muted-foreground"
          rows={2}
        />
        <button
          onClick={onSubmit}
          disabled={loading && !attachedImage}
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
        >
          {loading ? (
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
          ) : (
            <Send className="h-5 w-5" />
          )}
        </button>
      </div>
    </div>
  );
}
