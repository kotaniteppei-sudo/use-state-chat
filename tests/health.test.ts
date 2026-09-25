import { describe, it, expect } from "vitest";
// Next.js App Router のエンドポイントをインポート
import { GET } from "../src/app/api/health/route";

describe("Health Check API", () => {
  it("should return 200 OK status", async () => {
    // ダミーのリクエストを作成してAPIを実行
    const request = new Request("http://localhost/api/health");
    const response = await GET(request);

    // ステータスコードが200であることを確認
    expect(response.status).toBe(200);

    // （オプション）レスポンスの中身がJSONで { status: "ok" } のような形か確認
    // もしroute.tsの仕様が違う場合はこの部分は削っても大丈夫です
    const data = await response.json();
    expect(data).toBeDefined();
  });
});
