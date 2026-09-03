"use client";

import { Alert, CircularProgress, Snackbar, Box } from "@mui/material";
import { useMemo, useRef, useState } from "react";
import { EmptyState } from "@/components/common/EmptyState";
import type { ChatMessage } from "../model/ChatMessage";
import type { PublicChatConfig } from "../model/PublicChatConfig";
import {
  filterMessages,
  removeMessage,
  replaceMessageText,
  validateMessage,
} from "../model/messageOperations";
import { ChatFilters } from "./ChatFilters";
import { ChatShell } from "./ChatShell";
import { DeleteMessageDialog } from "./DeleteMessageDialog";
import { MessageForm } from "./MessageForm";
import { MessageList } from "./MessageList";
import { MessageRepository } from "../services/messageRepository";
import { useStoredMessages } from "../hooks/useStoredMessages";
import { useChatUiStore } from "../store/ChatUiStoreProvider";
import { RoomControls } from "./RoomControls";

async function deliverLocally(): Promise<void> {}

export function ChatApp({
  config,
  repository,
  deliverMessage = deliverLocally,
}: {
  config: PublicChatConfig;
  repository: MessageRepository;
  deliverMessage?: (message: ChatMessage) => Promise<void>;
}) {
  const { loaded, messages, saveFailed, setMessages } =
    useStoredMessages(repository);
  const searchText = useChatUiStore((state) => state.searchText);
  const [draftMessage, setDraftMessage] = useState("");
  const [showDraftValidation, setShowDraftValidation] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const sendingRef = useRef(false);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState("");
  const [editingError, setEditingError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ChatMessage | null>(null);
  const [notification, setNotification] = useState<string | null>(null);
  const [deliveryError, setDeliveryError] = useState(false);

  const visibleMessages = useMemo(
    () => filterMessages(messages, searchText),
    [messages, searchText],
  );

  const draftValidationMessage = showDraftValidation
    ? validateMessage(draftMessage, config.maxMessageLength)
    : null;

  async function handleSend(): Promise<boolean> {
    if (sendingRef.current) return false;
    setShowDraftValidation(true);
    if (validateMessage(draftMessage, config.maxMessageLength)) return false;

    const message: ChatMessage = {
      id: crypto.randomUUID(),
      text: draftMessage.trim(),
      sentAt: new Date().toISOString(),
    };

    sendingRef.current = true;
    setIsSending(true);
    try {
      await deliverMessage(message);
      setMessages((previous) => [...previous, message]);
      setDraftMessage("");
      setShowDraftValidation(false);
      setNotification("メッセージを送信しました。");
      setDeliveryError(false);
      return true;
    } catch {
      setDeliveryError(true);
      return false;
    } finally {
      sendingRef.current = false;
      setIsSending(false);
    }
  }

  function startEditing(message: ChatMessage) {
    setEditingMessageId(message.id);
    setEditingText(message.text);
    setEditingError(null);
  }

  function cancelEditing() {
    setEditingMessageId(null);
    setEditingText("");
    setEditingError(null);
  }

  function saveEditing(id: string) {
    const validationError = validateMessage(
      editingText,
      config.maxMessageLength,
    );

    setEditingError(validationError);
    if (validationError) return;

    setMessages((previous) =>
      replaceMessageText(
        previous,
        id,
        editingText.trim(),
        new Date().toISOString(),
      ),
    );
    cancelEditing();
    setNotification("メッセージを更新しました。");
  }

  function confirmDelete() {
    if (!deleteTarget) return;
    setMessages((previous) => removeMessage(previous, deleteTarget.id));
    setDeleteTarget(null);

    setNotification("メッセージを削除しました。");
  }
  return (
    <ChatShell>
      <RoomControls />
      <ChatFilters messages={messages} />
      {deliveryError && (
        <Alert severity="error">メッセージを送信できませんでした。</Alert>
      )}
      {saveFailed && (
        <Alert severity="error">
          履歴を保存できませんでした。次の変更時に再試行します。
        </Alert>
      )}
      {!loaded ? (
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            minHeight: 100,
          }}
        >
          <CircularProgress aria-label="履歴を読み込み中" />
        </Box>
      ) : visibleMessages.length === 0 ? (
        <EmptyState />
      ) : (
        <MessageList
          messages={visibleMessages}
          editingMessageId={editingMessageId}
          editingText={editingText}
          editingError={editingError}
          onEditingTextChange={setEditingText}
          onStartEditing={startEditing}
          onCancelEditing={cancelEditing}
          onSaveEditing={saveEditing}
          onRequestDelete={setDeleteTarget}
        />
      )}
      <MessageForm
        draftMessage={draftMessage}
        validationMessage={draftValidationMessage}
        isSending={isSending}
        maxMessageLength={config.maxMessageLength}
        onDraftMessageChange={setDraftMessage}
        onSend={handleSend}
      />
      <DeleteMessageDialog
        messagePreview={deleteTarget?.text ?? null}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
      />
      <Snackbar
        open={notification !== null}
        autoHideDuration={3000}
        message={notification}
        onClose={() => setNotification(null)}
      />
    </ChatShell>
  );
}
