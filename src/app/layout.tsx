import { AppRouterCacheProvider } from "@mui/material-nextjs/v16-appRouter";
import CssBaseline from "@mui/material/CssBaseline";
import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { AppThemeProvider } from "@/theme/AppThemeProvider";
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
        <AppRouterCacheProvider>
          <AppThemeProvider>
            <CssBaseline />
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
          </AppThemeProvider>
        </AppRouterCacheProvider>
      </body>
    </html>
  );
}
