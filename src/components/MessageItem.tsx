// import type { ChatMessage } from "../types/chat";

type MessageItemProps = {
  messageText: string;
  messageSentAt: string;
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

export function MessageItem({ messageText, messageSentAt }: MessageItemProps) {
  return (
    <article className="message-card">
      <p>{messageText}</p>
      <time className="sent-at" dateTime={messageSentAt}>
        {formatDateTime(messageSentAt)}
      </time>
    </article>
  );
}
