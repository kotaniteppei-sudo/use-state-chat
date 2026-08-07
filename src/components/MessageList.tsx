import { formatDateTime } from "../utils/formatDateTime";
import type { StorageData } from "../storage/chatStorage";

type MessageListProps = {
  storageData: StorageData | null;
};

export function MessageList({ storageData }: MessageListProps) {
  if (!storageData || storageData.versions.length === 0) {
    return (
      <section className="message-list">
        <article className="message-card">
          <p className="message">メッセージはありません。</p>
        </article>
      </section>
    );
  }

  const latestRecord = storageData.versions[storageData.versions.length - 1];

  return (
    <section
      className="message-list"
      aria-label="メッセージ一覧"
      aria-live="polite"
    >
      <div className="message-list-header"></div>
      {latestRecord.messages.map((message) => (
        <article key={message.id} id={message.id} className="message-card">
          <p className="message">{message.text}</p>
          <time className="sent-at" dateTime={message.sentAt}>
            {formatDateTime(message.sentAt)}
          </time>
        </article>
      ))}
    </section>
  );
}
