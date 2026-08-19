import { useCallback, useEffect, useState } from "react";
import { fetchMockMessages, type MockMode } from "../api/fakeMessageApi";
import type { ChatMessage } from "../types/chat";

export type HistoryState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; data: ChatMessage[] }
  | { status: "error"; message: string };

function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === "AbortError";
}

export function useMessageHistory(mode: MockMode) {
  const [state, setState] = useState<HistoryState>({ status: "idle" });
  const [reloadKey, setReloadKey] = useState(0);
  const retry = useCallback(() => {
    setReloadKey((current) => current + 1);
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    // 外部APIとの同期開始をUIへ反映するため、このEffect内でloadingへ遷移する。
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setState({ status: "loading" });

    void fetchMockMessages(mode, controller.signal)
      .then((data) => setState({ status: "success", data }))
      .catch((error: unknown) => {
        if (isAbortError(error)) return;
        console.error("履歴取得に失敗しました。", error);
        setState({ status: "error", message: "履歴を読み込めませんでした。" });
      });
    return () => controller.abort();
  }, [mode, reloadKey]);
  return { state, retry };
}
