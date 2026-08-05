import { useState, useRef, type FormEvent } from "react";
import { validateMessages } from "../utils/validateMessages";
import { FormAlert } from "./FormAlert";

type MessageFormProps = {
  draftMessage: string;
  onDraftMessageChange: (value: string) => void;
  onSend: () => void;
};

export function MessageForm(props: MessageFormProps) {
  // フォームのバリデーション
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const validationResult = validateMessages(
    props.draftMessage,
    submitAttempted,
  );

  // 送信通知
  const [statusMessage, setStatusMessage] = useState("");
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitAttempted(true);

    if (!validationResult.canSubmit) return;

    props.onSend();
    setSubmitAttempted(false);

    setStatusMessage("メッセージを送信しました");

    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      setStatusMessage("");
    }, 3000);
  }

  return (
    <>
      <form className="message-form" onSubmit={handleSubmit} noValidate>
        <label className="sr-only" htmlFor="message-input">
          メッセージ
        </label>
        <textarea
          id="message-input"
          aria-invalid={validationResult.hasError}
          aria-describedby="message-help message-error"
          value={props.draftMessage}
          onChange={(event) => props.onDraftMessageChange(event.target.value)}
          placeholder="200文字まで入力可能"
        />
        <p className="textCount" aria-live="polite">
          {props.draftMessage.length}/200文字{" "}
        </p>
        <div
          role="status"
          aria-live="polite"
          aria-atomic="true"
          // className="sr-only"
        >
          {statusMessage}
        </div>
        <FormAlert id="message-error" message={validationResult.message} />
        <button type="submit">送信</button>
      </form>
    </>
  );
}
