import {
  Timestamp,
  type DocumentData,
  type FirestoreDataConverter,
  type QueryDocumentSnapshot,
  type SnapshotOptions,
  type WithFieldValue,
} from "firebase/firestore";
import {
  isAttachmentMetadata,
  type AttachmentMetadata,
} from "../contracts/attachment";

export type ChatMessageDocument = {
  text: string;
  senderId: string;
  createdAt: Timestamp | null;
  updatedAt: Timestamp | null;
  attachment?: AttachmentMetadata | null;
};

export type ChatMessage = Omit<ChatMessageDocument, "attachment"> & {
  id: string;
  attachment: AttachmentMetadata | null;
};

const requiredKeys = ["text", "senderId", "createdAt", "updatedAt"];
const allowedKeys = [...requiredKeys, "attachment"];

function hasExactMessageKeys(data: DocumentData): boolean {
  const keys = Object.keys(data);
  return (
    requiredKeys.every((key) => keys.includes(key)) &&
    keys.every((key) => allowedKeys.includes(key))
  );
}

export function parseChatMessageDocument(
  data: DocumentData,
): ChatMessageDocument {
  const attachment = data.attachment as unknown;

  if (
    !hasExactMessageKeys(data) ||
    typeof data.text !== "string" ||
    data.text !== data.text.trim() ||
    data.text.length === 0 ||
    data.text.length > 200 ||
    typeof data.senderId !== "string" ||
    data.senderId.length === 0 ||
    !(data.createdAt == null || data.createdAt instanceof Timestamp) ||
    !(data.updatedAt == null || data.updatedAt instanceof Timestamp) ||
    !(attachment == null || isAttachmentMetadata(attachment))
  ) {
    throw new Error("Invalid ChatMessage schema");
  }

  return {
    text: data.text,
    senderId: data.senderId,
    createdAt: data.createdAt ?? null,
    updatedAt: data.updatedAt ?? null,
    attachment: (attachment as AttachmentMetadata) ?? null,
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

export type { AttachmentMetadata } from "../contracts/attachment";
