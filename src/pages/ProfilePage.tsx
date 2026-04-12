import { useState } from "react";
import { User, Save, CheckCircle2 } from "lucide-react";

type Profile = {
  name: string;
  age: string;
  grade: string;
  bio: string;
};

const PROFILE_KEY = "ai-tutor-profile";

function loadProfile(): Profile {
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    return raw ? JSON.parse(raw) : { name: "", age: "", grade: "", bio: "" };
  } catch {
    return { name: "", age: "", grade: "", bio: "" };
  }
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile>(loadProfile);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="page-shell">
      <section className="page-hero mb-6">
        <p className="page-kicker">Профиль ученика</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-foreground">Личные настройки обучения</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
          Заполни базовую информацию о себе, чтобы интерфейс ощущался как персональный рабочий кабинет.
        </p>
      </section>

      <div className="max-w-2xl space-y-5">
        <div className="panel-surface flex items-center gap-4 p-5">
          <div className="flex h-16 w-16 items-center justify-center rounded-[24px] bg-primary/10">
            <User className="h-8 w-8 text-primary" />
          </div>
          <div>
            <p className="text-lg font-semibold text-card-foreground">{profile.name || "Ученик"}</p>
            <p className="text-sm text-muted-foreground">{profile.grade ? `${profile.grade} класс` : "Класс не указан"}</p>
          </div>
        </div>

        <div className="panel-surface space-y-4 p-5">
          <div>
            <label className="mb-2 block text-xs font-medium uppercase tracking-[0.24em] text-muted-foreground">Имя</label>
            <input
              value={profile.name}
              onChange={(e) => setProfile((p) => ({ ...p, name: e.target.value }))}
              placeholder="Как тебя зовут?"
              className="w-full rounded-2xl border border-border bg-secondary/70 px-4 py-3 text-sm text-foreground outline-none transition focus:border-primary/40 focus:ring-2 focus:ring-primary/10"
            />
          </div>
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="mb-2 block text-xs font-medium uppercase tracking-[0.24em] text-muted-foreground">Возраст</label>
              <input
                value={profile.age}
                onChange={(e) => setProfile((p) => ({ ...p, age: e.target.value }))}
                placeholder="14"
                className="w-full rounded-2xl border border-border bg-secondary/70 px-4 py-3 text-sm text-foreground outline-none transition focus:border-primary/40 focus:ring-2 focus:ring-primary/10"
              />
            </div>
            <div className="flex-1">
              <label className="mb-2 block text-xs font-medium uppercase tracking-[0.24em] text-muted-foreground">Класс</label>
              <input
                value={profile.grade}
                onChange={(e) => setProfile((p) => ({ ...p, grade: e.target.value }))}
                placeholder="8"
                className="w-full rounded-2xl border border-border bg-secondary/70 px-4 py-3 text-sm text-foreground outline-none transition focus:border-primary/40 focus:ring-2 focus:ring-primary/10"
              />
            </div>
          </div>
          <div>
            <label className="mb-2 block text-xs font-medium uppercase tracking-[0.24em] text-muted-foreground">О себе</label>
            <textarea
              value={profile.bio}
              onChange={(e) => setProfile((p) => ({ ...p, bio: e.target.value }))}
              placeholder="Что ты любишь изучать, твои цели…"
              rows={3}
              className="w-full resize-none rounded-2xl border border-border bg-secondary/70 px-4 py-3 text-sm text-foreground outline-none transition focus:border-primary/40 focus:ring-2 focus:ring-primary/10"
            />
          </div>
          <button
            onClick={handleSave}
            className="flex items-center gap-2 rounded-2xl bg-primary px-5 py-3 text-sm font-medium text-primary-foreground transition hover:opacity-90"
          >
            {saved ? <CheckCircle2 className="h-4 w-4" /> : <Save className="h-4 w-4" />}
            {saved ? "Сохранено!" : "Сохранить"}
          </button>
        </div>
      </div>
    </div>
  );
}
