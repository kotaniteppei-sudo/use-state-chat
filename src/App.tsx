import { useMemo, useState, useRef } from "react";
import { ChatHeader } from "./components/ChatHeader";
import { MessageForm } from "./components/MessageForm";
import { MessageList } from "./components/MessageList";
import { MessageSearch } from "./components/MessageSearch";
import { useStoredMessages } from "./hooks/useStoredMessages";
import type { ChatMessage } from "./types/chat";
import { createMessage } from "./utils/createMessage";
import { normalizeMessage, validateMessage } from "./utils/validateMessage";
import { saveMockMessage, type MockMode } from "./api/fakeMessageApi";
import { MockApiPanel } from "./components/MockApiPanel";
import { useMessageHistory } from "./hooks/useMessageHistory";

export default function App() {
  const { messages, setMessages, loadStatus, saveFailed } = useStoredMessages();
  const [draftMessage, setDraftMessage] = useState("");
  const [searchText, setSearchText] = useState("");
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [failNextSend, setFailNextSend] = useState(false);
  const [mockMode, setMockMode] = useState<MockMode>("success");
  const sendingGuard = useRef(false);
  const { state: historyState, retry } = useMessageHistory(mockMode);

  const normalizedSearchText = searchText.trim().toLocaleLowerCase("ja-JP");
  const visibleMessages = useMemo(
    () =>
      messages.filter((message) =>
        message.text.toLocaleLowerCase("ja-JP").includes(normalizedSearchText),
      ),
    [messages, normalizedSearchText],
  );

  async function handleSend(): Promise<boolean> {
    if (sendingGuard.current || validateMessage(draftMessage) !== null) {
      return false;
    }

    sendingGuard.current = true;
    setIsSending(true);
    setSendError(null);
    const shouldFail = failNextSend;
    if (shouldFail) setFailNextSend(false);

    try {
      const newMessage = createMessage(normalizeMessage(draftMessage));
      const saved = await saveMockMessage(
        newMessage,
        undefined,
        shouldFail ? "error" : "success",
      );
      setMessages((current) => [...current, saved]);
      setDraftMessage("");
      return true;
    } catch (error: unknown) {
      console.error("送信に失敗しました。", error);
      setSendError("送信できませんでした。入力を残したまま再試行できます。");
      return false;
    } finally {
      sendingGuard.current = false;
      setIsSending(false);
    }
  }

  function deleteMessage(messageId: string) {
    if (!window.confirm("このメッセージを削除しますか？")) return;
    setMessages((current) =>
      current.filter((message) => message.id !== messageId),
    );
    if (editingMessageId === messageId) cancelEditing();
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

  return (
    <main className="page-shell">
      <section className="chat-app">
        <ChatHeader messageCount={messages.length} />
        <span className="sr-only" id="app-title">
          かんたんチャット
        </span>

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
        <label className="failure-toggle">
          <input
            type="checkbox"
            checked={failNextSend}
            onChange={(event) => setFailNextSend(event.target.checked)}
          />
          次の送信を失敗させる（教材用）
        </label>
        <MessageForm
          draftMessage={draftMessage}
          isSending={isSending}
          sendError={sendError}
          onDraftMessageChange={setDraftMessage}
          onSend={handleSend}
        />
      </section>
      <MockApiPanel
        mode={mockMode}
        state={historyState}
        onModeChange={setMockMode}
        onRetry={retry}
      />
    </main>
  );
}
