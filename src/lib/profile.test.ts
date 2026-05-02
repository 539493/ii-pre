import { describe, expect, it } from "vitest";
import { EMPTY_PROFILE, parseProfile } from "@/lib/profile";

describe("profile", () => {
  it("returns fallback profile for invalid persisted data", () => {
    expect(parseProfile("{bad json")).toEqual(EMPTY_PROFILE);
    expect(parseProfile(JSON.stringify({ name: "Alex" }))).toEqual(EMPTY_PROFILE);
  });

  it("restores valid persisted profile data", () => {
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
    });
  });
});
