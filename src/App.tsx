import { useState, useEffect } from "react";
import "./App.css";
import type { ChatMessage } from "./types/chat";
import { MessageForm } from "./components/MessageForm";
import { MessageList } from "./components/MessageList";

const STORAGE_KEY = "simple-chat-messages";

function loadMessage(): ChatMessage | null {
  try {
    const savedMessage = localStorage.getItem(STORAGE_KEY);
    if (savedMessage === null) {
      return null;
    }
    const parsedMessage: unknown = JSON.parse(savedMessage);

    return parsedMessage as ChatMessage;
  } catch (error) {
    console.error("履歴の読み込みに失敗しました。", error);
    return null;
  }
}

function saveMessage(message: ChatMessage | null): void {
  try {
    if (message === null) {
      localStorage.removeItem(STORAGE_KEY);
      return;
    }
    const json = JSON.stringify(message);
    localStorage.setItem(STORAGE_KEY, json);
  } catch (error) {
    console.error("履歴の保存に失敗しました", error);
  }
}

export default function App() {
  const [draftMessage, setDraftMessage] = useState<string>("");
  const [message, setMessage] = useState<ChatMessage | null>(loadMessage);

  useEffect(() => {
    saveMessage(message);
  }, [message]);

  function handleSend() {
    const trimmedMessage = draftMessage.trim();
    if (trimmedMessage === "") return;

    const newMessage: ChatMessage = {
      id: Math.random().toString(36).substring(2, 7),
      text: trimmedMessage,
      sentAt: new Date().toISOString(),
    };

    setMessage(newMessage);
    setDraftMessage("");
  }

  return (
    <>
      <main className="chat-app">
        <MessageList message={message} />
        <MessageForm
          draftMessage={draftMessage}
          onDraftMessageChange={setDraftMessage}
          onSend={handleSend}
        />
      </main>
    </>
  );
}
