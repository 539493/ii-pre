import { useRef, useState, useEffect, useCallback } from "react";
import { Eraser, Pen, RotateCcw, Send } from "lucide-react";

interface Props {
  onSubmitDrawing: (dataUrl: string) => void;
}

export default function DrawingCanvas({ onSubmitDrawing }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [tool, setTool] = useState<"pen" | "eraser">("pen");
  const [penColor, setPenColor] = useState("#E2E8F0");
  const [penSize, setPenSize] = useState(3);

  const getCtx = useCallback(() => canvasRef.current?.getContext("2d"), []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.scale(dpr, dpr);
      ctx.fillStyle = "#0F172A";
      ctx.fillRect(0, 0, rect.width, rect.height);
    }
  }, []);

  const getPos = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    if ("touches" in e) {
      return { x: e.touches[0].clientX - rect.left, y: e.touches[0].clientY - rect.top };
    }
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const startDraw = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    setIsDrawing(true);
    const ctx = getCtx();
    if (!ctx) return;
    const pos = getPos(e);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    e.preventDefault();
    const ctx = getCtx();
    if (!ctx) return;
    const pos = getPos(e);
    ctx.strokeStyle = tool === "eraser" ? "#0F172A" : penColor;
    ctx.lineWidth = tool === "eraser" ? 20 : penSize;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
  };

  const endDraw = () => setIsDrawing(false);

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = getCtx();
    if (!canvas || !ctx) return;
    const rect = canvas.getBoundingClientRect();
    ctx.fillStyle = "#0F172A";
    ctx.fillRect(0, 0, rect.width, rect.height);
  };

  const submitDrawing = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL("image/png");
    onSubmitDrawing(dataUrl);
  };

  const COLORS = ["#E2E8F0", "#818CF8", "#34D399", "#F97316", "#F43F5E", "#FBBF24"];

  return (
    <div className="flex flex-col gap-2">
      {/* Toolbar */}
      <div className="flex items-center gap-2 flex-wrap">
        <button
          onClick={() => setTool("pen")}
          className={`flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs transition ${
            tool === "pen" ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"
          }`}
        >
          <Pen className="h-3.5 w-3.5" /> Ручка
        </button>
        <button
          onClick={() => setTool("eraser")}
          className={`flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs transition ${
            tool === "eraser" ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"
          }`}
        >
          <Eraser className="h-3.5 w-3.5" /> Ластик
        </button>
        <div className="flex gap-1">
          {COLORS.map((c) => (
            <button
              key={c}
              onClick={() => { setPenColor(c); setTool("pen"); }}
              className={`h-5 w-5 rounded-full border-2 transition ${penColor === c && tool === "pen" ? "border-foreground scale-110" : "border-transparent"}`}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
        <input
          type="range"
          min={1}
          max={8}
          value={penSize}
          onChange={(e) => setPenSize(Number(e.target.value))}
          className="w-16"
        />
        <button onClick={clearCanvas} className="ml-auto flex items-center gap-1 rounded-lg bg-secondary px-2.5 py-1.5 text-xs text-muted-foreground transition hover:text-foreground">
          <RotateCcw className="h-3.5 w-3.5" /> Очистить
        </button>
        <button onClick={submitDrawing} className="flex items-center gap-1 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground transition hover:opacity-90">
          <Send className="h-3.5 w-3.5" /> Проверить
        </button>
      </div>

      {/* Canvas */}
      <canvas
        ref={canvasRef}
        className="w-full rounded-xl border border-border cursor-crosshair touch-none"
        style={{ height: "280px" }}
        onMouseDown={startDraw}
        onMouseMove={draw}
        onMouseUp={endDraw}
        onMouseLeave={endDraw}
        onTouchStart={startDraw}
        onTouchMove={draw}
        onTouchEnd={endDraw}
      />
    </div>
  );
}
