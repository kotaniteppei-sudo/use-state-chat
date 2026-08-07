import type { ChatMessage } from "../types/chat";
function createId(): string {
  if (typeof globalThis.crypto?.randomUUID === "function") {
    return globalThis.crypto.randomUUID();
  }
  return `message-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}
export function createMessage(text: string, now = new Date()): ChatMessage {
  return {
    id: createId(),
    text,
    sentAt: now.toISOString(),
  };
}
