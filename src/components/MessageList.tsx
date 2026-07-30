import type { ChatMessage } from "../types/chat";
import { MessageItem } from "./MessageItem";

type MessageListProps = {
  messages: ChatMessage[];
};

export function MessageList({ messages }: MessageListProps) {
  return (
    <section
      className="message-list"
      aria-label="メッセージ一覧"
      aria-live="polite"
    >
      {messages.length === 0 ? (
        <p className="empty-message">メッセージはありません。</p>
      ) : (
        messages.map((message) => (
          <MessageItem key={message.id} message={message} />
        ))
      )}
    </section>
  );
}
