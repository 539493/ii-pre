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
      className={`flex h-full flex-col border-r border-border bg-sidebar transition-all duration-300 ${
        collapsed ? "w-16" : "w-56"
      }`}
    >
      {/* Logo */}
      <div className="flex items-center gap-2 border-b border-border px-4 py-4">
        <GraduationCap className="h-7 w-7 shrink-0 text-primary" />
        {!collapsed && <span className="text-lg font-bold text-foreground">AI Tutor</span>}
      </div>

      {/* Nav items */}
      <nav className="flex-1 space-y-1 p-2">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);
          return (
            <button
              key={item.id}
              onClick={() => navigate(item.path)}
              className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
                active
                  ? "bg-primary/15 text-primary"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              }`}
            >
              <Icon className="h-5 w-5 shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </button>
          );
        })}
      </nav>

      {/* Collapse toggle */}
      <div className="border-t border-border p-2">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex w-full items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm text-muted-foreground transition hover:bg-secondary hover:text-foreground"
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          {!collapsed && <span>Свернуть</span>}
        </button>
      </div>
    </div>
  );
}
