import { describe, it, expect, vi, afterEach } from "vitest";
import { saveStorageData } from "./chatStorage";
import type { StorageData } from "./chatStorage";

describe("saveStorageData の例外テスト", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("localStorage.setItem が失敗した時、falseを返すこと", () => {
    // const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("QuotaExceededError");
    });

    const dummyData: StorageData = {
      currentVersion: 1,
      versions: [
        {
          version: 1,
          updateAt: "2026-08-06T00:00:00:00.000Z",
          messages: [
            { id: "1", text: "テスト", sentAt: "2026-08-06T00:00:00:00.000Z" },
          ],
        },
      ],
    };

    const result = saveStorageData(dummyData);

    expect(result).toBe(false);

    // expect(consoleSpy).toHaveBeenCalledTimes(1);
  });
});
