import type { ChatMessage } from "../types/chat";
import { useAutoResizeTextarea } from "../utils/useAutoResizeTextarea";

type MessageItemProps = {
  message: ChatMessage;
  editingText: string;
  isEditing: boolean;
  onSaveEditing: (messageId: string) => void;
  onEditingTextChange: (value: string) => void;
  onStartEditing: (message: ChatMessage) => void;
  onCancelEditing: () => void;
  onDelete: (messageId: string) => void;
};

export function MessageItem(props: MessageItemProps) {
  const textareaRef = useAutoResizeTextarea(props.editingText);

  const formatDateTime = (date: string) => {
    return new Date(date).toLocaleString("ja-JP", {
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <article className={`message-card ${props.isEditing ? "editing" : ""}`}>
      {props.isEditing ? (
        <>
          <div className="wrap-text">
            <textarea
              className="message-textarea"
              value={props.editingText}
              onChange={(e) => props.onEditingTextChange(e.target.value)}
              maxLength={100}
              ref={textareaRef}
            />
            <p className="textCount">{props.editingText.length}/100</p>
          </div>
          <div className="wrap-button">
            <button
              className="button-save"
              type="button"
              onClick={() => props.onSaveEditing(props.message.id)}
            >
              保存
            </button>
            <button
              className="button-cancel"
              type="button"
              onClick={() => props.onCancelEditing()}
            >
              戻す
            </button>
          </div>
        </>
      ) : (
        <>
          <div className="wrap-text">
            <p className="message">{props.message.text}</p>
            <time className="sent-at" dateTime={props.message.sentAt}>
              {formatDateTime(props.message.sentAt)}
            </time>
            <time className="sent-at" dateTime={props.message.sentAtNew}>
              <span className="props.message-time">
                {props.message.isEdited
                  ? "(編集済) " + formatDateTime(props.message.sentAtNew)
                  : ""}
              </span>
            </time>
          </div>
          <div className="wrap-button">
            <button
              className="button-edit"
              type="button"
              onClick={() => props.onStartEditing(props.message)}
            >
              編集
            </button>
            <button
              className="button-delete"
              type="button"
              onClick={() => props.onDelete(props.message.id)}
            >
              削除
            </button>
          </div>
        </>
      )}
    </article>
  );
}
