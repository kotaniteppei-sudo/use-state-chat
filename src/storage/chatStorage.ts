import type { ChatMessage } from "../types/chat";

const STORAGE_KEY = "chat-sync-storage";

export type VersionRecord = {
  version: number;
  updateAt: string;
  messages: ChatMessage[];
};

export type StorageData = {
  currentVersion: number;
  versions: VersionRecord[];
};

export function loadStorageData(): StorageData | null {
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (raw === null) return null;

  try {
    const parsed: unknown = JSON.parse(raw);
    if (isStorageData(parsed)) {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}

function isVersionRecord(value: unknown): value is VersionRecord {
  if (typeof value !== "object" || value === null) return false;
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.version === "number" &&
    typeof candidate.updateAt === "string" &&
    isChatMessageArray(candidate.messages)
  );
}

// jsonデータの型をチェック
function isStorageData(value: unknown): value is StorageData {
  if (typeof value !== "object" || value === null) return false;
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.currentVersion === "number" &&
    Array.isArray(candidate.versions) &&
    candidate.versions.every(isVersionRecord)
  );
}

// messagesが配列だったら、各メッセージをisChatMessage()へ渡す
export function isChatMessageArray(value: unknown): value is ChatMessage[] {
  return Array.isArray(value) && value.every(isChatMessage);
}

// messageを受け取り、持っているプロパティと型が正しいかチェック
function isChatMessage(value: unknown): value is ChatMessage {
  if (typeof value !== "object" || value === null) return false;

  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.id === "string" &&
    typeof candidate.text === "string" &&
    typeof candidate.sentAt === "string"
  );
}

// useEffect:更新されたmessagesデータをJSONに変換後localStorageに保存。成功可否でbooleanを返す
export function saveStorageData(data: StorageData): boolean {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    return true;
  } catch (error) {
    console.error("メッセージの履歴の保存に失敗しました", error);
    return false;
  }
}

// localStorageを空にする
export function clearMessages(): void {
  window.localStorage.removeItem(STORAGE_KEY);
}
