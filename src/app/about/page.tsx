import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "この研修について",
};

export default function AboutPage() {
  return (
    <section>
      <h1>この研修について</h1>
      <p>
        Reactで作ったチャット機能を、責務を保ちながらNext.jsへ移行する研修です。
      </p>
      <Link className="text-link" href="/">
        ホームへ戻る
      </Link>
    </section>
  );
}
