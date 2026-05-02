import { getSuggestedSubjectName, suggestSubjectAppearance } from "@/lib/subjects";
import type { ProgressRecord, Subject } from "@/types/tutor";

export interface TopicSummary {
  topic: string;
  subjectId: string;
  totalQuestions: number;
  correctAnswers: number;
  score: number;
  lastStudied: string;
  hasSkipped: boolean;
}

export interface SubjectStats extends Subject {
  topicCount: number;
  avgScore: number;
  totalQ: number;
  totalC: number;
  skippedTopics: number;
}

export function buildTopicSummaries(records: ProgressRecord[]): TopicSummary[] {
  const summaries = new Map<string, TopicSummary>();

  for (const record of records) {
    const key = `${record.subject_id}::${record.topic}`;
    const existing = summaries.get(key);

    if (existing) {
      existing.totalQuestions += record.total_questions;
      existing.correctAnswers += record.correct_answers;
      existing.score = existing.totalQuestions > 0
        ? Math.round((existing.correctAnswers / existing.totalQuestions) * 100)
        : 0;
      if (record.created_at > existing.lastStudied) existing.lastStudied = record.created_at;
      if (record.correct_answers === 0) existing.hasSkipped = true;
      continue;
    }

    summaries.set(key, {
      topic: record.topic,
      subjectId: record.subject_id,
      totalQuestions: record.total_questions,
      correctAnswers: record.correct_answers,
      score: record.total_questions > 0
        ? Math.round((record.correct_answers / record.total_questions) * 100)
        : 0,
      lastStudied: record.created_at,
      hasSkipped: record.correct_answers === 0,
    });
  }

  return Array.from(summaries.values()).sort((a, b) => b.lastStudied.localeCompare(a.lastStudied));
}

export function buildSubjectStats(subjects: Subject[], topicSummaries: TopicSummary[]): SubjectStats[] {
  return subjects.map((subject) => {
    const topics = topicSummaries.filter((summary) => summary.subjectId === subject.id);
    const totalQ = topics.reduce((sum, topic) => sum + topic.totalQuestions, 0);
    const totalC = topics.reduce((sum, topic) => sum + topic.correctAnswers, 0);
    const avgScore = totalQ > 0 ? Math.round((totalC / totalQ) * 100) : 0;
    const skippedTopics = topics.filter((topic) => topic.hasSkipped && topic.score < 50).length;

    return {
      ...subject,
      topicCount: topics.length,
      avgScore,
      totalQ,
      totalC,
      skippedTopics,
    };
  });
}

export function getGradeLabel(score: number) {
  if (score >= 90) return { text: "Отлично", color: "text-green-400" };
  if (score >= 70) return { text: "Хорошо", color: "text-blue-400" };
  if (score >= 50) return { text: "Удовл.", color: "text-yellow-400" };
  if (score > 0) return { text: "Нужна работа", color: "text-orange-400" };
  return { text: "Не пройдено", color: "text-red-400" };
}

export function getStudyTimeLabel(studiedAt: string, now = new Date()) {
  const studiedDate = new Date(studiedAt);
  const daysAgo = Math.floor((now.getTime() - studiedDate.getTime()) / (1000 * 60 * 60 * 24));

  return {
    date: studiedDate,
    timeLabel: daysAgo === 0 ? "Сегодня" : daysAgo === 1 ? "Вчера" : `${daysAgo} дн. назад`,
  };
}

export function getSubjectDisplay(subjectId: string, subjectsMap: Map<string, Subject>) {
  const subject = subjectsMap.get(subjectId);
  const fallbackName = getSuggestedSubjectName(subjectId);
  const fallbackAppearance = suggestSubjectAppearance(subject?.name || fallbackName);

  return {
    subject,
    fallbackName,
    fallbackAppearance,
  };
}
