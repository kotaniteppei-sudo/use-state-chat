import { describe, expect, it } from "vitest";
import { validateMessageDraft } from "./messageDraft";

describe("validateMessageDraft", () => {
  it("空白と上限超過を拒否し、上限ちょうどを許可する", () => {
    expect(validateMessageDraft(" ", 5)).toBe("メッセージを入力してください。");
    expect(validateMessageDraft("123456", 5)).toBe(
      "メッセージは5文字以内で入力してください。",
    );
  });
  expect(validateMessageDraft("12345", 5)).toBeNull();
});
