import type { ChatMessage } from "../model/ChatMessage";
export const STAGE2_STORAGE_KEY = "training-stage2-chat-messages";
export const LEGACY_STAGE2_STORAGE_KEYS = [
  "training-checkpoint-10-messages",
  "training-checkpoint-09-messages",
] as const;

type MessageStorage = Pick<Storage, "getItem" | "setItem" | "removeItem">;

function isIsoDate(value: string): boolean {
  const parsed = new Date(value);
  return !Number.isNaN(parsed.valueOf()) && parsed.toISOString() === value;
}

function parseMessages(
  value: string,
  maxMessageLength: number,
  migratedAt: string,
  allowMissingSentAt: boolean,
): ChatMessage[] | null {
  try {
    const parsed: unknown = JSON.parse(value);
    if (!Array.isArray(parsed)) return null;

    const messages: ChatMessage[] = [];
    for (const item of parsed) {
      if (typeof item !== "object" || item === null) return null;
      const candidate = item as Partial<ChatMessage>;
      const keys = Object.keys(item);

      const validSharedFields =
        typeof candidate.id === "string" &&
        candidate.id.length > 0 &&
        typeof candidate.text === "string" &&
        candidate.text.trim().length > 0 &&
        candidate.text.length <= maxMessageLength;

      if (!validSharedFields) return null;

      if (
        keys.length >= 3 &&
        keys.length <= 4 &&
        keys.every(
          (key) =>
            ["id", "text", "sentAt", "editedAt"].includes(key) &&
            typeof candidate.sentAt === "string" &&
            isIsoDate(candidate.sentAt) &&
            (candidate.editedAt === undefined ||
              (typeof candidate.editedAt === "string" &&
                isIsoDate(candidate.editedAt))),
        )
      ) {
        messages.push(candidate as ChatMessage);
        continue;
      }
      if (
        allowMissingSentAt &&
        keys.length === 2 &&
        keys.every((key) => ["id", "text"].includes(key))
      ) {
        messages.push({
          id: candidate.id as string,
          text: candidate.text as string,
          sentAt: migratedAt,
        });
        continue;
      }
      return null;
    }
    return messages;
  } catch {
    return null;
  }
}

export function loadStoredMessages(
  storage: MessageStorage,
  maxMessageLength: number,
  migratedAt: string,
): ChatMessage[] {
  const storageCandidates = [
    { key: STAGE2_STORAGE_KEY, allowMissingSentAt: false },
    { key: LEGACY_STAGE2_STORAGE_KEYS[0], allowMissingSentAt: false },
    { key: LEGACY_STAGE2_STORAGE_KEYS[1], allowMissingSentAt: true },
  ];
  for (const candidate of storageCandidates) {
    const serialized = storage.getItem(candidate.key);
    if (serialized === null) continue;

    return (
      parseMessages(
        serialized,
        maxMessageLength,
        migratedAt,
        candidate.allowMissingSentAt,
      ) ?? []
    );
  }
  return [];
}

export function saveStoredMessages(
  storage: MessageStorage,
  messages: readonly ChatMessage[],
): void {
  storage.setItem(STAGE2_STORAGE_KEY, JSON.stringify(messages));
  for (const key of LEGACY_STAGE2_STORAGE_KEYS) storage.removeItem(key);
}
