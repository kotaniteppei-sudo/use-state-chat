import type { FormEvent } from "react";

type MessageFormProps = {
  draftMessage: string;
  onDraftMessageChange: (value: string) => void;
  onSend: () => void;
};

export function MessageForm({
  draftMessage,
  onDraftMessageChange,
  onSend,
}: MessageFormProps) {
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSend();
  }

  return (
    <form className="message-form" onSubmit={handleSubmit}>
      <label className="sr-only" htmlFor="message">
        メッセージ
      </label>
      <div>
        <input
          id="message"
          type="text"
          value={draftMessage}
          onChange={(event) => onDraftMessageChange(event.target.value)}
          placeholder="メッセージを入力"
          autoComplete="off"
          maxLength={100}
        />
        <p>{draftMessage.length}/100</p>
      </div>
      <button type="submit">送信</button>
    </form>
  );
}
