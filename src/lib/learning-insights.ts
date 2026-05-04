import { getStudyTimeLabel, type TopicSummary, buildTopicSummaries } from "@/lib/progress-utils";
import { getSuggestedSubjectName, suggestSubjectAppearance } from "@/lib/subjects";
import type { ProgressRecord, Subject, UserTest } from "@/types/tutor";

export type MistakeNotebookEntry = {
  id: string;
  testId: string;
  subjectId: string;
  subjectName: string;
  subjectIcon: string;
  topic: string;
  testTitle: string;
  questionId: string;
  question: string;
  answer: string;
  hint: string;
  attempts: number;
  corrected: boolean;
  createdAt: string;
};

export type WeakTopicInsight = {
  id: string;
  subjectId: string;
  subjectName: string;
  subjectIcon: string;
  topic: string;
  score: number;
  confidence: "weak" | "fragile" | "strong";
  confidenceLabel: string;
  lastStudied: string | null;
  activityLabel: string;
  mistakeCount: number;
  unresolvedCount: number;
};

export type DailyMission = {
  id: string;
  kind: "mistake-review" | "finish-test" | "weak-topic" | "start-learning";
  title: string;
  description: string;
  ctaLabel: string;
  href: string;
  subjectId?: string;
};

export type SubjectLearningSnapshot = {
  subjectId: string;
  topicCount: number;
  avgScore: number;
  testsCount: number;
  activeTestsCount: number;
  weakTopicsCount: number;
  difficultQuestionsCount: number;
  lastActivityAt: string | null;
  lastActivityLabel: string;
  nextFocus: string;
};

type TopicMistakeAggregate = {
  attemptsOverBaseline: number;
  mistakeCount: number;
  unresolvedCount: number;
  lastActivityAt: string | null;
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function getSubjectMeta(subjectId: string, subjectMap: Map<string, Subject>) {
  const subject = subjectMap.get(subjectId);
  const subjectName = subject?.name || getSuggestedSubjectName(subjectId);
  const fallbackAppearance = suggestSubjectAppearance(subjectName);

  return {
    subjectName,
    subjectIcon: subject?.icon || fallbackAppearance.icon,
  };
}

function getTopicKey(subjectId: string, topic: string) {
  return `${subjectId}::${topic}`;
}

function buildTopicMistakeMap(tests: UserTest[]) {
  const aggregates = new Map<string, TopicMistakeAggregate>();

  for (const test of tests) {
    for (const question of test.questions) {
      const result = test.results?.[question.id];
      if (!result) continue;
      if (result.correct && result.attempts <= 1) continue;

      const topic = question.topic || test.title;
      const key = getTopicKey(test.subject_id, topic);
      const existing = aggregates.get(key);

      if (existing) {
        existing.mistakeCount += result.correct ? Math.max(result.attempts - 1, 1) : 1;
        existing.attemptsOverBaseline += Math.max(result.attempts - 1, 0);
        existing.unresolvedCount += result.correct ? 0 : 1;
        if (!existing.lastActivityAt || test.created_at > existing.lastActivityAt) {
          existing.lastActivityAt = test.created_at;
        }
        continue;
      }

      aggregates.set(key, {
        mistakeCount: result.correct ? Math.max(result.attempts - 1, 1) : 1,
        attemptsOverBaseline: Math.max(result.attempts - 1, 0),
        unresolvedCount: result.correct ? 0 : 1,
        lastActivityAt: test.created_at,
      });
    }
  }

  return aggregates;
}

export function buildMistakeNotebook(
  tests: UserTest[],
  subjects: Subject[],
): MistakeNotebookEntry[] {
  const subjectMap = new Map(subjects.map((subject) => [subject.id, subject]));

  return tests.flatMap((test) => {
    const { subjectName, subjectIcon } = getSubjectMeta(test.subject_id, subjectMap);

    return test.questions.flatMap((question) => {
      const result = test.results?.[question.id];
      if (!result) return [];
      if (result.correct && result.attempts <= 1) return [];

      return [{
        id: `${test.id}:${question.id}`,
        testId: test.id,
        subjectId: test.subject_id,
        subjectName,
        subjectIcon,
        topic: question.topic || test.title,
        testTitle: test.title,
        questionId: question.id,
        question: question.question,
        answer: result.answer,
        hint: question.hint,
        attempts: result.attempts,
        corrected: result.correct,
        createdAt: test.created_at,
      }];
    });
  }).sort((left, right) => {
    if (left.corrected !== right.corrected) {
      return left.corrected ? 1 : -1;
    }

    if (left.attempts !== right.attempts) {
      return right.attempts - left.attempts;
    }

    return right.createdAt.localeCompare(left.createdAt);
  });
}

export function buildWeakTopicInsights(
  records: ProgressRecord[],
  tests: UserTest[],
  subjects: Subject[],
): WeakTopicInsight[] {
  const subjectMap = new Map(subjects.map((subject) => [subject.id, subject]));
  const summaries = buildTopicSummaries(records);
  const summaryMap = new Map(summaries.map((summary) => [getTopicKey(summary.subjectId, summary.topic), summary]));
  const topicMistakes = buildTopicMistakeMap(tests);
  const topicKeys = new Set<string>([
    ...summaryMap.keys(),
    ...topicMistakes.keys(),
  ]);

  return Array.from(topicKeys).map((topicKey) => {
    const summary = summaryMap.get(topicKey);
    const mistakes = topicMistakes.get(topicKey);
    const [subjectId, topic] = topicKey.split("::");
    const { subjectName, subjectIcon } = getSubjectMeta(subjectId, subjectMap);

    const baselineScore = summary?.score ?? 72;
    const penalty = (mistakes?.unresolvedCount || 0) * 18 + (mistakes?.attemptsOverBaseline || 0) * 6;
    const adjustedScore = clamp(baselineScore - penalty, 18, 100);
    const confidence = mistakes?.unresolvedCount
      ? "weak"
      : adjustedScore < 70 || (mistakes?.mistakeCount || 0) > 0
        ? "fragile"
        : "strong";
    const confidenceLabel =
      confidence === "weak" ? "Нужно повторить" : confidence === "fragile" ? "Пока неустойчиво" : "Уверенно";
    const activityDate = summary?.lastStudied || mistakes?.lastActivityAt || null;

    return {
      id: topicKey,
      subjectId,
      subjectName,
      subjectIcon,
      topic,
      score: adjustedScore,
      confidence,
      confidenceLabel,
      lastStudied: activityDate,
      activityLabel: activityDate ? getStudyTimeLabel(activityDate).timeLabel : "Пока не изучали",
      mistakeCount: mistakes?.mistakeCount || 0,
      unresolvedCount: mistakes?.unresolvedCount || 0,
    };
  }).sort((left, right) => {
    const confidenceWeight = { weak: 0, fragile: 1, strong: 2 };
    const leftWeight = confidenceWeight[left.confidence];
    const rightWeight = confidenceWeight[right.confidence];

    if (leftWeight !== rightWeight) {
      return leftWeight - rightWeight;
    }

    if (left.score !== right.score) {
      return left.score - right.score;
    }

    if (left.unresolvedCount !== right.unresolvedCount) {
      return right.unresolvedCount - left.unresolvedCount;
    }

    return (right.lastStudied || "").localeCompare(left.lastStudied || "");
  });
}

export function buildDailyMissions(
  subjects: Subject[],
  weakTopics: WeakTopicInsight[],
  mistakes: MistakeNotebookEntry[],
  tests: UserTest[],
): DailyMission[] {
  const missions: DailyMission[] = [];
  const firstSubject = subjects[0];
  const unresolvedMistakes = mistakes.filter((entry) => !entry.corrected);
  const draftTests = tests.filter((test) => !test.completed);

  if (unresolvedMistakes.length > 0) {
    const grouped = new Map<string, MistakeNotebookEntry[]>();

    for (const entry of unresolvedMistakes) {
      if (!grouped.has(entry.subjectId)) {
        grouped.set(entry.subjectId, []);
      }
      grouped.get(entry.subjectId)?.push(entry);
    }

    const [subjectId, entries] = [...grouped.entries()].sort((left, right) => right[1].length - left[1].length)[0];
    const reference = entries[0];

    missions.push({
      id: `mission-mistakes-${subjectId}`,
      kind: "mistake-review",
      title: `Повтори ошибки по предмету «${reference.subjectName}»`,
      description: `${entries.length} ${entries.length === 1 ? "вопрос требует" : "вопроса требуют"} короткого повторения.`,
      ctaLabel: "Открыть тесты",
      href: "/tests",
      subjectId,
    });
  }

  if (draftTests.length > 0) {
    const draft = [...draftTests].sort((left, right) => {
      const leftScore = left.score ?? 0;
      const rightScore = right.score ?? 0;

      if (leftScore !== rightScore) return leftScore - rightScore;
      return right.created_at.localeCompare(left.created_at);
    })[0];

    missions.push({
      id: `mission-draft-${draft.id}`,
      kind: "finish-test",
      title: `Доведи до конца тест «${draft.title}»`,
      description: `${Object.values(draft.results || {}).filter((item) => item.correct).length} из ${draft.questions.length} вопросов уже закрыты.`,
      ctaLabel: "Продолжить",
      href: "/tests",
      subjectId: draft.subject_id,
    });
  }

  const firstWeakTopic = weakTopics.find((topic) => topic.confidence !== "strong");
  if (firstWeakTopic) {
    missions.push({
      id: `mission-topic-${firstWeakTopic.id}`,
      kind: "weak-topic",
      title: `Подтянуть тему «${firstWeakTopic.topic}»`,
      description: `${firstWeakTopic.subjectName} • ${firstWeakTopic.confidenceLabel.toLowerCase()} • ${firstWeakTopic.score}% уверенности`,
      ctaLabel: "Открыть предмет",
      href: `/subject/${firstWeakTopic.subjectId}`,
      subjectId: firstWeakTopic.subjectId,
    });
  }

  if (missions.length === 0 && firstSubject) {
    missions.push(
      {
        id: `mission-start-subject-${firstSubject.id}`,
        kind: "start-learning",
        title: `Сделай первый разбор по предмету «${firstSubject.name}»`,
        description: "Открой пространство, задай тему и попроси AI объяснить её по шагам.",
        ctaLabel: "Начать урок",
        href: `/subject/${firstSubject.id}`,
        subjectId: firstSubject.id,
      },
      {
        id: `mission-start-test-${firstSubject.id}`,
        kind: "start-learning",
        title: `Создай первый мини-тест по предмету «${firstSubject.name}»`,
        description: "После объяснения сразу проверь себя коротким тестом по теме.",
        ctaLabel: "К предмету",
        href: `/subject/${firstSubject.id}`,
        subjectId: firstSubject.id,
      },
      {
        id: "mission-open-progress",
        kind: "start-learning",
        title: "Собери первую статистику ученика",
        description: "Как только появятся ответы и темы, здесь начнёт строиться персональный план.",
        ctaLabel: "Открыть прогресс",
        href: "/progress",
      },
    );
  }

  return missions.slice(0, 3);
}

export function buildSubjectLearningSnapshots(
  subjects: Subject[],
  records: ProgressRecord[],
  tests: UserTest[],
  weakTopics: WeakTopicInsight[],
): SubjectLearningSnapshot[] {
  const topicSummaries = buildTopicSummaries(records);
  const topicsBySubject = new Map<string, TopicSummary[]>();

  for (const summary of topicSummaries) {
    if (!topicsBySubject.has(summary.subjectId)) {
      topicsBySubject.set(summary.subjectId, []);
    }
    topicsBySubject.get(summary.subjectId)?.push(summary);
  }

  return subjects.map((subject) => {
    const summaries = topicsBySubject.get(subject.id) || [];
    const subjectTests = tests.filter((test) => test.subject_id === subject.id);
    const subjectWeakTopics = weakTopics.filter((topic) => topic.subjectId === subject.id && topic.confidence !== "strong");
    const totalQuestions = summaries.reduce((sum, item) => sum + item.totalQuestions, 0);
    const totalCorrect = summaries.reduce((sum, item) => sum + item.correctAnswers, 0);
    const avgScore = totalQuestions > 0
      ? Math.round((totalCorrect / totalQuestions) * 100)
      : subjectWeakTopics.length > 0
        ? Math.max(35, subjectWeakTopics[0]?.score || 0)
        : 0;
    const latestProgress = summaries[0]?.lastStudied || null;
    const latestTest = subjectTests[0]?.created_at || null;
    const lastActivityAt = [latestProgress, latestTest].filter(Boolean).sort().at(-1) || null;
    const nextFocus = subjectWeakTopics[0]?.topic || subjectTests.find((test) => !test.completed)?.title || "Пока без узкого фокуса";
    const difficultQuestionsCount = subjectTests.reduce((sum, test) => sum + Object.values(test.results || {}).filter((result) => !result.correct || result.attempts > 1).length, 0);

    return {
      subjectId: subject.id,
      topicCount: summaries.length,
      avgScore,
      testsCount: subjectTests.length,
      activeTestsCount: subjectTests.filter((test) => !test.completed).length,
      weakTopicsCount: subjectWeakTopics.length,
      difficultQuestionsCount,
      lastActivityAt,
      lastActivityLabel: lastActivityAt ? getStudyTimeLabel(lastActivityAt).timeLabel : "Пока без активности",
      nextFocus,
    };
  });
}
