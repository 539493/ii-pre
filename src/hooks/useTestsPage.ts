import { useCallback, useEffect, useMemo, useState } from "react";
import { groupQuestionsByTopic } from "@/lib/test-utils";
import { getOrCreateDeviceId } from "@/lib/tutor-session";
import {
  fetchLatestUserTests,
  persistUserTestResult,
  recordProgressRecord,
  requestQuizCheck,
} from "@/services/tutorData";
import type { TestAnswerFeedback, TestQuestion, TestResultItem, UserTest } from "@/types/tutor";

export function useTestsPage() {
  const [tests, setTests] = useState<UserTest[]>([]);
  const [selectedTest, setSelectedTest] = useState<UserTest | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [feedback, setFeedback] = useState<Record<string, TestAnswerFeedback>>({});
  const [checking, setChecking] = useState<string | null>(null);
  const [selectedSubject, setSelectedSubject] = useState("all");
  const deviceId = useMemo(() => getOrCreateDeviceId(), []);

  const loadTests = useCallback(async () => {
    try {
      setTests(await fetchLatestUserTests(deviceId));
    } catch {
      setTests([]);
    }
  }, [deviceId]);

  useEffect(() => {
    void loadTests();
  }, [loadTests]);

  const filteredTests = useMemo(
    () => (selectedSubject === "all" ? tests : tests.filter((test) => test.subject_id === selectedSubject)),
    [selectedSubject, tests],
  );

  const groupedTests = useMemo(() => {
    const grouped = new Map<string, UserTest[]>();

    for (const test of filteredTests) {
      if (!grouped.has(test.subject_id)) {
        grouped.set(test.subject_id, []);
      }
      grouped.get(test.subject_id)?.push(test);
    }

    return grouped;
  }, [filteredTests]);

  const selectedTestSections = useMemo(
    () => (selectedTest ? groupQuestionsByTopic(selectedTest.questions) : []),
    [selectedTest],
  );

  const openTest = useCallback((test: UserTest) => {
    setSelectedTest(test);
    setAnswers({});
    setFeedback({});
  }, []);

  const closeTest = useCallback(() => {
    setSelectedTest(null);
    setAnswers({});
    setFeedback({});
  }, []);

  const updateAnswer = useCallback((questionId: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  }, []);

  const checkAnswer = useCallback(async (question: TestQuestion) => {
    if (!selectedTest) return;

    const answer = answers[question.id]?.trim();
    if (!answer) return;

    setChecking(question.id);
    const currentAttempts = (feedback[question.id]?.attempts || 0) + 1;

    try {
      const response = await requestQuizCheck({
        question: question.question,
        answer,
        context: `Correct answer: ${question.correct_answer}. Hint: ${question.hint}`,
        subjectId: selectedTest.subject_id,
        errorCount: currentAttempts - 1,
      });

      setFeedback((prev) => ({
        ...prev,
        [question.id]: {
          correct: response.correct,
          message: response.message || (response.correct ? "Верно! 🎉" : question.hint),
          attempts: currentAttempts,
        },
      }));

      if (!response.correct) return;

      const nextResults: Record<string, TestResultItem> = {
        ...(selectedTest.results || {}),
        [question.id]: { answer, correct: true, attempts: currentAttempts },
      };
      const allCorrect = selectedTest.questions.every((item) => nextResults[item.id]?.correct);
      const correctCount = Object.values(nextResults).filter((result) => result.correct).length;
      const score = Math.round((correctCount / selectedTest.questions.length) * 100);

      await persistUserTestResult(selectedTest.id, nextResults, allCorrect, score);

      if (allCorrect && !selectedTest.completed) {
        void recordProgressRecord({
          subject_id: selectedTest.subject_id,
          topic: selectedTest.title,
          score,
          total_questions: selectedTest.questions.length,
          correct_answers: correctCount,
          device_id: deviceId,
        }).catch(() => undefined);
      }

      setSelectedTest((prev) => (
        prev ? { ...prev, results: nextResults, completed: allCorrect, score } : null
      ));
      setTests((prev) => prev.map((test) => (
        test.id === selectedTest.id
          ? { ...test, results: nextResults, completed: allCorrect, score }
          : test
      )));
      void loadTests();
    } catch (quizError) {
      setFeedback((prev) => ({
        ...prev,
        [question.id]: {
          correct: false,
          message: quizError instanceof Error ? quizError.message : "Попробуй ещё раз 💪",
          attempts: currentAttempts,
        },
      }));
    } finally {
      setChecking(null);
    }
  }, [answers, deviceId, feedback, loadTests, selectedTest]);

  return {
    tests,
    selectedTest,
    answers,
    feedback,
    checking,
    selectedSubject,
    setSelectedSubject,
    groupedTests,
    selectedTestSections,
    openTest,
    closeTest,
    updateAnswer,
    checkAnswer,
  };
}
