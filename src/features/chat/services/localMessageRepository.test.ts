import { describe, expect, it } from "vitest";
import {
  LEGACY_STAGE2_STORAGE_KEYS,
  STAGE2_STORAGE_KEY,
  loadStoredMessages,
  parseStoredMessages,
  saveStoredMessages,
} from "./localMessageRepository";
const validMessage = {
  id: "message-1",
  text: "確認します",
  sentAt: "2026-08-05T00:00:00.000Z",
};

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

describe("localMessageRepository schema boundary", () => {
  it("正規化済みの完全なmessageだけを復元する", () => {
    expect(parseStoredMessages(JSON.stringify([validMessage]))).toEqual([
      validMessage,
    ]);
  });

  it("壊れたJSONを安全に空配列へ変換する", () => {
    expect(parseStoredMessages("{broken-json")).toEqual([]);
  });

  it("配列でないJSONを安全に空配列へ変換する", () => {
    expect(parseStoredMessages(JSON.stringify(validMessage))).toEqual([]);
  });
  it("required fieldが不足するmessageを拒否する", () => {
    expect(
      parseStoredMessages(
        JSON.stringify([{ id: validMessage.id, text: validMessage.text }]),
      ),
    ).toEqual([]);
  });
  it("空ID・空白/長文・不正日時・余分なfieldを含む配列を拒否する", () => {
    const invalidValues = [
      { ...validMessage, id: "" },
      { ...validMessage, text: " " },
      { ...validMessage, text: "x".repeat(201) },
      { ...validMessage, sentAt: "bad-date" },
      { ...validMessage, editedAt: "bad-date" },
      { ...validMessage, isAdmin: true },
    ];
    for (const value of invalidValues) {
      expect(parseStoredMessages(JSON.stringify([value]))).toEqual([]);
    }
  });
  it("教材10の共通キーにある履歴をそのまま読み込む", () => {
    const memory = createMemoryStorage({
      [STAGE2_STORAGE_KEY]: JSON.stringify([validMessage]),
    });
    expect(
      loadStoredMessages(memory.storage, "2026-08-06T00:00:00.000Z"),
    ).toEqual([validMessage]);
  });
  it("旧教材09の履歴を移行し、保存成功後に旧キーを削除する", () => {
    const legacyKey = LEGACY_STAGE2_STORAGE_KEYS[1];
    const memory = createMemoryStorage({
      [legacyKey]: JSON.stringify([
        { id: "legacy-message", text: "旧教材の履歴" },
      ]),
    });
    const messages = loadStoredMessages(
      memory.storage,
      "2026-08-06T00:00:00.000Z",
    );

    expect(messages).toEqual([
      {
        id: "legacy-message",
        text: "旧教材の履歴",
        sentAt: "2026-08-06T00:00:00.000Z",
      },
    ]);
    expect(saveStoredMessages(memory.storage, messages)).toBe(true);
    expect(JSON.parse(memory.read(STAGE2_STORAGE_KEY) ?? "null")).toEqual(
      messages,
    );
    expect(memory.read(legacyKey)).toBeNull();
  });
});
