import { useState, useEffect } from "react";
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
    <div className="flex h-full flex-col p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Профиль</h1>
        <p className="mt-1 text-sm text-muted-foreground">Информация о себе</p>
      </div>

      <div className="max-w-lg space-y-4">
        <div className="flex items-center gap-4 rounded-2xl border border-border bg-card p-5 shadow-lg">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/20">
            <User className="h-8 w-8 text-primary" />
          </div>
          <div>
            <p className="text-lg font-semibold text-card-foreground">{profile.name || "Ученик"}</p>
            <p className="text-sm text-muted-foreground">{profile.grade ? `${profile.grade} класс` : "Класс не указан"}</p>
          </div>
        </div>

        <div className="space-y-3 rounded-2xl border border-border bg-card p-5 shadow-lg">
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Имя</label>
            <input
              value={profile.name}
              onChange={(e) => setProfile((p) => ({ ...p, name: e.target.value }))}
              placeholder="Как тебя зовут?"
              className="w-full rounded-xl border border-border bg-secondary px-3 py-2.5 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:ring-1 focus:ring-ring"
            />
          </div>
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Возраст</label>
              <input
                value={profile.age}
                onChange={(e) => setProfile((p) => ({ ...p, age: e.target.value }))}
                placeholder="14"
                className="w-full rounded-xl border border-border bg-secondary px-3 py-2.5 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:ring-1 focus:ring-ring"
              />
            </div>
            <div className="flex-1">
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Класс</label>
              <input
                value={profile.grade}
                onChange={(e) => setProfile((p) => ({ ...p, grade: e.target.value }))}
                placeholder="8"
                className="w-full rounded-xl border border-border bg-secondary px-3 py-2.5 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:ring-1 focus:ring-ring"
              />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">О себе</label>
            <textarea
              value={profile.bio}
              onChange={(e) => setProfile((p) => ({ ...p, bio: e.target.value }))}
              placeholder="Что ты любишь изучать, твои цели…"
              rows={3}
              className="w-full resize-none rounded-xl border border-border bg-secondary px-3 py-2.5 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:ring-1 focus:ring-ring"
            />
          </div>
          <button
            onClick={handleSave}
            className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition hover:opacity-90"
          >
            {saved ? <CheckCircle2 className="h-4 w-4" /> : <Save className="h-4 w-4" />}
            {saved ? "Сохранено!" : "Сохранить"}
          </button>
        </div>
      </div>
    </div>
  );
}
