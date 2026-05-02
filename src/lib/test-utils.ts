import type { Json, Tables } from "@/integrations/supabase/types";
import type {
  GeneratedTestResponse,
  QuizCheckResponse,
  TestQuestion,
  TestResultItem,
  TestSection,
  UserTest,
} from "@/types/tutor";

export function isTestQuestion(value: unknown): value is TestQuestion {
  if (!value || typeof value !== "object") return false;

  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.id === "string" &&
    typeof candidate.question === "string" &&
    typeof candidate.type === "string" &&
    typeof candidate.correct_answer === "string" &&
    typeof candidate.hint === "string" &&
    (candidate.topic === undefined || typeof candidate.topic === "string") &&
    (candidate.section_index === undefined || typeof candidate.section_index === "number") &&
    (candidate.question_index === undefined || typeof candidate.question_index === "number")
  );
}

export function isTestResultItem(value: unknown): value is TestResultItem {
  if (!value || typeof value !== "object") return false;

  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.answer === "string" &&
    typeof candidate.correct === "boolean" &&
    typeof candidate.attempts === "number"
  );
}

export function parseTestQuestions(value: Json): TestQuestion[] {
  return Array.isArray(value) ? value.filter(isTestQuestion) : [];
}

export function parseTestResults(value: Json | null): Record<string, TestResultItem> | null {
  if (!value || Array.isArray(value) || typeof value !== "object") {
    return null;
  }

  const parsedResults: Record<string, TestResultItem> = {};
  for (const [questionId, result] of Object.entries(value)) {
    if (isTestResultItem(result)) {
      parsedResults[questionId] = result;
    }
  }

  return parsedResults;
}

export function normalizeUserTest(row: Tables<"user_tests">): UserTest {
  return {
    ...row,
    questions: parseTestQuestions(row.questions),
    results: parseTestResults(row.results),
    score: row.score ?? 0,
  };
}

export function selectLatestTestsBySubject(tests: UserTest[]) {
  const latestBySubject = new Map<string, UserTest>();

  for (const test of tests) {
    const existing = latestBySubject.get(test.subject_id);
    if (!existing || new Date(test.created_at).getTime() >= new Date(existing.created_at).getTime()) {
      latestBySubject.set(test.subject_id, test);
    }
  }

  return Array.from(latestBySubject.values());
}

export function groupQuestionsByTopic(questions: TestQuestion[]): TestSection[] {
  const sections = new Map<string, TestQuestion[]>();

  for (const question of questions) {
    const topic = question.topic || "Общий блок";
    if (!sections.has(topic)) {
      sections.set(topic, []);
    }
    sections.get(topic)?.push(question);
  }

  return Array.from(sections.entries()).map(([topic, items]) => ({
    topic,
    questions: [...items].sort((a, b) => (a.question_index ?? 0) - (b.question_index ?? 0)),
  }));
}

function parseTestSections(value: unknown): TestSection[] {
  if (!Array.isArray(value)) return [];

  return value.flatMap((section) => {
    if (!section || typeof section !== "object") return [];

    const candidate = section as Record<string, unknown>;
    if (typeof candidate.topic !== "string" || !Array.isArray(candidate.questions)) return [];

    return [{
      topic: candidate.topic,
      questions: candidate.questions.filter(isTestQuestion),
    }];
  });
}

export function parseGeneratedTestsResponse(value: unknown): GeneratedTestResponse {
  if (!value || typeof value !== "object") {
    throw new Error("AI returned an invalid generated tests response.");
  }

  const candidate = value as Record<string, unknown>;
  const sections = parseTestSections(candidate.sections);
  const questions = Array.isArray(candidate.questions) ? candidate.questions.filter(isTestQuestion) : [];
  const questionCount =
    typeof candidate.question_count === "number"
      ? candidate.question_count
      : sections.length > 0
        ? sections.reduce((total, section) => total + section.questions.length, 0)
        : questions.length;

  return {
    test_title: typeof candidate.test_title === "string" ? candidate.test_title : "Тест",
    sections,
    questions,
    question_count: questionCount,
  };
}

export function parseQuizCheckResponse(value: unknown): QuizCheckResponse {
  if (!value || typeof value !== "object") {
    return { correct: false, message: "Попробуй ещё раз! 💪" };
  }

  const candidate = value as Record<string, unknown>;
  return {
    correct: candidate.correct === true,
    message:
      typeof candidate.message === "string"
        ? candidate.message
        : candidate.correct === true
          ? "Верно! 🎉"
          : "Попробуй ещё раз! 💪",
  };
}
