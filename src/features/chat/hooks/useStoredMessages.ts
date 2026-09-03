import { useEffect, useState } from "react";
import type { ChatMessage } from "../model/ChatMessage";
import type { MessageRepository } from "../services/messageRepository";

export function useStoredMessages(repository: MessageRepository) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [saveFailed, setSaveFailed] = useState(false);

  useEffect(() => {
    let active = true;
    const storedMessages = repository.load();

    queueMicrotask(() => {
      if (!active) return;
      setMessages(storedMessages);
      setLoaded(true);
    });

    return () => {
      active = false;
    };
  }, [repository]);

  useEffect(() => {
    if (!loaded) return;
    let active = true;

    const failed = !repository.save(messages);
    queueMicrotask(() => {
      if (active) setSaveFailed(failed);
    });

    return () => {
      active = false;
    };
  }, [loaded, messages, repository]);
  return { loaded, messages, saveFailed, setMessages };
}
