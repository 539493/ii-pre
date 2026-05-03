import {
  BarChart3,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
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

function TutorCrest() {
  return (
    <svg viewBox="0 0 48 48" className="h-9 w-9" fill="none" aria-hidden="true">
      <path
        d="M24 4 36 9v12.8c0 8.1-4.8 15.5-12 18.8-7.2-3.3-12-10.7-12-18.8V9L24 4Z"
        stroke="#18356B"
        strokeWidth="2.1"
        strokeLinejoin="round"
      />
      <path
        d="M24 10.5 31.5 13v8.4c0 4.8-2.9 9.2-7.5 11.3-4.6-2.1-7.5-6.5-7.5-11.3V13l7.5-2.5Z"
        stroke="#D5A64B"
        strokeWidth="1.9"
        strokeLinejoin="round"
      />
      <path
        d="M18.5 18.2c1.8-1.1 3.7-1.6 5.5-1.6 1.8 0 3.7.5 5.5 1.6v7.1c-1.8-1-3.7-1.5-5.5-1.5-1.8 0-3.7.5-5.5 1.5v-7.1Z"
        stroke="#18356B"
        strokeWidth="1.9"
        strokeLinejoin="round"
      />
      <path d="M24 16.6v8.4" stroke="#18356B" strokeWidth="1.9" strokeLinecap="round" />
    </svg>
  );
}

function BrandMark() {
  return (
    <div className="flex items-center gap-2.5">
      <TutorCrest />
      <div className="min-w-0">
        <div className="font-serif text-[21px] font-semibold leading-none tracking-[-0.04em] text-[#132b5b]">
          AI Tutor
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
        "hidden h-full shrink-0 flex-col border-r border-[#ebe6dc] bg-[#fcfbf7] py-6 shadow-[18px_0_60px_rgba(15,23,42,0.025)] lg:flex",
        collapsed ? "w-[84px] px-3.5" : "w-[248px] px-4",
      )}
    >
      <button
        type="button"
        onClick={() => navigate("/")}
        className={cn("rounded-2xl text-left", collapsed && "mx-auto")}
        title={collapsed ? "AI Tutor" : undefined}
      >
        {collapsed ? <TutorCrest /> : <BrandMark />}
      </button>

      <div className="my-6 h-px bg-gradient-to-r from-transparent via-[#e6dfd3] to-transparent" />

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
                "group flex h-12 w-full items-center gap-2.5 rounded-[16px] text-left text-[14px] font-medium transition-all duration-200",
                active
                  ? "bg-[#eef4ff] text-[#2563eb] shadow-[inset_0_0_0_1px_rgba(37,99,235,0.06)]"
                  : "text-[#5f6f8f] hover:bg-white hover:text-[#132b5b] hover:shadow-[0_12px_28px_rgba(15,23,42,0.04)]",
                collapsed ? "justify-center px-0" : "px-3.5",
              )}
            >
              <Icon
                className={cn(
                  "h-4.5 w-4.5 shrink-0 transition-colors",
                  active ? "text-[#2563eb]" : "text-[#8090ae]",
                )}
                strokeWidth={1.9}
              />
              {!collapsed && <span>{item.label}</span>}
            </button>
          );
        })}
      </nav>

      <div className="mt-auto">
        <div className="mb-4 h-px bg-gradient-to-r from-transparent via-[#e6dfd3] to-transparent" />
        <button
          type="button"
          onClick={() => setCollapsed((prev) => !prev)}
          className={cn(
            "group flex h-10 w-full items-center rounded-[16px] text-[14px] font-medium text-[#6c7b98] transition-all duration-200 hover:bg-white hover:text-[#132b5b] hover:shadow-[0_10px_30px_rgba(15,23,42,0.04)]",
            collapsed ? "justify-center px-0" : "gap-2.5 px-3.5",
          )}
        >
          <span className="grid h-7 w-7 place-items-center rounded-full border border-[#e7e2d9] bg-white text-[#6c7b98] transition-colors group-hover:border-[#d5dff1] group-hover:text-[#2563eb]">
            {collapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronLeft className="h-3.5 w-3.5" />}
          </span>
          {!collapsed && "Свернуть"}
        </button>
      </div>
    </aside>
  );
}
