import type { FormEvent } from "react";

type MessageFormProps = {
  draftMessage: string;
  onDraftMessageChange: (value: string) => void;
  onSend: () => void;
};

export function MessageForm(props: MessageFormProps) {
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    props.onSend();
  }

  return (
    <form className="message-form" onSubmit={handleSubmit}>
      <label className="sr-only" htmlFor="message">
        メッセージ
      </label>
      <div>
        <textarea
          id="message"
          value={props.draftMessage}
          onChange={(e) => props.onDraftMessageChange(e.target.value)}
          placeholder="メッセージを入力"
          autoComplete="off"
          maxLength={100}
        />
        <p className="textCount">{props.draftMessage.length}/100</p>
      </div>
      <button type="submit">送信</button>
    </form>
  );
}
