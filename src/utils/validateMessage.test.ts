import { describe, expect, it } from "vitest";
import {
  MESSAGE_MAX_LENGTH,
  normalizeMessage,
  validateMessage,
} from "./validateMessage";

describe("validateMessage", () => {
  it("空白だけを拒否する", () => {
    expect(validateMessage(" \n ")).toContain("1文字以上");
  });

  it("前後の空白を除いた200文字を受理する", () => {
    expect(validateMessage(` ${"あ".repeat(MESSAGE_MAX_LENGTH)} `)).toBeNull();
  });

  it("201文字を拒否する", () => {
    expect(validateMessage("あ".repeat(MESSAGE_MAX_LENGTH + 1))).toContain(
      "200文字以内",
    );
  });

  it("保存前に前後の空白を正規化する", () => {
    expect(normalizeMessage(" 本文 ")).toBe("本文");
  });
});
