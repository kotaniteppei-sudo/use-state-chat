import { formatDateTime } from "../utils/formatDateTime";
import type { ChatMessage } from "../types/chat";

export function MessageList({ message }: { message: ChatMessage | null }) {
  if (!message) {
    return (
      <section className="message-list">
        <article className="message-card">
          <p className="message">メッセージはありません。</p>
        </article>
      </section>
    );
  }

  return (
    <section
      className="message-list"
      aria-label="メッセージ一覧"
      aria-live="polite"
    >
      <p>送信済メッセージ</p>
      <article id={message.id} className="message-card">
        <p className="message">{message.text}</p>
        <time className="sent-at" dateTime={message.sentAt}>
          {formatDateTime(message.sentAt)}
        </time>
      </article>
    </section>
  );
}
