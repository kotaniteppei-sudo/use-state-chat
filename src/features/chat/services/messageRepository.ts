import type { ChatMessage } from "../model/ChatMessage";

export type MessageRepository = {
  load: () => ChatMessage[];
  save: (messages: readonly ChatMessage[]) => boolean;
};
