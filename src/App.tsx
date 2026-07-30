import { useState, useEffect } from "react";
import "./App.css";
import { ChatHeader } from "./components/ChatHeader";
import { MessageForm } from "./components/MessageForm";
import { MessageList } from "./components/MessageList";
import type { ChatMessage } from "./types/chat"; // ブラウザでは使わない=TypeScript用のため分離

const STORAGE_KEY = "simple-chat-messages";

function loadMessages(): ChatMessage[] {
  try {
    const savedMessages = localStorage.getItem(STORAGE_KEY);

    if (savedMessages === null) {
      return [];
    }

    const parsedMessages: unknown = JSON.parse(savedMessages);

    return Array.isArray(parsedMessages)
      ? (parsedMessages as ChatMessage[])
      : [];
  } catch (error) {
    console.error("チャット履歴の読み込みに失敗しました。", error);
    return [];
  }
}

function saveMessages(messages: ChatMessage[]): void {
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
    saveMessages(messages);
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
      <ChatHeader messageNum={messages.length} />
      <MessageList messages={messages} emptyMessage="これで合ってるのか" />
      <MessageForm
        draftMessage={draftMessage}
        onDraftMessageChange={setDraftMessage}
        onSend={handleSend}
      />
    </main>
  );
}
