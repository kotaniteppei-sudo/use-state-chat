type ChatHeaderProps = {
  messageNum?: number;
};

export function ChatHeader({ messageNum = 0 }: ChatHeaderProps) {
  return (
    <header className="chat-header">
      <h1>かんたんチャット</h1>
      <div>
        <p>メッセージの変更をブラウザへ保存します。</p>
        <p>メッセージ数：{messageNum}件</p>
      </div>
    </header>
  );
}
