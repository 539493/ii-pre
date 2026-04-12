import { BoardItem, BoardArrowItem } from "@/types/tutor";

const BOARD_W = 900;
const BOARD_H = 560;
const BOARD_PADDING_X = 54;
const BOARD_PADDING_Y = 40;

type NormalizedTextLikeItem = {
  id: string;
  type: "text" | "formula";
  text: string;
  x: number;
  y: number;
  fontSize: number;
  widthPx: number;
  lineHeight: number;
  color?: string;
};

type NormalizedBoxItem = {
  id: string;
  type: "box";
  text: string;
  x: number;
  y: number;
  widthPx: number;
  heightPx: number;
  color?: string;
  textColor?: string;
  fontSize: number;
  lineHeight: number;
};

function pctX(x: number) {
  return `${(x / BOARD_W) * 100}%`;
}

function pctY(y: number) {
  return `${(y / BOARD_H) * 100}%`;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function getDensityScale(itemCount: number) {
  if (itemCount >= 12) return 0.76;
  if (itemCount >= 10) return 0.82;
  if (itemCount >= 8) return 0.9;
  return 1;
}

function wrapBoardText(text: string, maxCharsPerLine: number) {
  const cleanText = text.replace(/\s+/g, " ").trim();
  if (!cleanText) return "";

  const words = cleanText.split(" ");
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (candidate.length <= maxCharsPerLine || !current) {
      current = candidate;
      continue;
    }
    lines.push(current);
    current = word;
  }

  if (current) lines.push(current);
  return lines.join("\n");
}

function normalizeTextItem(item: Extract<BoardItem, { type: "text" | "formula" }>, densityScale: number): NormalizedTextLikeItem {
  const baseFont = clamp((item.size || 20) * densityScale, item.type === "formula" ? 16 : 15, 28);
  const safeX = clamp(item.x, BOARD_PADDING_X, BOARD_W - 220);
  const safeY = clamp(item.y, BOARD_PADDING_Y, BOARD_H - 110);
  const availableWidth = BOARD_W - safeX - BOARD_PADDING_X;
  const widthPx = clamp(availableWidth, 180, item.type === "formula" ? 300 : 340);
  const maxCharsPerLine = clamp(Math.floor(widthPx / (baseFont * (item.type === "formula" ? 0.7 : 0.58))), 12, 28);
  const wrappedText = wrapBoardText(item.text, maxCharsPerLine);
  const lineCount = wrappedText.split("\n").length;
  const adjustedFont = lineCount >= 3 ? clamp(baseFont - 1, 14, 26) : baseFont;

  return {
    id: item.id,
    type: item.type,
    text: wrappedText,
    x: safeX,
    y: safeY,
    widthPx,
    color: item.color,
    fontSize: adjustedFont,
    lineHeight: item.type === "formula" ? 1.35 : 1.28,
  };
}

function normalizeBoxItem(item: Extract<BoardItem, { type: "box" }>, densityScale: number): NormalizedBoxItem {
  const safeX = clamp(item.x, BOARD_PADDING_X, BOARD_W - 220);
  const safeY = clamp(item.y, BOARD_PADDING_Y, BOARD_H - 110);
  const widthPx = clamp((item.width || 240) * densityScale, 180, BOARD_W - safeX - BOARD_PADDING_X);
  const fontSize = clamp(15 * densityScale, 13, 17);
  const maxCharsPerLine = clamp(Math.floor((widthPx - 32) / (fontSize * 0.58)), 14, 28);
  const wrappedText = wrapBoardText(item.text, maxCharsPerLine);
  const lineCount = wrappedText.split("\n").length;
  const minHeight = 54;
  const contentHeight = Math.ceil(lineCount * fontSize * 1.28) + 28;
  const heightPx = clamp(item.height || contentHeight, minHeight, 150);

  return {
    id: item.id,
    type: "box",
    text: wrappedText,
    x: safeX,
    y: safeY,
    widthPx,
    heightPx,
    color: item.color,
    textColor: item.textColor,
    fontSize,
    lineHeight: 1.28,
  };
}

export default function BoardRenderer({ items }: { items: BoardItem[] }) {
  const arrows = items.filter((i) => i.type === "arrow") as BoardArrowItem[];
  const blocks = items.filter((i) => i.type !== "arrow");
  const densityScale = getDensityScale(blocks.length);

  return (
    <div className="relative w-full overflow-hidden rounded-2xl" style={{ paddingBottom: `${(BOARD_H / BOARD_W) * 100}%` }}>
      <div
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(ellipse at 30% 20%, hsl(220 30% 14%) 0%, hsl(220 30% 8%) 60%, hsl(220 30% 5%) 100%)
          `,
        }}
      >
        {/* Grid dots */}
        <svg className="absolute inset-0 h-full w-full opacity-[0.06]">
          <defs>
            <pattern id="grid-dots" width="40" height="40" patternUnits="userSpaceOnUse">
              <circle cx="20" cy="20" r="1" fill="currentColor" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid-dots)" />
        </svg>

        {/* Arrows */}
        <svg className="absolute inset-0 h-full w-full" viewBox={`0 0 ${BOARD_W} ${BOARD_H}`} preserveAspectRatio="xMidYMid meet">
          <defs>
            <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="10" refY="3.5" orient="auto">
              <polygon points="0 0, 10 3.5, 0 7" fill="#94A3B8" />
            </marker>
          </defs>
          {arrows.map((arrow, i) => (
            <line
              key={arrow.id}
              x1={arrow.fromX}
              y1={arrow.fromY}
              x2={arrow.toX}
              y2={arrow.toY}
              stroke={arrow.color || "#94A3B8"}
              strokeWidth="2"
              markerEnd="url(#arrowhead)"
              className="animate-chalk-write"
              style={{ animationDelay: `${i * 0.15}s` }}
            />
          ))}
        </svg>

        {/* Text & box items */}
        {blocks.map((item, i) => {
          if (item.type === "text" || item.type === "formula") {
            const normalized = normalizeTextItem(item, densityScale);
            return (
              <div
                key={normalized.id}
                className="absolute animate-chalk-write"
                style={{
                  left: pctX(normalized.x),
                  top: pctY(normalized.y),
                  width: `${(normalized.widthPx / BOARD_W) * 100}%`,
                  fontSize: `${normalized.fontSize}px`,
                  lineHeight: normalized.lineHeight,
                  color: normalized.color || "#F8FAFC",
                  fontFamily: normalized.type === "formula" ? "'Courier New', monospace" : "inherit",
                  fontStyle: normalized.type === "formula" ? "italic" : "normal",
                  fontWeight: normalized.type === "text" ? 600 : 500,
                  animationDelay: `${i * 0.15}s`,
                  opacity: 0,
                  whiteSpace: "pre-wrap",
                  overflowWrap: "anywhere",
                }}
              >
                {normalized.text}
              </div>
            );
          }

          if (item.type === "box") {
            const normalized = normalizeBoxItem(item, densityScale);
            return (
              <div
                key={normalized.id}
                className="absolute flex items-center justify-center rounded-xl border border-white/10 px-3 text-center animate-chalk-write"
                style={{
                  left: pctX(normalized.x),
                  top: pctY(normalized.y),
                  width: `${(normalized.widthPx / BOARD_W) * 100}%`,
                  height: `${(normalized.heightPx / BOARD_H) * 100}%`,
                  backgroundColor: normalized.color || "hsl(217 33% 14%)",
                  color: normalized.textColor || "#E2E8F0",
                  fontSize: `${normalized.fontSize}px`,
                  lineHeight: normalized.lineHeight,
                  animationDelay: `${i * 0.15}s`,
                  opacity: 0,
                  whiteSpace: "pre-wrap",
                  overflowWrap: "anywhere",
                }}
              >
                {normalized.text}
              </div>
            );
          }

          return null;
        })}
      </div>
    </div>
  );
}
