import { describe, expect, it } from "vitest";
import { buildConversationHistory, getVisibleBoardItems, restoreChatMessages } from "@/lib/tutor-session";
import type { ChatMessage, TutorResponse } from "@/types/tutor";

const sampleTutorResponse: TutorResponse = {
  title: "Квадратные уравнения",
  summary: "Разберём решение по шагам.",
  steps: ["Смотрим на коэффициенты", "Находим дискриминант"],
  board: [
    { id: "1", type: "text", text: "ax² + bx + c = 0", x: 60, y: 40, stepIndex: 0 },
    { id: "2", type: "formula", text: "D = b² - 4ac", x: 60, y: 120, stepIndex: 1 },
  ],
  checkUnderstanding: ["Что такое дискриминант?"],
};

describe("tutor-session", () => {
  it("restores only valid chat messages from storage", () => {
    const raw = JSON.stringify([
      {
        id: "msg-1",
        role: "assistant",
        content: "Готово",
        timestamp: "2026-05-02T12:00:00.000Z",
        result: sampleTutorResponse,
      },
      {
        id: 42,
        role: "assistant",
        content: "broken",
        timestamp: "2026-05-02T12:00:00.000Z",
      },
    ]);

    const restored = restoreChatMessages(raw);

    expect(restored).toHaveLength(1);
    expect(restored[0].timestamp).toBeInstanceOf(Date);
    expect(restored[0].result?.title).toBe("Квадратные уравнения");
  });

  it("builds conversation history and filters visible board items by revealed step", () => {
    const messages: ChatMessage[] = [
      {
        id: "user-1",
        role: "user",
        content: "Объясни квадратные уравнения",
        timestamp: new Date("2026-05-02T12:00:00.000Z"),
      },
      {
        id: "assistant-1",
        role: "assistant",
        content: sampleTutorResponse.summary,
        result: sampleTutorResponse,
        timestamp: new Date("2026-05-02T12:01:00.000Z"),
      },
    ];

    const history = buildConversationHistory(messages);
    const visibleBoard = getVisibleBoardItems(sampleTutorResponse, 0, true);

    expect(history).toEqual([
      { role: "user", content: "Объясни квадратные уравнения" },
      {
        role: "assistant",
        content: "Квадратные уравнения: Разберём решение по шагам.\nSteps: Смотрим на коэффициенты; Находим дискриминант",
      },
    ]);
    expect(visibleBoard).toHaveLength(1);
    expect(visibleBoard[0].id).toBe("1");
  });
});
