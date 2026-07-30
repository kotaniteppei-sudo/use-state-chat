import type { ChatMessage } from "../types/chat";
import { MessageItem } from "./MessageItem";

type MessageListProps = {
  messages: ChatMessage[];
  emptyMessage: string;
};

export function MessageList({ messages, emptyMessage }: MessageListProps) {
  return (
    <section
      className="message-list"
      aria-label="メッセージ一覧"
      aria-live="polite"
    >
      {messages.length === 0 ? (
        <p className="empty-message">{emptyMessage}</p>
      ) : (
        messages.map((message) => (
          <MessageItem
            key={message.id}
            messageText={message.text}
            messageSentAt={message.sentAt}
          />
          // <MessageItem key={message.id} message={message} />
        ))
      )}
    </section>
  );
}
