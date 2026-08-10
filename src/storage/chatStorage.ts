import type { ChatMessage } from "../types/chat";

export const STORAGE_SCHEMA_VERSION = 2 as const;
export const STORAGE_KEY = "training-chat:v2";
export const LEGACY_STORAGE_KEY = "training-chat:v1";

type StoredChatV2 = {
  schemaVersion: typeof STORAGE_SCHEMA_VERSION;
  messages: ChatMessage[];
};

export type InitialMessages = {
  messages: ChatMessage[];
  storageWarning: string | null;
};

function isIsoDate(value: unknown): value is string {
  if (typeof value !== "string") return false;
  const date = new Date(value);
  return !Number.isNaN(date.valueOf()) && date.toISOString() === value;
}

function isChatMessage(value: unknown): value is ChatMessage {
  if (typeof value !== "object" || value === null) return false;

  const candidate = value as Record<string, unknown>;
  if (typeof candidate.id !== "string" || typeof candidate.text !== "string") {
    return false;
  }

  return (
    candidate.id.length > 0 &&
    candidate.text.trim() === candidate.text &&
    candidate.text.length > 0 &&
    isIsoDate(candidate.sentAt) &&
    (candidate.editedAt === undefined || isIsoDate(candidate.editedAt))
  );
}

function isMessageArry(value: unknown): value is ChatMessage[] {
  if (!Array.isArray(value) || !value.every(isChatMessage)) return false;
  return new Set(value.map((message) => message.id)).size === value.length;
}

function parseCurrentMessages(raw: string): ChatMessage[] | null {
  try {
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null) return null;

    const candidate = parsed as Record<string, unknown>;
    return candidate.schemaVersion === STORAGE_SCHEMA_VERSION &&
      isMessageArry(candidate.messages)
      ? candidate.messages
      : null;
  } catch {
    return null;
  }
}

function parseLegacyMessages(raw: string): ChatMessage[] | null {
  try {
    const parsed: unknown = JSON.parse(raw);
    return isMessageArry(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function loadMessages(): InitialMessages {
  try {
    const currentRaw = localStorage.getItem(STORAGE_KEY);
    if (currentRaw !== null) {
      const messages = parseCurrentMessages(currentRaw);
      return messages === null
        ? {
            messages: [],
            storageWarning:
              "保存データが壊れていたため、空の履歴で開始しました。",
          }
        : {
            messages,
            storageWarning: null,
          };
    }

    const legacyRaw = localStorage.getItem(LEGACY_STORAGE_KEY);
    if (legacyRaw === null) return { messages: [], storageWarning: null };

    const Legacymessages = parseLegacyMessages(legacyRaw);
    return Legacymessages === null
      ? {
          messages: [],
          storageWarning:
            "旧形式の保存データが壊れていたため、空の履歴で開始しました。",
        }
      : {
          messages: Legacymessages,
          storageWarning: null,
        };
  } catch {
    return {
      messages: [],
      storageWarning:
        "保存データを読み込めなかったため、空の履歴で開始しました。",
    };
  }
}

export function saveMessages(messages: ChatMessage[]): void {
  if (!isMessageArry(messages)) return;

  const stored: StoredChatV2 = {
    schemaVersion: STORAGE_SCHEMA_VERSION,
    messages,
  };

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
  } catch {
    // 教材05で保存失敗を戻り値としてUIへ通知する形に整理する。
  }
}
