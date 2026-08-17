import { useEffect, useState } from "react";
import type { ChatMessage } from "../types/chat";
import { loadMessages, saveMessages } from "../storage/chatStorage";

export function useStoredMessages() {
  const [initialLoad] = useState(loadMessages());
  const [messages, setMessages] = useState<ChatMessage[]>(initialLoad.messages);
  const [saveFailed, setSaveFailed] = useState(false);

  useEffect(() => {
    // 外部ストレージへの同期結果を利用者へ通知するため、このEffect内で保持する。
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSaveFailed(!saveMessages(messages));
  }, [messages]);

  return {
    messages,
    setMessages,
    loadStatus: initialLoad.status,
    saveFailed,
  };
}
