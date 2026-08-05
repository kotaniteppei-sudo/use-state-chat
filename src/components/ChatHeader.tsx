// import type { ChatMessage } from "../types/chat";

type ChatHeaderPrpps = {
  // messages: ChatMessage,
  onDeleteAll: () => void;
};

export function ChatHeader({ onDeleteAll }: ChatHeaderPrpps) {
  return (
    <header className="chat-header">
      <h1>かんたんチャット</h1>
      <div>
        <p>メッセージをブラウザへ保存します。</p>
        <button type="button" onClick={() => onDeleteAll()}>
          全件削除
        </button>
      </div>
    </header>
  );
}
