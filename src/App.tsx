import { useState, useEffect } from "react";
import type { FormEvent } from "react";
import "./App.css";

type ChatMessage = {
  id: string;
  text: string;
  sentAt: string;
};

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

function formatDateTime(isoString: string): string {
  return new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(new Date(isoString));
}

export default function App() {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>(loadMessages);

  useEffect(() => {
    savedMessages(messages);
  }, [messages]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedMessage = message.trim();

    if (trimmedMessage === "") {
      return;
    }

    const newMessage: ChatMessage = {
      id: crypto.randomUUID(),
      text: trimmedMessage,
      sentAt: new Date().toISOString(),
    };

    setMessages((previousMessages) => [...previousMessages, newMessage]);
    setMessage("");
  }

  return (
    <main className="chat-app">
      <header className="chat-header">
        <h1>かんたんチャット</h1>
        <div>
          <p>メッセージの変更をブラウザへ保存します。</p>
          <button onClick={() => setMessages([])}>履歴を全て削除</button>
        </div>
      </header>

      <section
        className="message-list"
        aria-label="メッセージ一覧"
        aria-live="polite"
      >
        {messages.length === 0 ? (
          <p className="empty-message">まだメッセージはありません。</p>
        ) : (
          messages.map((item) => (
            <article className="message-card" key={item.id}>
              <p>{item.text}</p>
              <time className="sent-at" dateTime={item.sentAt}>
                {formatDateTime(item.sentAt)}
              </time>
            </article>
          ))
        )}
      </section>

      <form className="message-form" onSubmit={handleSubmit}>
        <label className="sr-only" htmlFor="message">
          メッセージ
        </label>
        <div>
          <input
            id="message"
            type="text"
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            placeholder="メッセージを入力"
            autoComplete="off"
            maxLength={100}
          />
          <p>{message.length}/100</p>
        </div>
        <button type="submit">送信</button>
      </form>
    </main>
  );
}
