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
    <div className="rounded-[18px] border border-[#e7e1d8] bg-white p-3 shadow-[0_14px_28px_rgba(15,23,42,0.04)]">
      {/* Attached image preview */}
      {attachedImage && (
        <div className="mb-3 flex items-start gap-2">
          <img src={attachedImage} alt="Прикреплённое фото" className="h-20 rounded-[14px] border border-[#e7e1d8] object-contain" />
          <button
            onClick={() => onAttachImage?.(null)}
            className="rounded-full p-1 text-[#8a97b2] transition hover:bg-[#f5f7fb] hover:text-[#223761]"
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
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] border border-[#e7e1d8] bg-[#fcfbf8] text-[#6c7b98] transition hover:bg-[#eef4ff] hover:text-[#2563eb] disabled:opacity-50"
        >
          <ImagePlus className="h-4.5 w-4.5" />
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
          className="min-h-[52px] flex-1 resize-none rounded-[14px] border-0 bg-transparent px-2 py-2 text-[13px] leading-6 text-[#223761] outline-none placeholder:text-[#8a97b2]"
          rows={2}
        />
        <button
          onClick={onSubmit}
          disabled={loading}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] bg-[#2563eb] text-white transition hover:bg-[#175cdf] disabled:opacity-50"
        >
          {loading ? (
            <div className="h-4.5 w-4.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
          ) : (
            <Send className="h-4.5 w-4.5" />
          )}
        </button>
      </div>
    </div>
  );
}
