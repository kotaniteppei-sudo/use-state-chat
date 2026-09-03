"use client";

import { createContext, useContext, useState } from "react";
import type { ReactNode } from "react";
import { useStore } from "zustand";

import {
  createChatUiStore,
  type ChatUiState,
  type ChatUiStore,
} from "./chatUiStore";

type StoreApi = ReturnType<typeof createChatUiStore>;
const ChatUiContext = createContext<StoreApi | null>(null);

export function ChatUiStoreProvider({
  children,
  initialState,
}: {
  children: ReactNode;
  initialState?: Partial<ChatUiState>;
}) {
  const [store] = useState(() => createChatUiStore(initialState));
  return (
    <ChatUiContext.Provider value={store}>{children}</ChatUiContext.Provider>
  );
}

export function useChatUiStore<T>(selector: (state: ChatUiStore) => T): T {
  const store = useContext(ChatUiContext);

  if (store === null) {
    throw new Error("ChatUiStoreProvider is missing");
  }
  return useStore(store, selector);
}
