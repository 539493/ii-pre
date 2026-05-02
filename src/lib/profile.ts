import type { Profile } from "@/types/tutor";

export const PROFILE_KEY = "ai-tutor-profile";
export const EMPTY_PROFILE: Profile = { name: "", age: "", grade: "", bio: "" };

function isProfile(value: unknown): value is Profile {
  if (!value || typeof value !== "object") return false;

  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.name === "string" &&
    typeof candidate.age === "string" &&
    typeof candidate.grade === "string" &&
    typeof candidate.bio === "string"
  );
}

export function parseProfile(raw: string | null): Profile {
  try {
    const parsed: unknown = raw ? JSON.parse(raw) : EMPTY_PROFILE;
    return isProfile(parsed) ? parsed : EMPTY_PROFILE;
  } catch {
    return EMPTY_PROFILE;
  }
}
