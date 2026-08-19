import { MessageItem } from "./MessageItem";
import type { ChatMessage } from "../types/chat";

type MessageListProps = {
  messages: ChatMessage[];
  editingMessageId: string | null;
  editingText: string;
  hasSearch: boolean;
  onEditingTextChange: (value: string) => void;
  onStartEditing: (message: ChatMessage) => void;
  onCancelEditing: () => void;
  onSaveEditing: (messageId: string) => void;
  onDelete: (messageId: string) => void;
};
export function MessageList({
  messages,
  editingMessageId,
  editingText,
  hasSearch,
  onEditingTextChange,
  onStartEditing,
  onCancelEditing,
  onSaveEditing,
  onDelete,
}: MessageListProps) {
  return (
    <section className="message-list" aria-label="メッセージ一覧">
      {messages.length === 0 ? (
        <p className="empty-message">
          {hasSearch
            ? "検索条件に一致するメッセージはありません。"
            : "まだメッセージはありません。"}
        </p>
      ) : (
        messages.map((message) => (
          <MessageItem
            key={message.id}
            message={message}
            isEditing={editingMessageId === message.id}
            editingText={editingText}
            onEditingTextChange={onEditingTextChange}
            onStartEditing={onStartEditing}
            onCancelEditing={onCancelEditing}
            onSaveEditing={onSaveEditing}
            onDelete={onDelete}
          />
        ))
      )}
    </section>
  );
}
