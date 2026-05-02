import { describe, expect, it } from "vitest";
import { buildSubjectStats, buildTopicSummaries, getGradeLabel, getStudyTimeLabel } from "@/lib/progress-utils";
import type { ProgressRecord, Subject } from "@/types/tutor";

const records: ProgressRecord[] = [
  {
    id: "1",
    subject_id: "math",
    topic: "Дискриминант",
    score: 100,
    total_questions: 2,
    correct_answers: 2,
    created_at: "2026-05-02T09:00:00.000Z",
  },
  {
    id: "2",
    subject_id: "math",
    topic: "Дискриминант",
    score: 0,
    total_questions: 1,
    correct_answers: 0,
    created_at: "2026-05-03T09:00:00.000Z",
  },
];

const subjects: Subject[] = [
  {
    id: "math",
    name: "Математика",
    icon: "📐",
    color: "234 89% 74%",
    description: "Алгебра и геометрия",
  },
];

describe("progress-utils", () => {
  it("aggregates topic summaries and marks skipped topics", () => {
    const summaries = buildTopicSummaries(records);

    expect(summaries).toHaveLength(1);
    expect(summaries[0].topic).toBe("Дискриминант");
    expect(summaries[0].totalQuestions).toBe(3);
    expect(summaries[0].correctAnswers).toBe(2);
    expect(summaries[0].hasSkipped).toBe(true);
  });

  it("builds subject stats and returns grade/time labels", () => {
    const summaries = buildTopicSummaries(records);
    const stats = buildSubjectStats(subjects, summaries);
    const studyLabel = getStudyTimeLabel("2026-05-02T09:00:00.000Z", new Date("2026-05-03T10:00:00.000Z"));

    expect(stats[0].avgScore).toBe(67);
    expect(stats[0].skippedTopics).toBe(0);
    expect(getGradeLabel(stats[0].avgScore).text).toBe("Удовл.");
    expect(studyLabel.timeLabel).toBe("Вчера");
  });
});
