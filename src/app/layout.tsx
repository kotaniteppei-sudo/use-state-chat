import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Next Chat Training",
    template: "%s | Next Chat Training",
  },
  description: "Next.js App Routerの研修アプリ",
};

export default function RootLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="ja">
      <body>
        <header className="site-header">
          <div className="site-header__inner">
            <strong>Next Chat</strong>
            <nav className="site-nav" aria-label="メインナビゲーション">
              <Link href={"/"}>Home</Link>
              <Link href={"/chat"}>Chat</Link>
              <Link href={"/about"}>About</Link>
            </nav>
          </div>
        </header>
        <main className="app-main">{children}</main>
      </body>
    </html>
  );
}
