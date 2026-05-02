import type { BoardItem, ChatHistoryEntry, ChatMessage, TutorResponse } from "@/types/tutor";

export const DEVICE_ID_KEY = "ai-tutor-device-id";
export const CHAT_VISIBLE_KEY = "ai-tutor-chat-visible";
const HISTORY_KEY_PREFIX = "ai-tutor-history-";

type StoredChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  result?: unknown;
  imageUrl?: unknown;
};

export function getChatHistoryKey(subjectId: string) {
  return `${HISTORY_KEY_PREFIX}${subjectId}`;
}

export function getOrCreateDeviceId(storage: Pick<Storage, "getItem" | "setItem"> = localStorage) {
  let id = storage.getItem(DEVICE_ID_KEY);
  if (!id) {
    id = crypto.randomUUID();
    storage.setItem(DEVICE_ID_KEY, id);
  }
  return id;
}

export function getStoredBoolean(raw: string | null, defaultValue = true) {
  if (raw === null) return defaultValue;
  return raw === "true";
}

export function isTutorResponse(value: unknown): value is TutorResponse {
  if (!value || typeof value !== "object") return false;

  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.title === "string" &&
    typeof candidate.summary === "string" &&
    Array.isArray(candidate.steps) &&
    candidate.steps.every((step) => typeof step === "string") &&
    Array.isArray(candidate.board) &&
    Array.isArray(candidate.checkUnderstanding) &&
    candidate.checkUnderstanding.every((question) => typeof question === "string")
  );
}

function isStoredChatMessage(value: unknown): value is StoredChatMessage {
  if (!value || typeof value !== "object") return false;

  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.id === "string" &&
    (candidate.role === "user" || candidate.role === "assistant") &&
    typeof candidate.content === "string" &&
    typeof candidate.timestamp === "string"
  );
}

export function parseTutorResponse(value: unknown): TutorResponse {
  if (!isTutorResponse(value)) {
    throw new Error("AI returned an invalid tutor response.");
  }
  return value;
}

export function restoreChatMessages(raw: string | null): ChatMessage[] {
  if (!raw) return [];

  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed.filter(isStoredChatMessage).map((message) => ({
      id: message.id,
      role: message.role,
      content: message.content,
      timestamp: new Date(message.timestamp),
      result: isTutorResponse(message.result) ? message.result : undefined,
      imageUrl: typeof message.imageUrl === "string" ? message.imageUrl : undefined,
    }));
  } catch {
    return [];
  }
}

export function buildConversationHistory(messages: ChatMessage[]): ChatHistoryEntry[] {
  return messages.map((message) => ({
    role: message.role,
    content:
      message.role === "user"
        ? message.content
        : message.result
          ? `${message.result.title}: ${message.result.summary}\nSteps: ${message.result.steps.join("; ")}`
          : message.content,
  }));
}

export function getVisibleBoardItems(
  result: TutorResponse | null,
  revealedStepIndex: number,
  isSpeaking: boolean,
): BoardItem[] {
  if (!result?.board?.length) return [];
  if (revealedStepIndex === -1 && !isSpeaking) return result.board;

  return result.board.filter((item) => {
    const step = item.stepIndex ?? 0;
    return step <= revealedStepIndex;
  });
}
