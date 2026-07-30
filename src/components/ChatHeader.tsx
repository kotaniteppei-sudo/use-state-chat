export function ChatHeader() {
  return (
    <header className="chat-header">
      <h1>かんたんチャット</h1>
      <div>
        <p>メッセージの変更をブラウザへ保存します。</p>
        {/* <button onClick={() => setMessages([])}>履歴を全て削除</button> */}
      </div>
    </header>
  );
}
