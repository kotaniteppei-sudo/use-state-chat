import { Timestamp } from "firebase/firestore";
import { describe, it, expect } from "vitest";
import { parseChatMessageDocument } from "../../src/chat/model";

const validBase = {
  text: "hello",
  senderId: "user-a",
  createdAt: Timestamp.fromMillis(1),
  updatedAt: null,
};

describe("chat converter runtime validation", () => {
  it("正式な4fieldを受理する", () => {
    expect(parseChatMessageDocument(validBase)).toEqual(validBase);
  });

  it("trim、長さ、timestamp、必須field違反を拒否する", () => {
    expect(() =>
      parseChatMessageDocument({ ...validBase, text: " hello " }),
    ).toThrow();
    expect(() =>
      parseChatMessageDocument({ ...validBase, text: "a".repeat(201) }),
    ).toThrow();
    expect(() =>
      parseChatMessageDocument({ ...validBase, createdAt: "now" }),
    ).toThrow();

    const { senderId: _omittedSenderId, ...missingSender } = validBase;
    void _omittedSenderId;
    expect(() => parseChatMessageDocument(missingSender)).toThrow();
  });

  it("追加fieldを拒否する", () => {
    expect(() =>
      parseChatMessageDocument({ ...validBase, isAdmin: true }),
    ).toThrow();
  });
});
