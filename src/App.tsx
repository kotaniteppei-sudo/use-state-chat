import { useState, useEffect } from "react";
import "./App.css";
import { ChatHeader } from "./components/ChatHeader";
import { MessageForm } from "./components/MessageForm";
import { MessageList } from "./components/MessageList";
import type { ChatMessage } from "./types/chat";
import { MessageSearch } from "./components/MessageSearch";
import { SortOrder } from "./components/SortOrder";

const STORAGE_KEY = "simple-chat-messages";
type isOldest = "oldest" | "newest";

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
  const [draftMessage, setDraftMessage] = useState<string>("");
  const [messages, setMessages] = useState<ChatMessage[]>(loadMessages);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState<string>("");
  const [searchText, setSearchText] = useState<string>("");
  const [order, setOrder] = useState<isOldest>("oldest");

  const normalizedSearchText = searchText.trim().toLocaleLowerCase("ja-JP");
  const filteredMessages = messages.filter((message) =>
    message.text.toLocaleLowerCase("ja-JP").includes(normalizedSearchText),
  );

  const visibleMessages = [...filteredMessages].sort((a, b) => {
    const timeA = new Date(a.sentAt).getTime();
    const timeB = new Date(b.sentAt).getTime();

    return order === "oldest" ? timeA - timeB : timeB - timeA;
  });

  useEffect(() => {
    saveMessages(messages);
  }, [messages]);

  function handleSend() {
    const trimmedMessage = draftMessage.trim();
    if (trimmedMessage === "") return;

    const newMessage: ChatMessage = {
      id: Math.random().toString(36).substring(2, 7),
      text: trimmedMessage,
      sentAt: new Date().toISOString(),
      sentAtNew: "",
    };

    setMessages((previousMessages) => [...previousMessages, newMessage]);
    setDraftMessage("");
  }

  function startEditing(message: ChatMessage) {
    setEditingMessageId(message.id);
    setEditingText(message.text);
  }

  function cancelEditing() {
    setEditingMessageId(null);
    setEditingText("");
  }

  function saveEditing(messageId: string) {
    const nextText = editingText.trim();
    if (nextText === "") return;

    setMessages((previous) =>
      previous.map((message) =>
        message.id === messageId
          ? {
              ...message,
              text: nextText,
              sentAtNew: new Date().toISOString(),
              isEdited: true,
            }
          : message,
      ),
    );
    cancelEditing();
  }

  function deleteMessage(messageId: string) {
    if (!window.confirm("このメッセージを削除しますか？")) return;

    setMessages((previousMessages) =>
      previousMessages.filter((message) => message.id !== messageId),
    );
  }

  function deleteAllMessages() {
    if (!window.confirm("全てのメッセージを削除しますか？")) return;
    if (!window.confirm("削除を実行します ")) return;

    setMessages([]);
  }

  function toggleOrder() {
    setOrder((currentOrder) =>
      currentOrder === "oldest" ? "newest" : "oldest",
    );
  }

  return (
    <>
      <ChatHeader onDeleteAll={deleteAllMessages} />
      <div className="sub-header">
        <SortOrder toggleOrder={toggleOrder} order={order} />
        <MessageSearch
          searchText={searchText}
          onSearchTextChange={setSearchText}
          totalCount={messages.length}
          filteredCount={visibleMessages.length}
        />
      </div>
      <main className="chat-app">
        <MessageList
          messages={visibleMessages}
          editingMessageId={editingMessageId}
          editingText={editingText}
          onEditingTextChange={setEditingText}
          onStartEditing={startEditing}
          onCancelEditing={cancelEditing}
          onSaveEditing={saveEditing}
          onDelete={deleteMessage}
        />
        <MessageForm
          draftMessage={draftMessage}
          onDraftMessageChange={setDraftMessage}
          onSend={handleSend}
        />
      </main>
    </>
  );
}
