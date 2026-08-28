"use client";

import type { PublicChatConfig } from "../model/PublicChatConfig";
import { ChatApp } from "./ChatApp";

export function ChatFeature({ config }: { config: PublicChatConfig }) {
  return <ChatApp config={config} />;
}
