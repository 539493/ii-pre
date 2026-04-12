import { useRef } from "react";
import { ImagePlus } from "lucide-react";

interface Props {
  onImageSelected: (base64: string) => void;
  disabled?: boolean;
}

export default function ImageUpload({ onImageSelected, disabled }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert("Файл слишком большой (макс. 5MB)");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      onImageSelected(result);
    };
    reader.readAsDataURL(file);
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleFile}
        className="hidden"
      />
      <button
        onClick={() => inputRef.current?.click()}
        disabled={disabled}
        title="Загрузить фото задачи"
        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-border bg-secondary text-muted-foreground transition hover:bg-primary/20 hover:text-primary disabled:opacity-50"
      >
        <ImagePlus className="h-5 w-5" />
      </button>
    </>
  );
}
