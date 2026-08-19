import type { ChatMessage } from "../types/chat";

export type MockMode = "success" | "empty" | "error";
export type SaveMockMode = "success" | "error";

const SAMPLE_MESSAGES: ChatMessage[] = [
  {
    id: "mock-1",
    text: "模擬APIから読み込んだメッセージです。",
    sentAt: "2026-08-18T06:00:00.000Z",
  },
];

function delayMilliseconds(): number {
  return import.meta.env.MODE === "test" ? 0 : 1500;
}

export function wait(
  milliseconds: number,
  signal?: AbortSignal,
): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new DOMException("Aborted", "AbortError"));
      return;
    }

    let timerId = 0;
    const cleanup = () => signal?.removeEventListener("abort", onAbort);
    const onAbort = () => {
      window.clearTimeout(timerId);
      cleanup();
      reject(new DOMException("Aborted", "AbortError"));
    };

    timerId = window.setTimeout(() => {
      cleanup();
      resolve();
    }, milliseconds);
    signal?.addEventListener("abort", onAbort, { once: true });
  });
}

export async function fetchMockMessages(
  mode: MockMode,
  signal?: AbortSignal,
): Promise<ChatMessage[]> {
  await wait(delayMilliseconds(), signal);
  if (mode === "error") {
    throw new Error("mock history failure");
  }

  return mode === "empty"
    ? []
    : SAMPLE_MESSAGES.map((message) => ({ ...message }));
}

export async function saveMockMessage(
  message: ChatMessage,
  signal?: AbortSignal,
  mode: SaveMockMode = "success",
): Promise<ChatMessage> {
  await wait(delayMilliseconds(), signal);

  if (mode === "error") {
    throw new Error("mock save failure");
  }
  return { ...message };
}
