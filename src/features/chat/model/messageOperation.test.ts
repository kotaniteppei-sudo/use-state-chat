import { describe, expect, it } from "vitest";
import type { ChatMessage } from "./ChatMessage";
import {
  filterMessages,
  removeMessage,
  replaceMessageText,
  validateMessage,
} from "./messageOperations";
const messages: ChatMessage[] = [
  { id: "1", text: "確認します", sentAt: "2026-01-01T00:00:00.000Z" },
  { id: "2", text: "資料を送ります", sentAt: "2026-01-02T00:00:00.000Z" },
];

describe("messageOperations", () => {
  it("空白だけの入力と上限超過を拒否する", () => {
    expect(validateMessage("   ", 5)).toBe("メッセージを入力してください。");
    expect(validateMessage("123456", 5)).toBe(
      "メッセージは5文字以内で入力してください。",
    );
    expect(validateMessage("12345", 5)).toBeNull();
  });

  it("検索を正規化し、元の配列を変更しない", () => {
    expect(filterMessages(messages, "確認")).toEqual([messages[0]]);
    expect(messages).toHaveLength(2);
  });

  it("削除と編集を決定的な純粋関数として不変更新する", () => {
    expect(removeMessage(messages, "1")).toEqual([messages[1]]);
    const edited = replaceMessageText(
      messages,
      "1",
      "確認しました",
      "2026-02-01T00:00:00.000Z",
    );
    expect(edited[0]).toEqual({
      ...messages[0],
      text: "確認しました",
      editedAt: "2026-02-01T00:00:00.000Z",
    });
    expect(messages[0].editedAt).toBeUndefined();
  });
});
