import {
  Timestamp,
  type DocumentData,
  type FirestoreDataConverter,
  type QueryDocumentSnapshot,
  type SnapshotOptions,
  type WithFieldValue,
} from "firebase/firestore";

export type ChatMessageDocument = {
  text: string;
  senderId: string;
  createdAt: Timestamp | null;
  updatedAt: Timestamp | null;
};

export type ChatMessage = ChatMessageDocument & { id: string };

const requiredKeys = ["text", "senderId", "createdAt", "updatedAt"];

export function parseChatMessageDocument(
  data: DocumentData,
): ChatMessageDocument {
  const keys = Object.keys(data);
  if (
    keys.length !== requiredKeys.length ||
    !requiredKeys.every((key) => keys.includes(key)) ||
    typeof data.text !== "string" ||
    data.text !== data.text.trim() ||
    data.text.length === 0 ||
    data.text.length > 200 ||
    typeof data.senderId !== "string" ||
    data.senderId.length === 0 ||
    !(data.createdAt == null || data.createdAt instanceof Timestamp) ||
    !(data.updatedAt == null || data.updatedAt instanceof Timestamp)
  ) {
    throw new Error("Invalid ChatMessage schema");
  }

  return {
    text: data.text,
    senderId: data.senderId,
    createdAt: data.createdAt ?? null,
    updatedAt: data.updatedAt ?? null,
  };
}

export const chatMessageConverter: FirestoreDataConverter<
  ChatMessageDocument,
  DocumentData
> = {
  toFirestore(message: WithFieldValue<ChatMessageDocument>): DocumentData {
    return message;
  },

  fromFirestore(
    snapshot: QueryDocumentSnapshot<DocumentData>,
    options: SnapshotOptions,
  ): ChatMessageDocument {
    return parseChatMessageDocument(snapshot.data(options));
  },
};
