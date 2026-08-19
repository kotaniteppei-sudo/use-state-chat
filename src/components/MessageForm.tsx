import { useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { FormError } from "./FormError";
import {
  MESSAGE_MAX_LENGTH,
  validateMessage,
  normalizeMessage,
} from "../utils/validateMessage";

type MessageFormProps = {
  draftMessage: string;
  isSending: boolean;
  sendError: string | null;
  onDraftMessageChange: (value: string) => void;
  onSend: () => Promise<boolean>;
};

export function MessageForm({
  draftMessage,
  isSending,
  sendError,
  onDraftMessageChange,
  onSend,
}: MessageFormProps) {
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const validationMessage = validateMessage(draftMessage);
  const showValidationError = submitAttempted && validationMessage !== null;

  const describedBy = [
    "message-help",
    "message-count",
    showValidationError ? "message-error" : null,
    sendError === null ? null : "send-error",
  ]
    .filter((value): value is string => value !== null)
    .join(" ");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitAttempted(true);

    const succeeded = await onSend();
    if (succeeded) setSubmitAttempted(false);
    inputRef.current?.focus();
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.nativeEvent.isComposing) return;

    if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) {
      event.preventDefault();
      event.currentTarget.form?.requestSubmit();
    }
  }

  return (
    <form className="message-form" onSubmit={handleSubmit}>
      <label htmlFor="message-input" className="sr-only">
        メッセージ
      </label>
      <textarea
        ref={inputRef}
        id="message-input"
        aria-describedby={describedBy}
        aria-invalid={showValidationError}
        value={draftMessage}
        onChange={(event) => onDraftMessageChange(event.target.value)}
        onKeyDown={handleKeyDown}
      />
      <div className="form-meta">
        <output id="message-count" className="textCount" aria-live="off">
          {normalizeMessage(draftMessage).length} / {MESSAGE_MAX_LENGTH}
        </output>
        <p id="message-help">Enterで改行、Ctrl/Cmd + Enterで送信します。</p>
      </div>
      {showValidationError && validationMessage !== null ? (
        <FormError id="message-error">{validationMessage}</FormError>
      ) : null}
      {sendError === null ? null : (
        <FormError id="send-error">{sendError}</FormError>
      )}
      <button type="submit" disabled={isSending}>
        {isSending ? "送信中..." : "送信"}
      </button>
    </form>
  );
}
