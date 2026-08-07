type ChatHeaderProps = {
  messageCount: number;
};
export function ChatHeader({ messageCount }: ChatHeaderProps) {
  return (
    <header className="chat-header">
      <h1>かんたんチャット</h1>
      <output aria-label="画面上のメッセージ件数" className="count-badge">
        {messageCount}件
      </output>
    </header>
  );
}
