import type { ChatMessage } from "../model/ChatMessage";
import type { MessageRepository } from "./messageRepository";

export const STAGE2_STORAGE_KEY = "training-stage2-chat-messages";
export const LEGACY_STAGE2_STORAGE_KEYS = [
  "training-checkpoint-10-messages",
  "training-checkpoint-09-messages",
] as const;

const MESSAGE_MAX_LENGTH = 200;
type MessageStorage = Pick<Storage, "getItem" | "setItem" | "removeItem">;

function isIsoDate(value: string): boolean {
  const parsed = new Date(value);
  return !Number.isNaN(parsed.valueOf()) && parsed.toISOString() === value;
}

function isChatMessage(value: unknown): value is ChatMessage {
  if (typeof value !== "object" || value === null) return false;

  const candidate = value as Partial<ChatMessage>;
  const keys = Object.keys(value);

  return (
    keys.length >= 3 &&
    keys.length <= 4 &&
    keys.every((key) => ["id", "text", "sentAt", "editedAt"].includes(key)) &&
    typeof candidate.id === "string" &&
    candidate.id.length > 0 &&
    typeof candidate.text === "string" &&
    candidate.text.trim() === candidate.text &&
    candidate.text.length > 0 &&
    candidate.text.length < MESSAGE_MAX_LENGTH &&
    typeof candidate.sentAt === "string" &&
    isIsoDate(candidate.sentAt) &&
    (candidate.editedAt === undefined ||
      (typeof candidate.editedAt === "string" && isIsoDate(candidate.editedAt)))
  );
}

export function parseStoredMessages(serializedMessages: string): ChatMessage[] {
  try {
    const parsedMessages: unknown = JSON.parse(serializedMessages);
    return Array.isArray(parsedMessages) && parsedMessages.every(isChatMessage)
      ? parsedMessages
      : [];
  } catch {
    return [];
  }
}

function parseLegacyCheckpoint09Messages(
  serializedMessages: string,
  migratedAt: string,
): ChatMessage[] {
  try {
    const parsedLegacyMessages: unknown = JSON.parse(serializedMessages);
    if (!Array.isArray(parsedLegacyMessages)) return [];

    const messages: ChatMessage[] = [];
    for (const value of parsedLegacyMessages) {
      if (typeof value !== "object" || value === null) return [];
      const candidate = value as { id?: unknown; text?: unknown };

      if (
        Object.keys(value).length !== 2 ||
        !Object.keys(value).every((key) => ["id", "text"].includes(key)) ||
        typeof candidate.id !== "string" ||
        candidate.id.length === 0 ||
        typeof candidate.text !== "string" ||
        candidate.text.trim() !== candidate.text ||
        candidate.text.length === 0 ||
        candidate.text.length > MESSAGE_MAX_LENGTH
      ) {
        return [];
      }
      messages.push({
        id: candidate.id,
        text: candidate.text,
        sentAt: migratedAt,
      });
    }
    return messages;
  } catch {
    return [];
  }
}

export function loadStoredMessages(
  storage: MessageStorage,
  migratedAt: string,
): ChatMessage[] {
  const currentValue = storage.getItem(STAGE2_STORAGE_KEY);
  if (currentValue !== null) return parseStoredMessages(currentValue);

  const checkpoint10Value = storage.getItem(LEGACY_STAGE2_STORAGE_KEYS[0]);
  if (checkpoint10Value !== null) return parseStoredMessages(checkpoint10Value);

  const checkpoint09Value = storage.getItem(LEGACY_STAGE2_STORAGE_KEYS[1]);
  if (checkpoint09Value !== null) {
    return parseLegacyCheckpoint09Messages(checkpoint09Value, migratedAt);
  }
  return [];
}

export function saveStoredMessages(
  storage: MessageStorage,
  messages: readonly ChatMessage[],
): boolean {
  try {
    storage.setItem(STAGE2_STORAGE_KEY, JSON.stringify(messages));

    for (const key of LEGACY_STAGE2_STORAGE_KEYS) {
      storage.removeItem(key);
    }
    return true;
  } catch {
    return false;
  }
}

function loadMessages(): ChatMessage[] {
  try {
    return loadStoredMessages(localStorage, new Date().toISOString());
  } catch {
    return [];
  }
}

function saveMessages(messages: readonly ChatMessage[]): boolean {
  return saveStoredMessages(localStorage, messages);
}

export const localMessageRepository: MessageRepository = {
  load: loadMessages,
  save: saveMessages,
};
