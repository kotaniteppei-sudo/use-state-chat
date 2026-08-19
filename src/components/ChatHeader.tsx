type ChatHeaderProps = {
  messageCount: number;
};
export function ChatHeader({ messageCount }: ChatHeaderProps) {
  return (
    <header className="chat-header">
      <div>
        <p className="eyebrow">教材01~07 累積完成形</p>
        <h1>かんたんチャット</h1>
        <p>入力・編集・検索・保存・非同期状態をまとめて検証します。</p>
      </div>
      <output aria-label="画面上のメッセージ件数" className="count-badge">
        {messageCount}件
      </output>
    </header>
  );
}
