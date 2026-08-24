import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Training Chat",
};

export default function ChatPage() {
  return (
    <section className="page-copy" aria-labelledby="chat-title">
      <h1 id="chat-title">Training Chat</h1>
      <p>このrouteへ、次の教材でinteractiveなチャットを追加します。</p>
      <Link href="layout">チャット機能の詳細</Link>
    </section>
  );
}
