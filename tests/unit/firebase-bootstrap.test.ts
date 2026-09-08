import { describe, expect, it } from "vitest";
import { initializeAuthInOrder } from "../../src/firebase/bootstrap";

describe("Firebase Auth bootstrap", () => {
  it("appを作成してからAuthを取得する", () => {
    const order: string[] = [];

    const result = initializeAuthInOrder({
      app: () => {
        order.push("app");
        return { id: "app" };
      },
      auth: () => {
        order.push("auth");
        return { id: "auth" };
      },
    });

    expect(order).toEqual(["app", "auth"]);
    expect(result.auth).toEqual({ id: "auth" });
  });
});
