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
        "absolute flex items-center justify-center rounded-[18px] border border-[#dfe7f4] bg-[linear-gradient(180deg,#ffffff_0%,#f7f9fd_100%)] text-[#94a4c2] shadow-[0_16px_30px_rgba(15,23,42,0.07)]",
        className,
      )}
    >
      {children}
    </div>
  );
}

function FloorShadow() {
  return <div className="absolute bottom-5 left-1/2 h-3 w-36 -translate-x-1/2 rounded-full bg-[#edf1f7]" />;
}

export function SubjectsHeroIllustration() {
  return (
    <div className="relative h-[156px] w-[236px]">
      <FloorShadow />
      <GlassBadge className="bottom-10 left-[52px] h-[64px] w-[76px] rotate-[-8deg]">
        <BookOpen className="h-8 w-8" strokeWidth={1.6} />
      </GlassBadge>
      <GlassBadge className="bottom-10 left-[100px] h-[76px] w-[90px]">
        <div className="relative">
          <GraduationCap className="h-9 w-9" strokeWidth={1.6} />
          <Sparkles className="absolute -right-6 -top-3 h-3.5 w-3.5 text-[#e0c07b]" strokeWidth={1.7} />
        </div>
      </GlassBadge>
      <GlassBadge className="bottom-11 right-[26px] h-[54px] w-[48px] rotate-[6deg]">
        <PencilLine className="h-6.5 w-6.5" strokeWidth={1.6} />
      </GlassBadge>
      <div className="absolute left-8 top-[44px] text-[#e0c07b]">
        <Sparkles className="h-3.5 w-3.5" strokeWidth={1.7} />
      </div>
      <div className="absolute right-8 top-[28px] text-[#e0c07b]">
        <Sparkles className="h-3 w-3" strokeWidth={1.7} />
      </div>
    </div>
  );
}

export function TestsHeroIllustration() {
  return (
    <div className="relative h-[156px] w-[236px]">
      <FloorShadow />
      <GlassBadge className="bottom-9 left-[66px] h-[88px] w-[74px] rotate-[-6deg]">
        <ClipboardList className="h-9 w-9" strokeWidth={1.6} />
      </GlassBadge>
      <GlassBadge className="bottom-9 left-[138px] h-[62px] w-[58px] rotate-[8deg]">
        <BookOpen className="h-7.5 w-7.5" strokeWidth={1.6} />
      </GlassBadge>
      <div className="absolute left-10 top-[74px] text-[#a8b5ce]">
        <Sprout className="h-7.5 w-7.5" strokeWidth={1.5} />
      </div>
      <div className="absolute left-7 top-[46px] text-[#e0c07b]">
        <Sparkles className="h-3.5 w-3.5" strokeWidth={1.7} />
      </div>
      <div className="absolute right-10 top-[42px] text-[#e0c07b]">
        <Sparkles className="h-3.5 w-3.5" strokeWidth={1.7} />
      </div>
    </div>
  );
}

export function MaterialsHeroIllustration() {
  return (
    <div className="relative h-[156px] w-[236px]">
      <FloorShadow />
      <div className="absolute left-[36px] top-[82px] text-[#a8b5ce]">
        <Sprout className="h-7.5 w-7.5" strokeWidth={1.5} />
      </div>
      <GlassBadge className="bottom-10 left-[78px] h-[76px] w-[92px]">
        <FolderOpen className="h-10 w-10" strokeWidth={1.6} />
      </GlassBadge>
      <GlassBadge className="bottom-[84px] left-[126px] h-[44px] w-[46px] rotate-[4deg]">
        <FileText className="h-5.5 w-5.5" strokeWidth={1.6} />
      </GlassBadge>
      <div className="absolute left-[44px] top-[38px] text-[#e0c07b]">
        <Sparkles className="h-3 w-3" strokeWidth={1.7} />
      </div>
      <div className="absolute right-[40px] top-[48px] text-[#e0c07b]">
        <Sparkles className="h-3.5 w-3.5" strokeWidth={1.7} />
      </div>
    </div>
  );
}

export function ProfileAvatarIllustration() {
  return (
    <div className="relative">
      <div className="grid h-24 w-24 place-items-center rounded-full bg-[radial-gradient(circle_at_30%_30%,#f7f9fd_0%,#edf2fb_70%)] text-[#96a6c3] shadow-[inset_0_0_0_1px_rgba(220,228,241,0.9)]">
        <UserRound className="h-10 w-10" strokeWidth={1.7} />
      </div>
      <div className="absolute bottom-1 right-0 grid h-8 w-8 place-items-center rounded-full border border-[#dfe6f3] bg-white text-[#8fa1c0] shadow-[0_12px_24px_rgba(15,23,42,0.08)]">
        <Camera className="h-4 w-4" strokeWidth={1.8} />
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
    <div className="relative mx-auto h-24 w-24">
      <div className="absolute inset-0 rounded-full border border-[#dce4f1] bg-[linear-gradient(180deg,#ffffff_0%,#f7f9fd_100%)] shadow-[0_18px_36px_rgba(15,23,42,0.06)]" />
      <div className="absolute inset-3.5 grid place-items-center rounded-full border border-[#e8edf7] text-[#92a3c0]">
        <Icon className="h-7 w-7" strokeWidth={1.6} />
      </div>
      {badge && (
        <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 text-center text-[13px] font-semibold text-[#55688d]">
          {badge}
        </div>
      )}
    </div>
  );
}

export function RecentActivityIllustration() {
  return (
    <div className="grid h-14 w-14 place-items-center rounded-full border border-[#dde5f3] bg-[#f7f9fd] text-[#8a97b2] shadow-[inset_0_0_0_8px_rgba(255,255,255,0.95)]">
      <Clock3 className="h-6 w-6" strokeWidth={1.7} />
    </div>
  );
}

export function MiniDocumentIllustration() {
  return (
    <div className="grid h-12 w-12 place-items-center rounded-[16px] border border-[#e6ebf5] bg-[#fbfcff] text-[#b2bfd4]">
      <FileText className="h-6 w-6" strokeWidth={1.6} />
    </div>
  );
}

export function ActivityIllustration() {
  return <MetricEmptyIllustration icon={CalendarDays} />;
}

export function ScoreIllustration() {
  return <MetricEmptyIllustration icon={Star} />;
}
