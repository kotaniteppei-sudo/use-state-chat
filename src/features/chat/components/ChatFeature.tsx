"use client";

import type { PublicChatConfig } from "../model/PublicChatConfig";
import { localMessageRepository } from "../services/localMessageRepository";
import { ChatUiStoreProvider } from "../store/ChatUiStoreProvider";
import { ChatApp } from "./ChatApp";

export function ChatFeature({ config }: { config: PublicChatConfig }) {
  return (
    <ChatUiStoreProvider>
      <ChatApp config={config} repository={localMessageRepository} />
    </ChatUiStoreProvider>
  );
}
