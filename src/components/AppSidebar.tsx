import { BookOpen, GraduationCap, BarChart3, User, ChevronLeft, ChevronRight, ClipboardList } from "lucide-react";
import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";

const NAV_ITEMS = [
  { id: "subjects", label: "Мои предметы", icon: GraduationCap, path: "/" },
  { id: "tests", label: "Мои тесты", icon: ClipboardList, path: "/tests" },
  { id: "materials", label: "Материалы", icon: BookOpen, path: "/materials" },
  { id: "progress", label: "Успеваемость", icon: BarChart3, path: "/progress" },
  { id: "profile", label: "Профиль", icon: User, path: "/profile" },
];

export default function AppSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path: string) => {
    if (path === "/") return location.pathname === "/" || location.pathname.startsWith("/subject/");
    return location.pathname.startsWith(path);
  };

  return (
    <div
      className={`sidebar-shadow flex h-full flex-col border-r border-sidebar-border/80 bg-sidebar text-sidebar-foreground transition-all duration-300 ${
        collapsed ? "w-[88px]" : "w-[292px]"
      }`}
    >
      <div className="border-b border-white/10 p-4">
        <div className={`rounded-[24px] border border-white/10 bg-white/5 p-4 transition-all ${collapsed ? "flex justify-center" : "space-y-4"}`}>
          <div className={`flex items-center ${collapsed ? "justify-center" : "gap-3"}`}>
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-sidebar-primary via-cyan-200 to-white shadow-[0_18px_34px_-20px_rgba(34,211,238,0.65)]">
              <GraduationCap className="h-6 w-6 text-sidebar-primary-foreground" />
            </div>
            {!collapsed && (
              <div>
                <p className="text-lg font-semibold tracking-tight text-white">Smart Canvas</p>
                <p className="text-xs text-slate-300">Персональный AI-репетитор</p>
              </div>
            )}
          </div>

          {!collapsed && (
            <div className="rounded-2xl border border-white/10 bg-black/10 px-3 py-3">
              <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-400">Learning OS</p>
              <p className="mt-1 text-sm leading-relaxed text-slate-200">
                Собранный рабочий кабинет для предметов, тестов и прогресса.
              </p>
            </div>
          )}
        </div>
      </div>

      <nav className="flex-1 space-y-2 p-3">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);
          return (
            <button
              key={item.id}
              onClick={() => navigate(item.path)}
              className={`flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-sm font-medium transition-all ${
                active
                  ? "bg-white/14 text-white shadow-[0_18px_40px_-30px_rgba(255,255,255,0.6)]"
                  : "text-slate-300 hover:bg-white/7 hover:text-white"
              }`}
              title={collapsed ? item.label : undefined}
            >
              <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${active ? "bg-white/10" : "bg-white/5"}`}>
                <Icon className="h-5 w-5 shrink-0" />
              </span>
              {!collapsed && (
                <span className="flex flex-1 items-center justify-between gap-3">
                  <span>{item.label}</span>
                  {active && <span className="h-2 w-2 rounded-full bg-sidebar-primary" />}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      <div className="border-t border-white/10 p-3">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-3 py-3 text-sm text-slate-300 transition hover:bg-white/10 hover:text-white"
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          {!collapsed && <span>Свернуть панель</span>}
        </button>
      </div>
    </div>
  );
}
