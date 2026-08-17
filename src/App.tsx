import { useMemo, useState } from "react";
import { ChatHeader } from "./components/ChatHeader";
import { MessageForm } from "./components/MessageForm";
import { MessageList } from "./components/MessageList";
import { MessageSearch } from "./components/MessageSearch";
import { useStoredMessages } from "./hooks/useStoredMessages";
import type { ChatMessage } from "./types/chat";
import { createMessage } from "./utils/createMessage";
import { normalizeMessage, validateMessage } from "./utils/validateMessage";

export default function App() {
  const { messages, setMessages, loadStatus, saveFailed } = useStoredMessages();
  const [draftMessage, setDraftMessage] = useState("");
  const [searchText, setSearchText] = useState("");
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState("");

  const normalizedSearchText = searchText.trim().toLocaleLowerCase("ja-JP");
  const visibleMessages = useMemo(
    () =>
      messages.filter((message) =>
        message.text.toLocaleLowerCase("ja-JP").includes(normalizedSearchText),
      ),
    [messages, normalizedSearchText],
  );

  function handleSend(): boolean {
    if (validateMessage(draftMessage) !== null) return false;
    const normalized = normalizeMessage(draftMessage);

    setMessages((current) => [...current, createMessage(normalized)]);
    setDraftMessage("");
    return true;
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
    const text = editingText.trim();
    if (text.length === 0) return;
    setMessages((current) =>
      current.map((message) =>
        message.id === messageId
          ? { ...message, text, editedAt: new Date().toISOString() }
          : message,
      ),
    );
    cancelEditing();
  }

  function deleteMessage(messageId: string) {
    if (!window.confirm("このメッセージを削除しますか？")) return;
    setMessages((current) =>
      current.filter((message) => message.id !== messageId),
    );
    if (editingMessageId === messageId) cancelEditing();
  }

  return (
    <main className="chat-app">
      <ChatHeader messageCount={messages.length} />

      {loadStatus === "invalid" ? (
        <p className="notice" role="alert">
          保存データが壊れていたため、安全な空の履歴で開始しました。
        </p>
      ) : null}
      {loadStatus === "unavailable" || saveFailed ? (
        <p className="notice" role="alert">
          ブラウザーへ履歴を保存できません。画面上の操作は続けられます。
        </p>
      ) : null}

      <MessageSearch
        value={searchText}
        visibleCount={visibleMessages.length}
        totalCount={messages.length}
        onChange={setSearchText}
      />
      <MessageList
        messages={visibleMessages}
        editingMessageId={editingMessageId}
        editingText={editingText}
        hasSearch={normalizedSearchText.length > 0}
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
  );
}
