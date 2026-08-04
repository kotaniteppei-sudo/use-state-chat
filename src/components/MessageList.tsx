import type { ChatMessage } from "../types/chat";

export function MessageList({ message }: { message: ChatMessage | null }) {
  if (!message) {
    return <p className="no-message">メッセージはありません。</p>;
  }

  const formatDateTime = (date: string) => {
    return new Date(date).toLocaleString("ja-JP", {
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <section
      className="message-list"
      aria-label="メッセージ一覧"
      aria-live="polite"
    >
      <article id={message.id} className="message-card">
        <p className="message">{message.text}</p>
        <time className="sent-at" dateTime={message.sentAt}>
          {formatDateTime(message.sentAt)}
        </time>
      </article>
    </section>
  );
}
