import { useMemo, useState } from "react";
import { BookOpen, Import, PencilLine, Settings, Target, UserRound, Bell } from "lucide-react";
import { useNavigate } from "react-router-dom";
import DashboardShell, { DashboardPanel } from "@/components/dashboard/DashboardShell";
import { ProfileAvatarIllustration } from "@/components/dashboard/DashboardIllustrations";
import { parseProfile, PROFILE_KEY } from "@/lib/profile";
import { cn } from "@/lib/utils";
import type { Profile } from "@/types/tutor";

function formatMemberSince(value: string) {
  if (!value) return "—";

  return new Date(value).toLocaleDateString("ru-RU", {
    month: "long",
    year: "numeric",
  });
}

function getFilledCount(profile: Profile) {
  return [
    profile.name,
    profile.grade,
    profile.educationLevel,
    profile.bio,
    profile.studyGoal,
    profile.interests.length > 0 ? "yes" : "",
  ].filter(Boolean).length;
}

function DetailCell({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <p className="text-[12px] text-[#8a97b2]">{label}</p>
      <p className="mt-1.5 text-[16px] font-medium text-[#233a67]">{value || "—"}</p>
    </div>
  );
}

function ProfileOptionCard({
  icon: Icon,
  title,
  description,
  badge,
  action,
}: {
  icon: typeof UserRound;
  title: string;
  description: string;
  badge: string;
  action?: React.ReactNode;
}) {
  return (
    <DashboardPanel className="p-4">
      <div className="flex items-start gap-3">
        <div className="grid h-12 w-12 place-items-center rounded-full bg-[radial-gradient(circle_at_30%_30%,#f7f9fd_0%,#edf2fb_70%)] text-[#96a6c3]">
          <Icon className="h-5 w-5" strokeWidth={1.7} />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-serif text-[16px] font-semibold tracking-[-0.03em] text-[#132b5b]">
            {title}
          </h3>
          <p className="mt-1.5 text-[13px] leading-6 text-[#7282a0]">{description}</p>
          <div className="mt-4 flex items-center justify-between gap-3">
            <span className="rounded-full border border-[#ece6da] bg-[#fdfbf6] px-2.5 py-1 text-[11px] font-medium text-[#5d7095]">
              {badge}
            </span>
            {action}
          </div>
        </div>
      </div>
    </DashboardPanel>
  );
}

export default function ProfilePage() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile>(() => parseProfile(localStorage.getItem(PROFILE_KEY)));
  const [draft, setDraft] = useState<Profile>(profile);
  const [showEdit, setShowEdit] = useState(false);

  const filledCount = useMemo(() => getFilledCount(profile), [profile]);
  const profileReady = filledCount >= 4;

  const openModal = () => {
    setDraft(profile);
    setShowEdit(true);
  };

  const handleSave = () => {
    const normalized: Profile = {
      ...draft,
      name: draft.name.trim(),
      age: draft.age.trim(),
      grade: draft.grade.trim(),
      bio: draft.bio.trim(),
      educationLevel: draft.educationLevel.trim(),
      studyGoal: draft.studyGoal.trim(),
      interests: draft.interests.map((item) => item.trim()).filter(Boolean),
      memberSince: draft.memberSince || profile.memberSince || new Date().toISOString(),
    };

    localStorage.setItem(PROFILE_KEY, JSON.stringify(normalized));
    setProfile(normalized);
    setShowEdit(false);
  };

  const toggleNotifications = () => {
    const nextProfile = {
      ...profile,
      notificationsEnabled: !profile.notificationsEnabled,
      memberSince: profile.memberSince || new Date().toISOString(),
    };

    setProfile(nextProfile);
    setDraft(nextProfile);
    localStorage.setItem(PROFILE_KEY, JSON.stringify(nextProfile));
  };

  return (
    <DashboardShell
      title="Профиль"
      description="Управляйте своими личными настройками и учебными предпочтениями"
      overviewItems={[
        { label: "Всего", value: filledCount, tone: "blue" },
        { label: "Активно", value: profile.notificationsEnabled ? 1 : 0, tone: "blue" },
        { label: "Завершено", value: profileReady ? 1 : 0, tone: "amber" },
        { label: "Обновлено", value: formatMemberSince(profile.memberSince), tone: "slate" },
      ]}
      quickActions={[
        { label: "Добавить", icon: PencilLine, onClick: openModal },
        { label: "Импорт", icon: Import, onClick: () => navigate("/materials") },
        { label: "Настройки", icon: Settings, onClick: openModal },
      ]}
      recentActivity={profile.memberSince ? (
        <div className="rounded-[16px] border border-[#ece7dd] bg-[#fcfbf8] px-3.5 py-2.5">
          <p className="text-[13px] font-medium text-[#223761]">
            Профиль обновлён
          </p>
          <p className="mt-1 text-[11px] text-[#8a97b2]">{formatMemberSince(profile.memberSince)}</p>
        </div>
      ) : undefined}
    >
      <DashboardPanel className="p-4 sm:p-5">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex flex-col gap-4 sm:flex-row">
            <ProfileAvatarIllustration />

            <div className="min-w-0">
              <h2 className="font-serif text-[18px] font-semibold tracking-[-0.03em] text-[#132b5b]">
                {profileReady ? profile.name || "Профиль ученика" : "Профиль не заполнен"}
              </h2>
              <p className="mt-1.5 max-w-[460px] text-[13px] leading-6 text-[#7282a0]">
                {profileReady
                  ? profile.bio || "Здесь появится ваше краткое описание и учебные предпочтения."
                  : "Заполните информацию о себе, чтобы мы могли подбирать материалы и рекомендации персонально для вас."}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={openModal}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-[18px] border border-[#d7e2fb] bg-white px-4 text-[14px] font-medium text-[#2563eb] transition hover:bg-[#f6f9ff]"
          >
            <PencilLine className="h-4 w-4" strokeWidth={1.8} />
            Заполнить профиль
          </button>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
          <DetailCell label="Имя" value={profile.name} />
          <DetailCell label="Уровень образования" value={profile.educationLevel} />
          <DetailCell label="Класс / Курс" value={profile.grade} />
          <DetailCell label="Участник с" value={formatMemberSince(profile.memberSince)} />
        </div>
      </DashboardPanel>

      <div className="grid grid-cols-1 gap-3.5 lg:grid-cols-2">
        <ProfileOptionCard
          icon={UserRound}
          title="Настройки аккаунта"
          description="Управляйте личными данными, паролем и безопасностью."
          badge={profileReady ? "Настроено" : "Не настроено"}
        />
        <ProfileOptionCard
          icon={Target}
          title="Учебные цели"
          description="Определите цели и отслеживайте свой прогресс в обучении."
          badge={profile.studyGoal || "Цели не заданы"}
        />
        <ProfileOptionCard
          icon={BookOpen}
          title="Интересующие предметы"
          description="Выберите предметы, которые вам интересны."
          badge={profile.interests.length > 0 ? profile.interests.join(", ") : "Не выбрано"}
        />
        <DashboardPanel className="p-4">
          <div className="flex items-start gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-full bg-[radial-gradient(circle_at_30%_30%,#f7f9fd_0%,#edf2fb_70%)] text-[#96a6c3]">
              <Bell className="h-5 w-5" strokeWidth={1.7} />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-serif text-[16px] font-semibold tracking-[-0.03em] text-[#132b5b]">
                Настройки уведомлений
              </h3>
              <p className="mt-1.5 text-[13px] leading-6 text-[#7282a0]">
                Выберите, какие уведомления вы хотите получать.
              </p>

              <div className="mt-4 flex items-center justify-between gap-3 rounded-[16px] border border-[#ece7dd] bg-[#fcfbf8] px-3.5 py-2.5">
                <span className="text-[13px] font-medium text-[#233a67]">Email-уведомления</span>
                <button
                  type="button"
                  onClick={toggleNotifications}
                  className={cn(
                    "relative h-7 w-12 rounded-full transition",
                    profile.notificationsEnabled ? "bg-[#2563eb]" : "bg-[#e5eaf3]",
                  )}
                >
                  <span
                    className={cn(
                      "absolute top-1 h-5 w-5 rounded-full bg-white shadow-[0_8px_18px_rgba(15,23,42,0.15)] transition",
                      profile.notificationsEnabled ? "left-6" : "left-1",
                    )}
                  />
                </button>
              </div>
            </div>
          </div>
        </DashboardPanel>
      </div>

      {showEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#10244d]/25 px-4 backdrop-blur-md">
          <DashboardPanel className="w-full max-w-xl p-4 sm:p-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#9aa7bf]">
              Редактирование
            </p>
            <h2 className="mt-2.5 font-serif text-[24px] font-semibold tracking-[-0.04em] text-[#132b5b]">
              Заполнить профиль
            </h2>

            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <input
                value={draft.name}
                onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))}
                placeholder="Имя"
                className="rounded-[18px] border border-[#e7e1d8] bg-white px-4 py-2 text-[13px] text-[#223761] outline-none transition placeholder:text-[#8b99b4] focus:border-[#cedcff] focus:ring-4 focus:ring-[#2563eb]/8"
              />
              <input
                value={draft.educationLevel}
                onChange={(event) => setDraft((current) => ({ ...current, educationLevel: event.target.value }))}
                placeholder="Уровень образования"
                className="rounded-[18px] border border-[#e7e1d8] bg-white px-4 py-2 text-[13px] text-[#223761] outline-none transition placeholder:text-[#8b99b4] focus:border-[#cedcff] focus:ring-4 focus:ring-[#2563eb]/8"
              />
              <input
                value={draft.grade}
                onChange={(event) => setDraft((current) => ({ ...current, grade: event.target.value }))}
                placeholder="Класс / Курс"
                className="rounded-[18px] border border-[#e7e1d8] bg-white px-4 py-2 text-[13px] text-[#223761] outline-none transition placeholder:text-[#8b99b4] focus:border-[#cedcff] focus:ring-4 focus:ring-[#2563eb]/8"
              />
              <input
                value={draft.age}
                onChange={(event) => setDraft((current) => ({ ...current, age: event.target.value }))}
                placeholder="Возраст"
                className="rounded-[18px] border border-[#e7e1d8] bg-white px-4 py-2 text-[13px] text-[#223761] outline-none transition placeholder:text-[#8b99b4] focus:border-[#cedcff] focus:ring-4 focus:ring-[#2563eb]/8"
              />
            </div>

            <div className="mt-3 space-y-3">
              <textarea
                value={draft.bio}
                onChange={(event) => setDraft((current) => ({ ...current, bio: event.target.value }))}
                placeholder="Коротко о себе"
                rows={4}
                className="w-full rounded-[20px] border border-[#e7e1d8] bg-white px-4 py-3 text-[13px] leading-6 text-[#223761] outline-none transition placeholder:text-[#8b99b4] focus:border-[#cedcff] focus:ring-4 focus:ring-[#2563eb]/8"
              />
              <textarea
                value={draft.studyGoal}
                onChange={(event) => setDraft((current) => ({ ...current, studyGoal: event.target.value }))}
                placeholder="Учебные цели"
                rows={3}
                className="w-full rounded-[20px] border border-[#e7e1d8] bg-white px-4 py-3 text-[13px] leading-6 text-[#223761] outline-none transition placeholder:text-[#8b99b4] focus:border-[#cedcff] focus:ring-4 focus:ring-[#2563eb]/8"
              />
              <input
                value={draft.interests.join(", ")}
                onChange={(event) => setDraft((current) => ({
                  ...current,
                  interests: event.target.value.split(",").map((item) => item.trim()).filter(Boolean),
                }))}
                placeholder="Интересующие предметы через запятую"
                className="rounded-[18px] border border-[#e7e1d8] bg-white px-4 py-2 text-[13px] text-[#223761] outline-none transition placeholder:text-[#8b99b4] focus:border-[#cedcff] focus:ring-4 focus:ring-[#2563eb]/8"
              />
            </div>

            <div className="mt-4 flex flex-col gap-2.5 sm:flex-row">
              <button
                type="button"
                onClick={() => {
                  setDraft(profile);
                  setShowEdit(false);
                }}
                className="flex-1 rounded-[18px] border border-[#e6dfd0] bg-white px-4 py-2 text-[13px] font-medium text-[#667085] transition hover:bg-[#f8f5ee] hover:text-[#111827]"
              >
                Отмена
              </button>
              <button
                type="button"
                onClick={handleSave}
                className="flex-1 rounded-[18px] bg-[#175cdf] px-4 py-2 text-[13px] font-semibold text-white shadow-[0_18px_35px_rgba(23,92,223,0.22)] transition hover:bg-[#144fc1]"
              >
                Сохранить профиль
              </button>
            </div>
          </DashboardPanel>
        </div>
      )}
    </DashboardShell>
  );
}
