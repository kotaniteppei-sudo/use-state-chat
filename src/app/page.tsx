import Link from "next/link";

export default function HomePage() {
  return (
    <section aria-labelledby="home-title">
      <h1 id="home-title">Webアプリ開発研修</h1>
      <p>チャットアプリを通してApp Routerのrouteとlayoutを学びます。</p>
      <Link className="text-link" href="/chat">
        チャットを開く
      </Link>
    </section>
  );
}
