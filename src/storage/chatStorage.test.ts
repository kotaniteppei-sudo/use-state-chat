import { describe, expect, it, vi } from "vitest";
import {
  clearMessages,
  LEGACY_STORAGE_KEY,
  loadMessages,
  parseMessages,
  saveMessages,
  STORAGE_KEY,
  STORAGE_SCHEMA_VERSION,
} from "./chatStorage";
import type { ChatMessage } from "../types/chat";

const VALID_MESSAGE: ChatMessage = {
  id: "message-1",
  text: "確認します",
  sentAt: "2026-07-27T05:00:00.000Z",
};

describe("chatStorage", () => {
  it("正しい履歴だけを復元する", () => {
    expect(
      parseMessages(
        JSON.stringify({
          schemaVersion: STORAGE_SCHEMA_VERSION,
          messages: [VALID_MESSAGE],
        }),
      ),
    ).toEqual({
      status: "success",
      messages: [VALID_MESSAGE],
    });
  });

  it("壊れたJSON・未対応schema・型が違う値を拒否する", () => {
    expect(parseMessages("not-json").status).toBe("invalid");
    expect(
      parseMessages(
        JSON.stringify({ schemaVersion: 1, messages: [VALID_MESSAGE] }),
      ).status,
    ).toBe("invalid");
    expect(
      parseMessages(
        JSON.stringify({
          schemaVersion: STORAGE_SCHEMA_VERSION,
          messages: [{ ...VALID_MESSAGE, id: 1 }],
        }),
      ).status,
    ).toBe("invalid");
  });

  it("教材03の201文字以上の旧履歴を失わず読み込む", () => {
    const legacyMessage = { ...VALID_MESSAGE, text: "長".repeat(201) };
    const storage = {
      getItem: (key: string) =>
        key === LEGACY_STORAGE_KEY ? JSON.stringify([legacyMessage]) : null,
    };

    expect(loadMessages(storage)).toEqual({
      status: "success",
      messages: [legacyMessage],
    });
  });

  it("IDが重複する保存データを拒否する", () => {
    expect(
      parseMessages(
        JSON.stringify({
          schemaVersion: STORAGE_SCHEMA_VERSION,
          messages: [VALID_MESSAGE, { ...VALID_MESSAGE, text: "重複" }],
        }),
      ).status,
    ).toBe("invalid");
  });

  it("getItem例外をunavailableとして扱う", () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    const storage = {
      getItem: () => {
        throw new DOMException("denied", "SecurityError");
      },
    };
    expect(loadMessages(storage).status).toBe("unavailable");
  });

  it("localStorage getterのSecurityErrorをunavailableとして扱う", () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    const getter = vi
      .spyOn(window, "localStorage", "get")
      .mockImplementation(() => {
        throw new DOMException("denied", "SecurityError");
      });
    expect(loadMessages().status).toBe("unavailable");
    getter.mockRestore();
  });

  it("setItem例外をfalseとして返す", () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    const storage = {
      setItem: () => {
        throw new DOMException("full", "QuotaExceededError");
      },
      removeItem: vi.fn(),
    };
    expect(saveMessages([VALID_MESSAGE], storage)).toBe(false);
  });

  it("所定のキーへJSONを保存する", () => {
    const storage = { setItem: vi.fn(), removeItem: vi.fn() };
    expect(saveMessages([VALID_MESSAGE], storage)).toBe(true);
    expect(storage.setItem).toHaveBeenCalledWith(
      STORAGE_KEY,
      JSON.stringify({
        schemaVersion: STORAGE_SCHEMA_VERSION,
        messages: [VALID_MESSAGE],
      }),
    );
  });

  it("IDが重複する配列は保存しない", () => {
    const storage = { setItem: vi.fn(), removeItem: vi.fn() };
    expect(saveMessages([VALID_MESSAGE, VALID_MESSAGE], storage)).toBe(false);
    expect(storage.setItem).not.toHaveBeenCalled();
  });

  it("明示的な履歴消去では現行キーと旧キーを削除する", () => {
    const storage = { setItem: vi.fn(), removeItem: vi.fn() };
    expect(clearMessages(storage)).toBe(true);
    expect(storage.removeItem).toHaveBeenCalledWith(STORAGE_KEY);
    expect(storage.removeItem).toHaveBeenCalledWith(LEGACY_STORAGE_KEY);
  });
});
