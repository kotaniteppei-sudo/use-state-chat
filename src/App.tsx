import "./App.css";
import { useState, useEffect } from "react";
import type { ChatMessage } from "./types/chat";
import { ChatHeader } from "./compornents/ChatHeader";
import { MessageList } from "./compornents/MessageList";
import { MessageForm } from "./compornents/MessageForm";

function isChatMessage(arg: unknown): arg is ChatMessage {
  return (
    arg !== null &&
    typeof arg === "object" &&
    "id" in arg &&
    typeof (arg as Record<string, unknown>).id === "string" &&
    "text" in arg &&
    typeof (arg as Record<string, unknown>).text === "string" &&
    "sentAt" in arg &&
    typeof (arg as Record<string, unknown>).sentAt === "string"
  );
}

const STORAGE_KEY = "simple-chat-messages";

function loadMessages(): ChatMessage[] {
  try {
    const savedMessages = localStorage.getItem(STORAGE_KEY);

    if (savedMessages === null) {
      return [];
    }

    const parsedJson = JSON.parse(savedMessages);
    if (!Array.isArray(parsedJson)) return [];

    const validMessages = parsedJson.filter(isChatMessage);

    if (validMessages.length !== parsedJson.length) {
      console.error("一部のチャット履歴が読み込めませんでした。");
    }

    return validMessages;
  } catch (error) {
    console.error("チャット履歴の読み込みに失敗しました。", error);
    return [];
  }
}

function savedMessages(messages: ChatMessage[]): void {
  try {
    const json = JSON.stringify(messages);
    localStorage.setItem(STORAGE_KEY, json);
  } catch (error) {
    console.error("履歴の保存に失敗しました", error);
  }
}

export default function App() {
  const [draftMessage, setDraftMessage] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>(loadMessages);

  useEffect(() => {
    savedMessages(messages);
  }, [messages]);

  function handleSend() {
    const trimmedMessage = draftMessage.trim();

    if (trimmedMessage === "") {
      return;
    }

    const newMessage: ChatMessage = {
      id: crypto.randomUUID(),
      text: trimmedMessage,
      sentAt: new Date().toISOString(),
    };

    setMessages((previousMessages) => [...previousMessages, newMessage]);
    setDraftMessage("");
  }

  return (
    <main className="chat-app">
      <ChatHeader />
      <MessageList messages={messages} />
      <MessageForm
        draftMessage={draftMessage}
        onDraftMessageChange={setDraftMessage}
        onSend={handleSend}
      />
    </main>
  );
}
