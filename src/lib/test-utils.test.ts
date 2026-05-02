import { describe, expect, it } from "vitest";
import { groupQuestionsByTopic, normalizeUserTest, parseGeneratedTestsResponse, selectLatestTestsBySubject } from "@/lib/test-utils";
import type { Tables } from "@/integrations/supabase/types";

const firstUserTestRow: Tables<"user_tests"> = {
  id: "test-1",
  device_id: "device-1",
  subject_id: "math",
  title: "Алгебра",
  lesson_number: 1,
  questions: [
    {
      id: "q-2",
      question: "Что такое дискриминант?",
      type: "text",
      correct_answer: "b² - 4ac",
      hint: "Подумай про формулу корней",
      topic: "Формулы",
      question_index: 1,
    },
    {
      id: "q-1",
      question: "Что такое коэффициент a?",
      type: "text",
      correct_answer: "Число перед x²",
      hint: "Смотри на старший коэффициент",
      topic: "Формулы",
      question_index: 0,
    },
  ],
  results: {
    "q-1": { answer: "Число перед x²", correct: true, attempts: 1 },
  },
  completed: false,
  score: 50,
  created_at: "2026-05-01T10:00:00.000Z",
};

const secondUserTestRow: Tables<"user_tests"> = {
  ...firstUserTestRow,
  id: "test-2",
  title: "Алгебра 2",
  created_at: "2026-05-02T10:00:00.000Z",
};

describe("test-utils", () => {
  it("normalizes user tests and keeps latest test by subject", () => {
    const latest = selectLatestTestsBySubject([
      normalizeUserTest(firstUserTestRow),
      normalizeUserTest(secondUserTestRow),
    ]);

    expect(latest).toHaveLength(1);
    expect(latest[0].id).toBe("test-2");
    expect(latest[0].results?.["q-1"]?.attempts).toBe(1);
  });

  it("groups questions by topic and preserves question order inside section", () => {
    const sections = groupQuestionsByTopic(normalizeUserTest(firstUserTestRow).questions);

    expect(sections).toHaveLength(1);
    expect(sections[0].topic).toBe("Формулы");
    expect(sections[0].questions.map((question) => question.id)).toEqual(["q-1", "q-2"]);
  });

  it("parses generated tests response and derives question count when needed", () => {
    const response = parseGeneratedTestsResponse({
      test_title: "Тест по алгебре",
      sections: [
        {
          topic: "Формулы",
          questions: firstUserTestRow.questions,
        },
      ],
    });

    expect(response.test_title).toBe("Тест по алгебре");
    expect(response.question_count).toBe(2);
    expect(response.sections[0].questions[0].id).toBe("q-2");
  });
});
