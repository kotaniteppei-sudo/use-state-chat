import { readFile, readdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { initializeInAppCheckOrder } from "../../src/firebase/bootstrap";
import { describe, expect, it } from "vitest";

describe("Firebase Auth/Firestore/Storage bootstrap", () => {
  it("app > App Check > Auth > Firestore > Storageの順で取得する", () => {
    const order: string[] = [];
    const result = initializeInAppCheckOrder({
      app: () => {
        order.push("app");
        return { id: "app" };
      },
      appCheck: () => {
        order.push("app-check");
        return { id: "app-check" };
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
    expect(order).toEqual(["app", "app-check", "auth", "firestore", "storage"]);
    expect(result.appCheck).toEqual({ id: "app-check" });
  });

  it("service getterとApp Check initializerはbootstrap以外に存在しない", async () => {
    const metaUrl = import.meta.url.startsWith("file:")
      ? import.meta.url
      : `file://${import.meta.url}`;
    const sourceRoot = fileURLToPath(new URL("../../src", metaUrl));
    const files = await readdir(sourceRoot, { recursive: true });
    const forbidden =
      /\b(?:initializeAppCheck | getAuth | getFirestore | connectAuthEmulator | connectFirestoreEmulator |connectStorageEmulator)\s*\(/;
    for (const relative of files) {
      if (!relative.endsWith(".ts") && !relative.endsWith(".tsx")) continue;
      const normalized = relative.replaceAll("\\", "/");
      if (normalized === "firebase/bootstrap.ts") continue;
      const source = await readFile(`${sourceRoot}/${relative}`, "utf8");
      expect(source, normalized).not.toMatch(forbidden);
    }
  });
});
