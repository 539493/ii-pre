import { useEffect, useState, type ReactNode } from "react";
import {
  Bell,
  ChevronLeft,
  ChevronDown,
  ChevronRight,
  CircleHelp,
  Search,
  SunMedium,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

export type DashboardOverviewItem = {
  label: string;
  value: string | number;
  tone?: "blue" | "amber" | "slate";
};

export type DashboardQuickAction = {
  label: string;
  icon: LucideIcon;
  onClick?: () => void;
};

type DashboardShellProps = {
  title: string;
  description: string;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
  toolbar?: ReactNode;
  overviewItems: DashboardOverviewItem[];
  quickActions?: DashboardQuickAction[];
  showQuickActions?: boolean;
  recentActivity?: ReactNode;
  compactHeader?: boolean;
  compactRail?: boolean;
  children: ReactNode;
};

const toneClasses: Record<NonNullable<DashboardOverviewItem["tone"]>, string> = {
  blue: "text-[#2563eb]",
  amber: "text-[#d4a448]",
  slate: "text-[#8a97b2]",
};

function TopbarIconButton({
  icon: Icon,
  className,
}: {
  icon: LucideIcon;
  className?: string;
}) {
  return (
    <button
      type="button"
      className={cn(
        "grid h-9 w-9 place-items-center rounded-full text-[#7e8cad] transition hover:bg-white hover:text-[#132b5b]",
        className,
      )}
    >
      <Icon className="h-[17px] w-[17px]" strokeWidth={1.8} />
    </button>
  );
}

function DashboardTopbar({
  searchValue = "",
  onSearchChange,
  searchPlaceholder = "Поиск по предметам, материалам и тестам...",
}: Pick<DashboardShellProps, "searchValue" | "onSearchChange" | "searchPlaceholder">) {
  const [internalValue, setInternalValue] = useState(searchValue);

  useEffect(() => {
    setInternalValue(searchValue);
  }, [searchValue]);

  const currentValue = onSearchChange ? searchValue : internalValue;

  return (
    <div className="border-b border-[#ece6dc] bg-[#fcfbf7]/95 px-4 py-3 backdrop-blur-xl sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-[1320px] items-center gap-3">
        <label className="relative flex min-w-0 flex-1 items-center">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8a97b2]" strokeWidth={1.9} />
          <input
            value={currentValue}
            onChange={(event) => {
              if (onSearchChange) {
                onSearchChange(event.target.value);
                return;
              }

              setInternalValue(event.target.value);
            }}
            placeholder={searchPlaceholder}
            className="h-10 w-full rounded-[18px] border border-[#e8e2d8] bg-white pl-10 pr-14 text-[14px] text-[#223761] outline-none transition placeholder:text-[#8492ae] focus:border-[#cedcff] focus:ring-4 focus:ring-[#2563eb]/8"
          />
          <span className="pointer-events-none absolute right-3.5 top-1/2 hidden -translate-y-1/2 text-[11px] font-semibold text-[#98a4bb] sm:block">
            ⌘K
          </span>
        </label>

        <div className="ml-auto hidden items-center gap-1 sm:flex">
          <TopbarIconButton icon={Bell} />
          <TopbarIconButton icon={CircleHelp} />
          <TopbarIconButton icon={SunMedium} />
          <button
            type="button"
            className="ml-1 flex items-center gap-2 rounded-full px-1 text-[#8a97b2] transition hover:bg-white"
          >
            <span className="grid h-10 w-10 place-items-center rounded-full bg-[#e4b85e] text-[18px] font-semibold text-white shadow-[0_12px_24px_rgba(228,184,94,0.26)]">
              A
            </span>
            <ChevronDown className="h-3.5 w-3.5" strokeWidth={1.8} />
          </button>
        </div>
      </div>
    </div>
  );
}

export function DashboardPanel({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <section
      className={cn(
        "rounded-[22px] border border-[#ebe6dc] bg-white shadow-[0_14px_36px_rgba(15,23,42,0.032)]",
        className,
      )}
    >
      {children}
    </section>
  );
}

export function DashboardSectionTitle({
  icon: Icon,
  title,
  trailing,
}: {
  icon?: LucideIcon;
  title: string;
  trailing?: ReactNode;
}) {
  return (
    <div className="mb-4 flex items-center justify-between gap-3">
      <div className="flex items-center gap-2.5">
        {Icon && <Icon className="h-4.5 w-4.5 text-[#8a97b2]" strokeWidth={1.8} />}
        <h2 className="font-serif text-[18px] font-semibold leading-none tracking-[-0.03em] text-[#132b5b]">
          {title}
        </h2>
      </div>
      {trailing}
    </div>
  );
}

function DashboardOverviewRail({
  overviewItems,
  compactRail = false,
}: Pick<DashboardShellProps, "overviewItems" | "compactRail">) {
  const [isStatsOpen, setIsStatsOpen] = useState(true);
  const todayLabel = new Intl.DateTimeFormat("ru-RU", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date());

  return (
    <aside
      className={cn(
        "relative self-start shrink-0 transition-[width] duration-300 ease-out xl:sticky xl:top-5",
        isStatsOpen ? (compactRail ? "w-full xl:w-[262px]" : "w-full xl:w-[300px]") : "w-0",
      )}
    >
      <div
        className={cn(
          "transition-all duration-300 ease-out",
          isStatsOpen ? "translate-x-0 opacity-100" : "translate-x-full opacity-0 pointer-events-none",
        )}
      >
        <DashboardPanel className={cn(compactRail ? "p-3.5" : "p-4")}>
          <div className={cn("flex items-start justify-between gap-3", compactRail ? "mb-3" : "mb-4")}>
            <div>
              <h3 className={cn(
                "font-serif font-semibold tracking-[-0.03em] text-[#132b5b]",
                compactRail ? "text-[16px]" : "text-[18px]",
              )}>
                Недавняя активность
              </h3>
              <p className={cn("text-[#7b89a5]", compactRail ? "mt-1 text-[11px]" : "mt-1.5 text-[12px]")}>
                Дневная статистика за {todayLabel}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsStatsOpen(false)}
              className={cn(
                "grid place-items-center rounded-full text-[#8a97b2] transition hover:bg-[#f5f7fb] hover:text-[#132b5b]",
                compactRail ? "h-7 w-7" : "h-8 w-8",
              )}
              aria-label="Свернуть дневную статистику"
            >
              <ChevronRight className="h-4 w-4" strokeWidth={1.9} />
            </button>
          </div>

          <div className={cn(compactRail ? "space-y-2" : "space-y-2.5")}>
            {overviewItems.map((item) => (
              <div
                key={item.label}
                className={cn(
                  "rounded-[16px] border border-[#ece7dd] bg-[#fcfbf8]",
                  compactRail ? "px-3 py-2.5" : "px-3.5 py-3",
                )}
              >
                <p className={cn("text-[#7b89a5]", compactRail ? "text-[11px]" : "text-[12px]")}>{item.label}</p>
                <p className={cn(
                  "font-semibold",
                  compactRail ? "mt-1 text-[15px]" : "mt-1.5 text-[16px]",
                  toneClasses[item.tone || "slate"],
                )}>
                  {item.value}
                </p>
              </div>
            ))}
          </div>
        </DashboardPanel>
      </div>

      <button
        type="button"
        onClick={() => setIsStatsOpen(true)}
        className={cn(
          "absolute right-0 z-10 flex items-center rounded-l-[18px] border border-[#e6dfd3] bg-white font-semibold text-[#415276] shadow-[0_14px_28px_rgba(15,23,42,0.06)] transition-all duration-300 hover:border-[#d8e2fb] hover:text-[#175cdf]",
          compactRail ? "top-5 gap-1.5 px-2.5 py-1.5 text-[11px]" : "top-6 gap-2 px-3 py-2 text-[12px]",
          isStatsOpen ? "pointer-events-none translate-x-3 opacity-0" : "translate-x-0 opacity-100",
        )}
        aria-label="Открыть дневную статистику"
      >
        <ChevronLeft className="h-4 w-4" strokeWidth={1.9} />
        <span>Статистика</span>
      </button>
    </aside>
  );
}

export function DashboardEmptyHero({
  illustration,
  title,
  description,
  actions,
  className,
  compact = false,
}: {
  illustration: ReactNode;
  title: string;
  description: ReactNode;
  actions?: ReactNode;
  className?: string;
  compact?: boolean;
}) {
  return (
    <DashboardPanel
      className={cn(
        "flex items-center justify-center text-center",
        compact ? "min-h-[280px] px-5 py-7" : "min-h-[340px] px-6 py-8",
        className,
      )}
    >
      <div className={cn("mx-auto", compact ? "max-w-[390px]" : "max-w-[460px]")}>
        <div className="mx-auto flex justify-center">{illustration}</div>
        <h2 className={cn(
          "font-serif font-semibold tracking-[-0.03em] text-[#132b5b]",
          compact ? "mt-3.5 text-[22px] sm:text-[24px]" : "mt-5 text-[26px] sm:text-[30px]",
        )}>
          {title}
        </h2>
        <div className={cn(
          "mx-auto text-[#6f7f9d]",
          compact ? "mt-2.5 max-w-[340px] text-[13px] leading-6" : "mt-3 max-w-[420px] text-[14px] leading-6",
        )}>
          {description}
        </div>
        {actions && <div className={cn("flex flex-wrap items-center justify-center gap-2.5", compact ? "mt-5" : "mt-6")}>{actions}</div>}
      </div>
    </DashboardPanel>
  );
}

export default function DashboardShell({
  title,
  description,
  searchValue,
  onSearchChange,
  searchPlaceholder,
  toolbar,
  overviewItems,
  compactHeader = false,
  compactRail = false,
  children,
}: DashboardShellProps) {
  return (
    <div className="flex h-full min-h-0 flex-col bg-[#fbfaf7] text-[#10244d]">
      <DashboardTopbar
        searchValue={searchValue}
        onSearchChange={onSearchChange}
        searchPlaceholder={searchPlaceholder}
      />

      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className={cn(
          "mx-auto flex max-w-[1320px] flex-col px-4 sm:px-6 lg:px-8 xl:flex-row xl:items-start",
          compactHeader ? "gap-5 py-4" : "gap-6 py-5",
        )}>
          <div className={cn("min-w-0 flex-1", compactHeader ? "space-y-4" : "space-y-5")}>
            <header className={cn(compactHeader ? "space-y-1.5" : "space-y-2")}>
              <h1 className={cn(
                "font-serif font-semibold tracking-[-0.05em] text-[#132b5b]",
                compactHeader
                  ? "text-[26px] leading-[0.95] sm:text-[30px] lg:text-[34px]"
                  : "text-[34px] leading-none sm:text-[40px] lg:text-[48px]",
              )}>
                {title}
              </h1>
              <p className={cn(
                "text-[#7282a0]",
                compactHeader
                  ? "max-w-[560px] text-[13px] leading-5 sm:text-[14px]"
                  : "max-w-[680px] text-[14px] leading-6 sm:text-[15px]",
              )}>
                {description}
              </p>
            </header>

            {toolbar}
            {children}
          </div>

          <DashboardOverviewRail
            overviewItems={overviewItems}
            compactRail={compactRail}
          />
        </div>
      </div>
    </div>
  );
}
