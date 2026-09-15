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
  it("optional attachmentの欠落をnullへ正規化する", () => {
    expect(parseChatMessageDocument(validBase).attachment).toBeNull();
    expect(
      parseChatMessageDocument({ ...validBase, attachment: null }).attachment,
    ).toBeNull();
  });
  it("正式attachment metadataを受理する", () => {
    const attachment = {
      fullPath: "rooms/room-a/attachments/user-a/file-1",
      contentType: "application/pdf" as const,
      size: 4,
      displayName: "guide.pdf",
    };

    expect(
      parseChatMessageDocument({ ...validBase, attachment }).attachment,
    ).toEqual(attachment);
  });

  it("trim/長さ、timestamp、必須field違反を拒否する", () => {
    expect(() =>
      parseChatMessageDocument({ ...validBase, text: " hello " }),
    ).toThrow();
    expect(() =>
      parseChatMessageDocument({ ...validBase, text: "a".repeat(201) }),
    ).toThrow();
    expect(() =>
      parseChatMessageDocument({ ...validBase, createdAt: "now" }),
    ).toThrow();

    const { senderId: omittedSenderId, ...missingSender } = validBase;
    void omittedSenderId;
    expect(() => parseChatMessageDocument(missingSender)).toThrow();
  });

  it("追加fieldとStorage契約に合わないmetadataを拒否する", () => {
    expect(() =>
      parseChatMessageDocument({ ...validBase, isAdmin: true }),
    ).toThrow();

    expect(() =>
      parseChatMessageDocument({
        ...validBase,
        attachment: {
          fullPath: "room/room-a/attachments/user-a/file-1",
          contentType: "image/png",
          size: 5 * 1024 * 1024 + 1,
          displayName: "large.png",
        },
      }),
    ).toThrow();
  });
});
