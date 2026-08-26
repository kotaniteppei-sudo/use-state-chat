import type { Metadata } from "next";
import { ChatFeature } from "@/features/chat/";
import { PublicChatConfig } from "@/features/chat/model/PublicChatConfig";
import { getServerConfig } from "@/lib/server/appConfig";

export const metadata: Metadata = {
  title: "Training Chat",
};

export default function ChatPage() {
  getServerConfig();

  const config: PublicChatConfig = {
    appName: process.env.NEXT_PUBLIC_APP_NAME ?? "Training Chat",
    maxMessageLength: 200,
  };

  return (
    <section aria-labelledby="chat-title">
      <h1 id="chat-title">{config.appName}</h1>
      <p>公開設定だけをClient Componentへ渡しています。</p>
      <ChatFeature config={config} />
    </section>
  );
}
