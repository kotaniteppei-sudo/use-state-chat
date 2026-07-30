import type { ChatMessage } from "../types/chat";

type MessageItemProps = {
  message: ChatMessage;
};

function formatDateTime(isoString: string): string {
  return new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(new Date(isoString));
}

export function MessageItem({ message }: MessageItemProps) {
  return (
    <article className="message-card">
      <p>{message.text}</p>
      <time className="sent-at" dateTime={message.sentAt}>
        {formatDateTime(message.sentAt)}
      </time>
    </article>
  );
}
