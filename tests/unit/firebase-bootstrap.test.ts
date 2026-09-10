import { describe, expect, it } from "vitest";
import { initializeFirebaseInOrder } from "../../src/firebase/bootstrap";

describe("Firebase Auth/ Firestore bootstrap", () => {
  it("appの後にAuth、Firestoreを取得する", () => {
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
    });

    expect(order).toEqual(["app", "auth", "firestore"]);
    expect(result.db).toEqual({ id: "firestore" });
  });
});
