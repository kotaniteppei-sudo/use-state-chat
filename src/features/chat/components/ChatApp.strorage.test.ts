import { describe, expect, it } from "vitest";
import {
  LEGACY_STAGE2_STORAGE_KEYS,
  STAGE2_STORAGE_KEY,
  loadStoredMessages,
  saveStoredMessages,
} from "../services/storedMessages";

function createMemoryStorage(initialValues: Record<string, string> = {}) {
  const values = new Map(Object.entries(initialValues));
  return {
    storage: {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => values.set(key, value),
      removeItem: (key: string) => values.delete(key),
    },
    read: (key: string) => values.get(key) ?? null,
  };
}

describe("Stage 2 message history migration", () => {
  it("教材09が共通キーへ保存した履歴を教材10でも保持する", () => {
    const previousMessages = [
      {
        id: "checkpoint-09-message",
        text: "前の章から引き継ぐ",
        sentAt: "2026-08-05T00:00:00.000Z",
      },
    ];
    const memory = createMemoryStorage({
      [STAGE2_STORAGE_KEY]: JSON.stringify(previousMessages),
    });

    expect(
      loadStoredMessages(memory.storage, 200, "2026-08-06T00:00:00.000Z"),
    ).toEqual(previousMessages);
  });

  it("旧教材09のキーと日時なしデータを移行してから旧キーを削除する", () => {
    const memory = createMemoryStorage({
      [LEGACY_STAGE2_STORAGE_KEYS[1]]: JSON.stringify([
        { id: "legacy-message", text: "旧教材の履歴" },
      ]),
    });
    const messages = loadStoredMessages(
      memory.storage,
      200,
      "2026-08-06T00:00:00.000Z",
    );

    expect(messages).toEqual([
      {
        id: "legacy-message",
        text: "旧教材の履歴",
        sentAt: "2026-08-06T00:00:00.000Z",
      },
    ]);

    saveStoredMessages(memory.storage, messages);
    expect(JSON.parse(memory.read(STAGE2_STORAGE_KEY) ?? "null")).toEqual(
      messages,
    );
    expect(memory.read(LEGACY_STAGE2_STORAGE_KEYS[1])).toBeNull();
  });
});
