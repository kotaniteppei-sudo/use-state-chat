import Link from "next/link";

export default function NotFound() {
  return (
    <section aria-labelledby="not-found-title">
      <h1 id="not-found-title">ページが見つかりません</h1>
      <p>URLを確認するか、チャット画面へ戻ってください。</p>
      <Link href="/chat">チャットへ戻る</Link>
    </section>
  );
}
