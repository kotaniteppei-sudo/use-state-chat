"use client";

import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import type { PublicChatConfig } from "../model/PublicChatConfig";
import { validateMessageDraft } from "../model/messageDraft";

type Message = { id: string; text: string; sentAt: string };

const STORAGE_KEY = "training-stage2-chat-messages";
const LEGACY_STORAGE_KEY = "training-checkpoint-09-messages";

function isIsoDate(value: string): boolean {
  const parsed = new Date(value);
  return !Number.isNaN(parsed.valueOf()) && parsed.toISOString() === value;
}

function parseMessages(
  value: string,
  maxLength: number,
  migratedAt: string,
): Message[] {
  try {
    const parsed: unknown = JSON.parse(value);
    if (!Array.isArray(parsed)) return [];
    const messages: Message[] = [];
    for (const item of parsed) {
      if (typeof item !== "object" || item === null) return [];
      const candidate = item as Partial<Message>;
      const keys = Object.keys(item);
      const validShareFields =
        typeof candidate.id === "string" &&
        candidate.id.length > 0 &&
        typeof candidate.text === "string" &&
        candidate.text.trim() === candidate.text &&
        candidate.text.length <= maxLength;
      if (!validShareFields) return [];
      if (
        keys.length === 3 &&
        keys.every((key) => ["id", "text", "sentAt"].includes(key)) &&
        typeof candidate.sentAt === "string" &&
        isIsoDate(candidate.sentAt)
      ) {
        messages.push(candidate as Message);
        continue;
      }
      if (
        keys.length === 2 &&
        keys.every((key) => ["id", "text"].includes(key))
      ) {
        messages.push({
          id: candidate.id as string,
          text: candidate.text as string,
          sentAt: migratedAt,
        });
        continue;
      }
      return [];
    }
    return messages;
  } catch {
    return [];
  }
}

export function ChatFeature({ config }: { config: PublicChatConfig }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [draftMessage, setDraftMessage] = useState("");
  const [validationMessage, setValidationMessage] = useState<string | null>(
    null,
  );
  const [loaded, setLoaded] = useState(false);
  const [storageError, setStorageError] = useState(false);

  useEffect(() => {
    let active = true;
    let storedMessages: Message[] = [];
    try {
      const serialized =
        localStorage.getItem(STORAGE_KEY) ??
        localStorage.getItem(LEGACY_STORAGE_KEY);
      if (serialized) {
        storedMessages = parseMessages(
          serialized,
          config.maxMessageLength,
          new Date().toISOString(),
        );
      }
    } catch {
      queueMicrotask(() => {
        if (active) setStorageError(true);
      });
    }
    queueMicrotask(() => {
      if (!active) return;
      setMessages(storedMessages);
      setLoaded(true);
    });
    return () => {
      active = false;
    };
  }, [config.maxMessageLength]);

  useEffect(() => {
    if (!loaded) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
      localStorage.removeItem(LEGACY_STORAGE_KEY);
    } catch {
      queueMicrotask(() => setStorageError(true));
    }
  }, [loaded, messages]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const error = validateMessageDraft(draftMessage, config.maxMessageLength);

    setValidationMessage(error);
    if (error) return;

    setMessages((previous) => [
      ...previous,
      {
        id: crypto.randomUUID(),
        text: draftMessage.trim(),
        sentAt: new Date().toISOString(),
      },
    ]);
    setDraftMessage("");
  }

  return (
    <div className="chat-panel">
      <p>{messages.length}件のメッセージ</p>
      {storageError && <p role="alert">履歴を保存できませんでした。</p>}
      {messages.length === 0 ? (
        <p>メッセージはありません。</p>
      ) : (
        <ul>
          {messages.map((message) => {
            return <li key={message.id}>{message.text}</li>;
          })}
        </ul>
      )}
      <form onSubmit={handleSubmit}>
        <label htmlFor="message-draft">メッセージ</label>
        <textarea
          id="message-draft"
          aria-label="message-draft"
          value={draftMessage}
          maxLength={config.maxMessageLength + 1}
          aria-describedby={validationMessage ? "message-error" : undefined}
          onChange={(event) => setDraftMessage(event.target.value)}
        />
        {validationMessage && (
          <p id="message-error" role="alert">
            {validationMessage}
          </p>
        )}
        <button type="submit">送信</button>
      </form>
    </div>
  );
}
