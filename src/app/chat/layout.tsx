import type { ReactNode } from "react";
import Link from "next/link";

export default function chatLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return (
    <div className="chat-subtree">
      <nav
        style={{
          padding: "8px 0",
          borderBottom: "1px dashed #ccc",
          marginBottom: "16px",
        }}
      >
        <small>Chatメニュー：</small>
        <Link href="/chat" style={{ marginRight: "12px" }}>
          チャットトップ
        </Link>
      </nav>
      {children}
    </div>
  );
}
