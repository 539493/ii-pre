import { BoardItem, BoardArrowItem } from "@/types/tutor";

const BOARD_W = 900;
const BOARD_H = 560;

function pctX(x: number) {
  return `${(x / BOARD_W) * 100}%`;
}

function pctY(y: number) {
  return `${(y / BOARD_H) * 100}%`;
}

export default function BoardRenderer({ items }: { items: BoardItem[] }) {
  const arrows = items.filter((i) => i.type === "arrow") as BoardArrowItem[];
  const blocks = items.filter((i) => i.type !== "arrow");

  return (
    <div className="relative w-full overflow-hidden rounded-2xl" style={{ paddingBottom: `${(BOARD_H / BOARD_W) * 100}%` }}>
      <div
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(circle at 20% 15%, rgba(96, 165, 250, 0.16), transparent 28%),
            radial-gradient(circle at 85% 12%, rgba(45, 212, 191, 0.1), transparent 22%),
            linear-gradient(180deg, hsl(221 36% 13%) 0%, hsl(223 32% 10%) 100%)
          `,
          boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04)",
        }}
      >
        <svg className="absolute inset-0 h-full w-full opacity-[0.08]">
          <defs>
            <pattern id="grid-dots" width="36" height="36" patternUnits="userSpaceOnUse">
              <circle cx="18" cy="18" r="1" fill="currentColor" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid-dots)" />
        </svg>
        <svg className="absolute inset-0 h-full w-full opacity-[0.05]">
          <defs>
            <pattern id="grid-lines" width="90" height="90" patternUnits="userSpaceOnUse">
              <path d="M 90 0 L 0 0 0 90" fill="none" stroke="currentColor" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid-lines)" />
        </svg>

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
            return (
              <div
                key={item.id}
                className="absolute animate-chalk-write"
                style={{
                  left: pctX(item.x),
                  top: pctY(item.y),
                  fontSize: `${item.size || 20}px`,
                  color: item.color || "#F8FAFC",
                  fontFamily: item.type === "formula" ? "'Courier New', monospace" : "inherit",
                  fontStyle: item.type === "formula" ? "italic" : "normal",
                  fontWeight: item.type === "text" ? 600 : 400,
                  textShadow: "0 12px 30px rgba(15, 23, 42, 0.45)",
                  animationDelay: `${i * 0.15}s`,
                  opacity: 0,
                  whiteSpace: "nowrap",
                }}
              >
                {item.text}
              </div>
            );
          }

          if (item.type === "box") {
            return (
              <div
                key={item.id}
                className="absolute flex items-center justify-center rounded-xl border border-white/10 px-3 text-center animate-chalk-write"
                style={{
                  left: pctX(item.x),
                  top: pctY(item.y),
                  width: item.width ? `${(item.width / BOARD_W) * 100}%` : "auto",
                  height: item.height ? `${(item.height / BOARD_H) * 100}%` : "auto",
                  backgroundColor: item.color || "rgba(15, 23, 42, 0.42)",
                  color: item.textColor || "#E2E8F0",
                  fontSize: "14px",
                  boxShadow: "0 16px 40px -30px rgba(15, 23, 42, 0.8)",
                  backdropFilter: "blur(16px)",
                  animationDelay: `${i * 0.15}s`,
                  opacity: 0,
                }}
              >
                {item.text}
              </div>
            );
          }

          return null;
        })}
      </div>
    </div>
  );
}
