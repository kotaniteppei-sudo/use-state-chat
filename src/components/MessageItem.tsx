import type { ChatMessage } from "../types/chat";
import { validateMessage } from "../utils/validateMessage";

type MessageItemProps = {
  message: ChatMessage;
  isEditing: boolean;
  editingText: string;
  onEditingTextChange: (value: string) => void;
  onStartEditing: (message: ChatMessage) => void;
  onCancelEditing: () => void;
  onSaveEditing: (messageId: string) => void;
  onDelete: (messageId: string) => void;
};

function formatDateTime(isoString: string): string {
  const date = new Date(isoString);
  if (isNaN(date.getTime())) return "";

  const fotmatter = new Intl.DateTimeFormat("ja-JP-u-ca-japanese", {
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
  });

  const parts = fotmatter.formatToParts(date);
  return (
    parts
      .map((part) => {
        if (part.type === "literal" && part.value.trim() === ":") {
          return "時";
        }
        return part.value;
      })
      .join("") + "分"
  );
}

export function MessageItem({
  message,
  isEditing,
  editingText,
  onEditingTextChange,
  onStartEditing,
  onCancelEditing,
  onSaveEditing,
  onDelete,
}: MessageItemProps) {
  const editingError = validateMessage(editingText);

  return (
    <article className="message-card">
      {isEditing ? (
        <>
          <label htmlFor={`edit-${message.id}`}>本文を編集</label>
          <textarea
            id={`edit-${message.id}`}
            value={editingText}
            onChange={(event) => onEditingTextChange(event.target.value)}
          />
          {editingError === null ? null : (
            <p className="edit-help">{editingError}</p>
          )}
          <div className="message-actions">
            <button
              type="button"
              disabled={editingError !== null}
              onClick={() => onSaveEditing(message.id)}
            >
              保存
            </button>
            <button type="button" onClick={onCancelEditing}>
              取消
            </button>
          </div>
        </>
      ) : (
        <>
          <p>{message.text}</p>
          <div className="message-meta">
            <time dateTime={message.sentAt}>
              {formatDateTime(message.sentAt)}
            </time>
            {message.editedAt === undefined ? null : <span>編集済み</span>}
          </div>
          <div className="message-actions">
            <button type="button" onClick={() => onStartEditing(message)}>
              編集
            </button>
            <button type="button" onClick={() => onDelete(message.id)}>
              削除
            </button>
          </div>
        </>
      )}
    </article>
  );
}
