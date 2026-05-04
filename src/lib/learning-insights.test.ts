import { describe, expect, it } from "vitest";
import {
  buildDailyMissions,
  buildMistakeNotebook,
  buildSubjectLearningSnapshots,
  buildWeakTopicInsights,
} from "@/lib/learning-insights";
import type { ProgressRecord, Subject, UserTest } from "@/types/tutor";

const subjects: Subject[] = [
  {
    id: "math",
    name: "Математика",
    icon: "📐",
    color: "234 89% 74%",
    description: "Формулы и задачи",
  },
];

const records: ProgressRecord[] = [
  {
    id: "progress-1",
    subject_id: "math",
    topic: "Квадратные уравнения",
    score: 100,
    total_questions: 4,
    correct_answers: 4,
    device_id: "device-1",
    studied_at: "2026-05-03T10:00:00.000Z",
    created_at: "2026-05-03T10:00:00.000Z",
  },
];

const tests: UserTest[] = [
  {
    id: "test-1",
    device_id: "device-1",
    subject_id: "math",
    title: "Тренировка по алгебре",
    lesson_number: 1,
    questions: [
      {
        id: "q-1",
        question: "Чему равен дискриминант?",
        type: "text",
        correct_answer: "b² - 4ac",
        hint: "Подумай про формулу корней",
        topic: "Квадратные уравнения",
        question_index: 0,
      },
      {
        id: "q-2",
        question: "Что делает коэффициент a?",
        type: "text",
        correct_answer: "Стоит перед x²",
        hint: "Смотри на старший коэффициент",
        topic: "Квадратные уравнения",
        question_index: 1,
      },
    ],
    results: {
      "q-1": {
        answer: "b² + 4ac",
        correct: false,
        attempts: 2,
      },
      "q-2": {
        answer: "Стоит перед x²",
        correct: true,
        attempts: 2,
      },
    },
    completed: false,
    score: 50,
    created_at: "2026-05-04T08:30:00.000Z",
  },
];

describe("learning-insights", () => {
  it("builds a mistake notebook from unresolved and corrected difficult answers", () => {
    const notebook = buildMistakeNotebook(tests, subjects);

    expect(notebook).toHaveLength(2);
    expect(notebook[0].corrected).toBe(false);
    expect(notebook[0].question).toContain("дискриминант");
    expect(notebook[1].corrected).toBe(true);
  });

  it("downgrades weak topics when unresolved mistakes remain", () => {
    const weakTopics = buildWeakTopicInsights(records, tests, subjects);

    expect(weakTopics).toHaveLength(1);
    expect(weakTopics[0].confidence).toBe("weak");
    expect(weakTopics[0].mistakeCount).toBeGreaterThan(0);
    expect(weakTopics[0].score).toBeLessThan(80);
  });

  it("creates daily missions and subject snapshots from tutor signals", () => {
    const notebook = buildMistakeNotebook(tests, subjects);
    const weakTopics = buildWeakTopicInsights(records, tests, subjects);
    const missions = buildDailyMissions(subjects, weakTopics, notebook, tests);
    const snapshots = buildSubjectLearningSnapshots(subjects, records, tests, weakTopics);

    expect(missions).toHaveLength(3);
    expect(missions[0].kind).toBe("mistake-review");
    expect(missions[1].kind).toBe("finish-test");
    expect(missions[2].kind).toBe("weak-topic");
    expect(snapshots[0].weakTopicsCount).toBe(1);
    expect(snapshots[0].testsCount).toBe(1);
  });
});
