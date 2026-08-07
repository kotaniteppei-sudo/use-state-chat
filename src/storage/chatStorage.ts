import type { ChatMessage } from "../types/chat";
export const STORAGE_KEY = "training-chat:v1";
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
function hasUniqueMessageIds(messages: ChatMessage[]): boolean {
  return (
    new Set(messages.map((message) => message.id)).size === messages.length
  );
}
export function loadMessages(): InitialMessages {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === null) return { messages: [], storageWarning: null };
    const parsed: unknown = JSON.parse(raw);
    if (
      !Array.isArray(parsed) ||
      !parsed.every(isChatMessage) ||
      !hasUniqueMessageIds(parsed)
    ) {
      return {
        messages: [],
        storageWarning: "保存データが壊れていたため、空の履歴で開始しました。",
      };
    }
    return { messages: parsed, storageWarning: null };
  } catch {
    return {
      messages: [],
      storageWarning:
        "保存データを読み込めなかったため、空の履歴で開始しました。",
    };
  }
}
export function saveMessages(messages: ChatMessage[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
  } catch {
    // 教材05で保存失敗を戻り値としてUIへ通知する形に整理する。
  }
}
