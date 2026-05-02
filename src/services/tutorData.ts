import { supabase } from "@/integrations/supabase/client";
import type { TablesInsert } from "@/integrations/supabase/types";
import {
  normalizeUserTest,
  parseGeneratedTestsResponse,
  parseQuizCheckResponse,
  selectLatestTestsBySubject,
} from "@/lib/test-utils";
import { parseTutorResponse } from "@/lib/tutor-session";
import type {
  ChatHistoryEntry,
  GeneratedTestResponse,
  KnowledgeItem,
  ProgressRecord,
  QuizCheckResponse,
  TestResultItem,
  TutorResponse,
  UserTest,
} from "@/types/tutor";

type TutorBoardRequest = {
  prompt: string;
  knowledge: string;
  history: ChatHistoryEntry[];
  subjectId?: string;
  subjectName?: string;
  image?: string;
  deviceId?: string;
};

type GenerateTestsRequest = {
  subjectId: string;
  subjectName: string;
  topic: string;
  deviceId: string;
  history: ChatHistoryEntry[];
};

type QuizCheckRequest = {
  question: string;
  answer: string;
  context: string;
  subjectId?: string;
  errorCount?: number;
};

function getErrorMessage(error: { message?: string } | null, fallback: string) {
  return error?.message || fallback;
}

export async function fetchKnowledgeItems(): Promise<KnowledgeItem[]> {
  const { data, error } = await supabase
    .from("knowledge_items")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw new Error(getErrorMessage(error, "Не удалось загрузить материалы."));
  return data ?? [];
}

export async function createKnowledgeItem(payload: Pick<KnowledgeItem, "title" | "content">) {
  const { error } = await supabase.from("knowledge_items").insert(payload);
  if (error) throw new Error(getErrorMessage(error, "Не удалось сохранить материал."));
}

export async function deleteKnowledgeItem(id: string) {
  const { error } = await supabase.from("knowledge_items").delete().eq("id", id);
  if (error) throw new Error(getErrorMessage(error, "Не удалось удалить материал."));
}

export async function fetchProgressRecords(): Promise<ProgressRecord[]> {
  const { data, error } = await supabase
    .from("progress_records")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw new Error(getErrorMessage(error, "Не удалось загрузить прогресс."));
  return data ?? [];
}

export async function recordProgressRecord(record: TablesInsert<"progress_records">) {
  const { error } = await supabase.from("progress_records").insert(record);
  if (error) throw new Error(getErrorMessage(error, "Не удалось сохранить прогресс."));
}

export async function fetchLatestUserTests(deviceId: string): Promise<UserTest[]> {
  const { data, error } = await supabase
    .from("user_tests")
    .select("*")
    .eq("device_id", deviceId)
    .order("created_at", { ascending: true });

  if (error) throw new Error(getErrorMessage(error, "Не удалось загрузить тесты."));
  return selectLatestTestsBySubject((data ?? []).map(normalizeUserTest));
}

export async function persistUserTestResult(
  testId: string,
  results: Record<string, TestResultItem>,
  completed: boolean,
  score: number,
) {
  const { error } = await supabase.from("user_tests").update({
    results,
    completed,
    score,
  }).eq("id", testId);

  if (error) throw new Error(getErrorMessage(error, "Не удалось обновить результаты теста."));
}

export async function requestTutorBoard(body: TutorBoardRequest): Promise<TutorResponse> {
  const { data, error } = await supabase.functions.invoke("tutor-board", { body });
  if (error) throw new Error(getErrorMessage(error, "Ошибка вызова AI."));
  return parseTutorResponse(data);
}

export async function requestGenerateTests(body: GenerateTestsRequest): Promise<GeneratedTestResponse> {
  const { data, error } = await supabase.functions.invoke("generate-tests", { body });
  if (error) throw new Error(getErrorMessage(error, "Ошибка создания тестов."));
  return parseGeneratedTestsResponse(data);
}

export async function requestQuizCheck(body: QuizCheckRequest): Promise<QuizCheckResponse> {
  const { data, error } = await supabase.functions.invoke("quiz-check", { body });
  if (error) throw new Error(getErrorMessage(error, "Ошибка проверки, попробуй ещё раз 🔄"));
  return parseQuizCheckResponse(data);
}
