import { describe, expect, it } from "vitest";
import { EMPTY_PROFILE, parseProfile } from "@/lib/profile";

describe("profile", () => {
  it("returns fallback profile for invalid persisted data", () => {
    expect(parseProfile("{bad json")).toEqual(EMPTY_PROFILE);
    expect(parseProfile("123")).toEqual(EMPTY_PROFILE);
  });

  it("restores profile data and merges new optional fields", () => {
    expect(parseProfile(JSON.stringify({
      name: "Alex",
      age: "14",
      grade: "8",
      bio: "Люблю математику",
      educationLevel: "Школа",
      studyGoal: "Подтянуть алгебру",
      interests: ["Математика", "Физика"],
      notificationsEnabled: true,
      memberSince: "2026-05-01T00:00:00.000Z",
    }))).toEqual({
      name: "Alex",
      age: "14",
      grade: "8",
      bio: "Люблю математику",
      educationLevel: "Школа",
      studyGoal: "Подтянуть алгебру",
      interests: ["Математика", "Физика"],
      notificationsEnabled: true,
      memberSince: "2026-05-01T00:00:00.000Z",
    });
  });

  it("keeps legacy profile fields even if new fields are absent", () => {
    expect(parseProfile(JSON.stringify({
      name: "Alex",
      age: "14",
      grade: "8",
      bio: "Люблю математику",
    }))).toEqual({
      name: "Alex",
      age: "14",
      grade: "8",
      bio: "Люблю математику",
      educationLevel: "",
      studyGoal: "",
      interests: [],
      notificationsEnabled: false,
      memberSince: "",
    });
  });
});
