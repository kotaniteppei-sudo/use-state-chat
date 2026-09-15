import { describe, expect, it } from "vitest";
import { initializeFirebaseInOrder } from "../../src/firebase/bootstrap";

describe("Firebase Auth/Firestore/Storage bootstrap", () => {
  it("appの後にAuth、Firestore、Storageを取得する", () => {
    const order: string[] = [];
    const result = initializeFirebaseInOrder({
      app: () => {
        order.push("app");
        return { id: "app" };
      },
      auth: () => {
        order.push("auth");
        return { id: "auth" };
      },
      firestore: () => {
        order.push("firestore");
        return { id: "firestore" };
      },
      storage: () => {
        order.push("storage");
        return { id: "storage" };
      },
    });
    expect(order).toEqual(["app", "auth", "firestore", "storage"]);
    expect(result.storage).toEqual({ id: "storage" });
  });
});
