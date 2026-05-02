import type { Profile } from "@/types/tutor";

export const PROFILE_KEY = "ai-tutor-profile";
export const EMPTY_PROFILE: Profile = {
  name: "",
  age: "",
  grade: "",
  bio: "",
  educationLevel: "",
  studyGoal: "",
  interests: [],
  notificationsEnabled: false,
  memberSince: "",
};

function getStringValue(value: unknown) {
  return typeof value === "string" ? value : "";
}

function getInterests(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

export function parseProfile(raw: string | null): Profile {
  try {
    const parsed: unknown = raw ? JSON.parse(raw) : {};
    if (!parsed || typeof parsed !== "object") return EMPTY_PROFILE;

    const candidate = parsed as Record<string, unknown>;

    return {
      name: getStringValue(candidate.name),
      age: getStringValue(candidate.age),
      grade: getStringValue(candidate.grade),
      bio: getStringValue(candidate.bio),
      educationLevel: getStringValue(candidate.educationLevel),
      studyGoal: getStringValue(candidate.studyGoal),
      interests: getInterests(candidate.interests),
      notificationsEnabled: candidate.notificationsEnabled === true,
      memberSince: getStringValue(candidate.memberSince),
    };
  } catch {
    return EMPTY_PROFILE;
  }
}
