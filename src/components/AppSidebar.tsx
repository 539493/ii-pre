import {
  BarChart3,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  GraduationCap,
  Library,
  User,
  type LucideIcon,
} from "lucide-react";
import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

type NavItem = {
  label: string;
  icon: LucideIcon;
  path: string;
};

const navItems: NavItem[] = [
  { label: "Мои предметы", icon: BookOpen, path: "/" },
  { label: "Мои тесты", icon: ClipboardCheck, path: "/tests" },
  { label: "Материалы", icon: Library, path: "/materials" },
  { label: "Успеваемость", icon: BarChart3, path: "/progress" },
  { label: "Профиль", icon: User, path: "/profile" },
];

function BrandMark() {
  return (
    <div className="flex items-center gap-3">
      <div className="relative grid h-9 w-9 place-items-center rounded-[18px] border border-[#e7ddc7] bg-[#fbf8f0] text-[#c49a45] shadow-[0_10px_30px_rgba(15,23,42,0.05)]">
        <GraduationCap className="h-4.5 w-4.5" strokeWidth={1.9} />
        <span className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-[#2563eb] ring-[3px] ring-white" />
      </div>
      <div>
        <div className="font-serif text-[22px] font-semibold leading-none tracking-[-0.03em] text-[#101828]">
          AI Tutor
        </div>
        <div className="mt-1 text-[10px] font-medium uppercase tracking-[0.22em] text-[#9aa3b2]">
          workspace
        </div>
      </div>
    </div>
  );
}

export default function AppSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path: string) => {
    if (path === "/") return location.pathname === "/" || location.pathname.startsWith("/subject/");
    return location.pathname.startsWith(path);
  };

  return (
    <aside
      className={cn(
        "hidden h-full shrink-0 flex-col border-r border-[#e8e4dc] bg-[#fbfaf7]/95 py-7 shadow-[18px_0_60px_rgba(15,23,42,0.035)] backdrop-blur-xl lg:flex",
        collapsed ? "w-[84px] px-3" : "w-[252px] px-5",
      )}
    >
      <button
        type="button"
        onClick={() => navigate("/")}
        className={cn("rounded-2xl text-left", collapsed && "mx-auto")}
        title={collapsed ? "AI Tutor workspace" : undefined}
      >
        {collapsed ? (
          <div className="relative grid h-9 w-9 place-items-center rounded-[18px] border border-[#e7ddc7] bg-[#fbf8f0] text-[#c49a45] shadow-[0_10px_30px_rgba(15,23,42,0.05)]">
            <GraduationCap className="h-4.5 w-4.5" strokeWidth={1.9} />
            <span className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-[#2563eb] ring-[3px] ring-white" />
          </div>
        ) : (
          <BrandMark />
        )}
      </button>

      <div className="my-7 h-px bg-gradient-to-r from-transparent via-[#ded8cb] to-transparent" />

      <nav className="space-y-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);

          return (
            <button
              key={item.label}
              type="button"
              onClick={() => navigate(item.path)}
              title={collapsed ? item.label : undefined}
              className={cn(
                "group relative flex h-12 w-full items-center gap-3 rounded-2xl text-left text-[14px] font-semibold transition-all duration-200",
                active
                  ? "bg-white text-[#175cdf] shadow-[0_14px_38px_rgba(37,99,235,0.10),inset_0_0_0_1px_rgba(37,99,235,0.10)]"
                  : "text-[#667085] hover:bg-white/70 hover:text-[#111827] hover:shadow-[0_10px_30px_rgba(15,23,42,0.04)]",
                collapsed ? "justify-center px-0" : "px-3.5",
              )}
            >
              {active && (
                <span className={cn(
                  "absolute top-1/2 h-8 w-1 -translate-y-1/2 rounded-r-full bg-[#2563eb]",
                  collapsed ? "-left-3" : "-left-6",
                )} />
              )}

              <span
                className={cn(
                  "grid h-8 w-8 place-items-center rounded-xl transition-colors duration-200",
                  active
                    ? "bg-[#2563eb] text-white shadow-[0_12px_24px_rgba(37,99,235,0.22)]"
                    : "bg-transparent text-[#748198] group-hover:bg-[#f3f6fb]",
                )}
              >
                <Icon className="h-4.5 w-4.5" strokeWidth={1.9} />
              </span>

              {!collapsed && <span>{item.label}</span>}
            </button>
          );
        })}
      </nav>

      <div className="mt-auto">
        <div className="mb-5 h-px bg-gradient-to-r from-transparent via-[#ded8cb] to-transparent" />
        <button
          type="button"
          onClick={() => setCollapsed((prev) => !prev)}
          className={cn(
            "group flex h-11 w-full items-center rounded-2xl text-[13px] font-semibold text-[#667085] transition-all duration-200 hover:bg-white hover:text-[#111827] hover:shadow-[0_10px_30px_rgba(15,23,42,0.04)]",
            collapsed ? "justify-center px-0" : "gap-3 px-3",
          )}
        >
          <span className="grid h-7 w-7 place-items-center rounded-full border border-[#e6e1d8] bg-white text-[#667085] transition-colors group-hover:border-[#ccd5e8] group-hover:text-[#2563eb]">
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </span>
          {!collapsed && "Свернуть"}
        </button>
      </div>
    </aside>
  );
}
