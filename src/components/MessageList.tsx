import type { ChatMessage } from "../types/chat";
import { MessageItem } from "./MessageItem";

type MessageListProps = {
  messages: ChatMessage[];
  editingMessageId: string | null;
  editingText: string;
  onEditingTextChange: (value: string) => void;
  onStartEditing: (message: ChatMessage) => void;
  onCancelEditing: () => void;
  onSaveEditing: (messageId: string) => void;
  onDelete: (messageId: string) => void;
};

export function MessageList(props: MessageListProps) {
  if (props.messages.length === 0) {
    return <p className="no-message">メッセージはありません。</p>;
  }

  return (
    <>
      <section
        className="message-list"
        aria-label="メッセージ一覧"
        aria-live="polite"
      >
        {props.messages.map((message) => (
          <MessageItem
            key={message.id}
            message={message}
            isEditing={props.editingMessageId === message.id}
            editingText={props.editingText}
            onEditingTextChange={props.onEditingTextChange}
            onStartEditing={props.onStartEditing}
            onCancelEditing={props.onCancelEditing}
            onSaveEditing={props.onSaveEditing}
            onDelete={props.onDelete}
          />
        ))}
      </section>
    </>
  );
}
