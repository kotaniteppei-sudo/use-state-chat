import type { ChatMessage } from "../types/chat";

export const STORAGE_SCHEMA_VERSION = 2 as const;
export const STORAGE_KEY = "training-chat:v2";
export const LEGACY_STORAGE_KEY = "training-chat:v1";

type StoredChatV2 = {
  schemaVersion: typeof STORAGE_SCHEMA_VERSION;
  messages: ChatMessage[];
};

type ReadableStorage = Pick<Storage, "getItem">;
type WritableStorage = Pick<Storage, "setItem" | "removeItem">;

export type LoadMessagesResult =
  | { status: "success"; messages: ChatMessage[] }
  | { status: "missing"; messages: [] }
  | { status: "invalid"; messages: [] }
  | { status: "unavailable"; messages: [] };

function browserStorage(): Storage | null {
  try {
    return typeof window === "undefined" ? null : window.localStorage;
  } catch (error: unknown) {
    console.error("ブラウザー保存領域を取得できませんでした。", error);
    return null;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isIsoDate(value: string): boolean {
  const parsed = new Date(value);
  return !Number.isNaN(parsed.valueOf()) && parsed.toISOString() === value;
}

export function isChatMessage(value: unknown): value is ChatMessage {
  if (!isRecord(value)) return false;

  const editedAtIsValid =
    value.editedAt === undefined ||
    (typeof value.editedAt === "string" && isIsoDate(value.editedAt));

  return (
    typeof value.id === "string" &&
    value.id.length > 0 &&
    typeof value.text === "string" &&
    value.text.trim() === value.text &&
    value.text.length > 0 &&
    typeof value.sentAt === "string" &&
    isIsoDate(value.sentAt) &&
    editedAtIsValid
  );
}

function isMessageArray(value: unknown): value is ChatMessage[] {
  if (!Array.isArray(value) || !value.every(isChatMessage)) return false;
  return new Set(value.map((message) => message.id)).size === value.length;
}

export function parseMessages(raw: string): LoadMessagesResult {
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!isRecord(parsed)) return { status: "invalid", messages: [] };
    if (
      parsed.schemaVersion !== STORAGE_SCHEMA_VERSION ||
      !isMessageArray(parsed.messages)
    ) {
      return { status: "invalid", messages: [] };
    }

    return { status: "success", messages: parsed.messages };
  } catch {
    return { status: "invalid", messages: [] };
  }
}

function parseLegacyMessages(raw: string): LoadMessagesResult {
  try {
    const parsed: unknown = JSON.parse(raw);
    return isMessageArray(parsed)
      ? { status: "success", messages: parsed }
      : { status: "invalid", messages: [] };
  } catch {
    return { status: "invalid", messages: [] };
  }
}

export function loadMessages(
  storage: ReadableStorage | null = browserStorage(),
): LoadMessagesResult {
  if (storage === null) return { status: "unavailable", messages: [] };

  try {
    const currentRaw = storage.getItem(STORAGE_KEY);
    if (currentRaw !== null) return parseMessages(currentRaw);

    const legacyRaw = storage.getItem(LEGACY_STORAGE_KEY);
    return legacyRaw === null
      ? { status: "missing", messages: [] }
      : parseLegacyMessages(legacyRaw);
  } catch (error: unknown) {
    console.error("メッセージ履歴の読み込みに失敗しました。", error);
    return { status: "unavailable", messages: [] };
  }
}

export function saveMessages(
  messages: ChatMessage[],
  storage: WritableStorage | null = browserStorage(),
): boolean {
  if (storage === null || !isMessageArray(messages)) return false;

  const stored: StoredChatV2 = {
    schemaVersion: STORAGE_SCHEMA_VERSION,
    messages,
  };

  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(stored));
    return true;
  } catch (error: unknown) {
    console.error("メッセージ履歴の保存に失敗しました。", error);
    return false;
  }
}

export function clearMessages(
  storage: WritableStorage | null = browserStorage(),
): boolean {
  if (storage === null) return false;

  try {
    storage.removeItem(STORAGE_KEY);
    storage.removeItem(LEGACY_STORAGE_KEY);
    return true;
  } catch (error: unknown) {
    console.error("メッセージ履歴の削除に失敗しました。", error);
    return false;
  }
}
