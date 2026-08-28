"use client";

import { Alert, Snackbar } from "@mui/material";
import { useEffect, useMemo, useRef, useState } from "react";
import { EmptyState } from "@/components/common/EmptyState";
import type { ChatMessage } from "../model/ChatMessage";
import type { PublicChatConfig } from "../model/PublicChatConfig";
import {
  filterMessages,
  removeMessage,
  replaceMessageText,
  validateMessage,
} from "../model/messageOperations";
import {
  loadStoredMessages,
  saveStoredMessages,
} from "../services/storedMessages";
import { ChatFilters } from "./ChatFilters";
import { ChatShell } from "./ChatShell";
import { DeleteMessageDialog } from "./DeleteMessageDialog";
import { MessageForm } from "./MessageForm";
import { MessageList } from "./MessageList";

async function deliverLocally(): Promise<void> {}

export function ChatApp({
  config,
  deliverMessage = deliverLocally,
}: {
  config: PublicChatConfig;
  deliverMessage?: (message: ChatMessage) => Promise<void>;
}) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [searchText, setSearchText] = useState("");
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
  const [loaded, setLoaded] = useState(false);
  const [storageError, setStorageError] = useState(false);

  useEffect(() => {
    let active = true;
    let storedMessages: ChatMessage[] = [];

    try {
      storedMessages = loadStoredMessages(
        localStorage,
        config.maxMessageLength,
        new Date().toISOString(),
      );
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
      saveStoredMessages(localStorage, messages);
    } catch {
      queueMicrotask(() => setStorageError(true));
    }
  }, [loaded, messages]);

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

    setDeliveryError(false);

    try {
      await deliverMessage(message);

      setMessages((previous) => [...previous, message]);
      setDraftMessage("");
      setShowDraftValidation(false);
      setNotification("メッセージを送信しました。");
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
      <ChatFilters
        messages={messages}
        searchText={searchText}
        onSearchTextChange={setSearchText}
      />
      {deliveryError && (
        <Alert severity="error">メッセージを送信できませんでした。</Alert>
      )}
      {storageError && (
        <>
          <Alert severity="error">履歴を保存できませんでした。</Alert>

          <Snackbar open={true} message="メッセージを送信しました。" />
        </>
      )}

      {visibleMessages.length === 0 ? (
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
