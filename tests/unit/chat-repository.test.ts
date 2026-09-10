import { Timestamp, type QueryDocumentSnapshot } from "firebase/firestore";
import { describe, expect, it } from "vitest";
import { latestMessagesInDisplayOrder } from "../../src/chat/repository";
import type { ChatMessageDocument } from "@/chat/model";

function snapshot(id: string, millis: number) {
  const data: ChatMessageDocument = {
    text: id,
    senderId: "user-a",
    createdAt: Timestamp.fromMillis(millis),
    updatedAt: null,
  };

  return { id, data: () => data } as QueryDocumentSnapshot<ChatMessageDocument>;
}

describe("latest message display order", () => {
  it("desc query結果をUI用に昇順へ反転しIDを付ける", () => {
    const result = latestMessagesInDisplayOrder([
      snapshot("newest", 3),
      snapshot("middle", 2),
      snapshot("oldest", 1),
    ]);

    expect(result.map((message) => message.id)).toEqual([
      "oldest",
      "middle",
      "newest",
    ]);
  });
});
