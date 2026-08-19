import { describe, expect, it } from "vitest";
import { fetchMockMessages, wait } from "./fakeMessageApi";

describe("fakeMessageApi", () => {
  it("success、empty、errorを再現する", async () => {
    await expect(fetchMockMessages("success")).resolves.toHaveLength(1);
    await expect(fetchMockMessages("empty")).resolves.toEqual([]);
    await expect(fetchMockMessages("error")).rejects.toThrow(
      "mock history failure",
    );
  });

  it("既に中止済みのsignalをAbortErrorにする", async () => {
    const controller = new AbortController();
    controller.abort();
    await expect(wait(10, controller.signal)).rejects.toMatchObject({
      name: "AbortError",
    });
  });
});
