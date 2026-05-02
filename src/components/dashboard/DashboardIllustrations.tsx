import type { ReactNode } from "react";
import {
  BarChart3,
  BookOpen,
  CalendarDays,
  Camera,
  ClipboardList,
  Clock3,
  FileText,
  FolderOpen,
  GraduationCap,
  PencilLine,
  Sparkles,
  Sprout,
  Star,
  UserRound,
} from "lucide-react";
import { cn } from "@/lib/utils";

function GlassBadge({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={cn(
        "absolute flex items-center justify-center rounded-[22px] border border-[#dfe7f4] bg-[linear-gradient(180deg,#ffffff_0%,#f7f9fd_100%)] text-[#94a4c2] shadow-[0_20px_40px_rgba(15,23,42,0.08)]",
        className,
      )}
    >
      {children}
    </div>
  );
}

function FloorShadow() {
  return <div className="absolute bottom-6 left-1/2 h-4 w-44 -translate-x-1/2 rounded-full bg-[#edf1f7]" />;
}

export function SubjectsHeroIllustration() {
  return (
    <div className="relative h-[190px] w-[280px]">
      <FloorShadow />
      <GlassBadge className="bottom-12 left-[62px] h-[78px] w-[92px] rotate-[-8deg]">
        <BookOpen className="h-10 w-10" strokeWidth={1.6} />
      </GlassBadge>
      <GlassBadge className="bottom-12 left-[118px] h-[92px] w-[108px]">
        <div className="relative">
          <GraduationCap className="h-11 w-11" strokeWidth={1.6} />
          <Sparkles className="absolute -right-7 -top-4 h-4 w-4 text-[#e0c07b]" strokeWidth={1.7} />
        </div>
      </GlassBadge>
      <GlassBadge className="bottom-14 right-[32px] h-[66px] w-[58px] rotate-[6deg]">
        <PencilLine className="h-8 w-8" strokeWidth={1.6} />
      </GlassBadge>
      <div className="absolute left-10 top-[52px] text-[#e0c07b]">
        <Sparkles className="h-4 w-4" strokeWidth={1.7} />
      </div>
      <div className="absolute right-10 top-[34px] text-[#e0c07b]">
        <Sparkles className="h-3.5 w-3.5" strokeWidth={1.7} />
      </div>
    </div>
  );
}

export function TestsHeroIllustration() {
  return (
    <div className="relative h-[190px] w-[280px]">
      <FloorShadow />
      <GlassBadge className="bottom-11 left-[78px] h-[106px] w-[90px] rotate-[-6deg]">
        <ClipboardList className="h-11 w-11" strokeWidth={1.6} />
      </GlassBadge>
      <GlassBadge className="bottom-11 left-[162px] h-[76px] w-[72px] rotate-[8deg]">
        <BookOpen className="h-9 w-9" strokeWidth={1.6} />
      </GlassBadge>
      <div className="absolute left-12 top-[88px] text-[#a8b5ce]">
        <Sprout className="h-9 w-9" strokeWidth={1.5} />
      </div>
      <div className="absolute left-8 top-[56px] text-[#e0c07b]">
        <Sparkles className="h-4 w-4" strokeWidth={1.7} />
      </div>
      <div className="absolute right-12 top-[50px] text-[#e0c07b]">
        <Sparkles className="h-4 w-4" strokeWidth={1.7} />
      </div>
    </div>
  );
}

export function MaterialsHeroIllustration() {
  return (
    <div className="relative h-[190px] w-[280px]">
      <FloorShadow />
      <div className="absolute left-[42px] top-[98px] text-[#a8b5ce]">
        <Sprout className="h-9 w-9" strokeWidth={1.5} />
      </div>
      <GlassBadge className="bottom-12 left-[92px] h-[92px] w-[112px]">
        <FolderOpen className="h-12 w-12" strokeWidth={1.6} />
      </GlassBadge>
      <GlassBadge className="bottom-[102px] left-[148px] h-[54px] w-[58px] rotate-[4deg]">
        <FileText className="h-7 w-7" strokeWidth={1.6} />
      </GlassBadge>
      <div className="absolute left-[52px] top-[46px] text-[#e0c07b]">
        <Sparkles className="h-3.5 w-3.5" strokeWidth={1.7} />
      </div>
      <div className="absolute right-[48px] top-[58px] text-[#e0c07b]">
        <Sparkles className="h-4 w-4" strokeWidth={1.7} />
      </div>
    </div>
  );
}

export function ProfileAvatarIllustration() {
  return (
    <div className="relative">
      <div className="grid h-28 w-28 place-items-center rounded-full bg-[radial-gradient(circle_at_30%_30%,#f7f9fd_0%,#edf2fb_70%)] text-[#96a6c3] shadow-[inset_0_0_0_1px_rgba(220,228,241,0.9)]">
        <UserRound className="h-12 w-12" strokeWidth={1.7} />
      </div>
      <div className="absolute bottom-1 right-0 grid h-10 w-10 place-items-center rounded-full border border-[#dfe6f3] bg-white text-[#8fa1c0] shadow-[0_12px_24px_rgba(15,23,42,0.08)]">
        <Camera className="h-4.5 w-4.5" strokeWidth={1.8} />
      </div>
    </div>
  );
}

export function MetricEmptyIllustration({
  icon = BarChart3,
  badge,
}: {
  icon?: typeof BarChart3;
  badge?: string;
}) {
  const Icon = icon;

  return (
    <div className="relative mx-auto h-28 w-28">
      <div className="absolute inset-0 rounded-full border border-[#dce4f1] bg-[linear-gradient(180deg,#ffffff_0%,#f7f9fd_100%)] shadow-[0_18px_36px_rgba(15,23,42,0.06)]" />
      <div className="absolute inset-4 grid place-items-center rounded-full border border-[#e8edf7] text-[#92a3c0]">
        <Icon className="h-8 w-8" strokeWidth={1.6} />
      </div>
      {badge && (
        <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 text-center text-[15px] font-semibold text-[#55688d]">
          {badge}
        </div>
      )}
    </div>
  );
}

export function RecentActivityIllustration() {
  return (
    <div className="grid h-16 w-16 place-items-center rounded-full border border-[#dde5f3] bg-[#f7f9fd] text-[#8a97b2] shadow-[inset_0_0_0_8px_rgba(255,255,255,0.95)]">
      <Clock3 className="h-7 w-7" strokeWidth={1.7} />
    </div>
  );
}

export function MiniDocumentIllustration() {
  return (
    <div className="grid h-14 w-14 place-items-center rounded-[18px] border border-[#e6ebf5] bg-[#fbfcff] text-[#b2bfd4]">
      <FileText className="h-7 w-7" strokeWidth={1.6} />
    </div>
  );
}

export function ActivityIllustration() {
  return <MetricEmptyIllustration icon={CalendarDays} />;
}

export function ScoreIllustration() {
  return <MetricEmptyIllustration icon={Star} />;
}
