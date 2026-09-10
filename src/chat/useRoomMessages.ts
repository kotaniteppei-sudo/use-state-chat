"use client";

import { useEffect, useState } from "react";
import type { ChatMessage } from "./model";
import type { SubscribeToRoomMessages } from "./repository";

export type RoomMessagesState = {
  messages: ChatMessage[];
  loading: boolean;
  error: string | null;
};

type keyedRoomMessagesState = RoomMessagesState & { roomId: string | null };

const idleState: keyedRoomMessagesState = {
  roomId: null,
  messages: [],
  loading: false,
  error: null,
};

export function useRoomMessages(
  roomId: string | null,
  subscribeToRoomMessages: SubscribeToRoomMessages,
): RoomMessagesState {
  const [state, setState] = useState<keyedRoomMessagesState>(idleState);

  let visibleState = state;
  if (state.roomId !== roomId) {
    visibleState = roomId
      ? { roomId, messages: [], loading: true, error: null }
      : idleState;
    setState(visibleState);
  }

  useEffect(() => {
    if (!roomId) return;

    let active = true;

    const unsubscribe = subscribeToRoomMessages(
      roomId,
      (messages) => {
        if (active) setState({ roomId, messages, loading: false, error: null });
      },
      () => {
        if (active) {
          setState({
            roomId,
            messages: [],
            loading: false,
            error: "メッセージを読み込めませんでした。",
          });
        }
      },
    );

    return () => {
      active = false;
      unsubscribe();
    };
  }, [roomId, subscribeToRoomMessages]);

  return {
    messages: visibleState.messages,
    loading: visibleState.loading,
    error: visibleState.error,
  };
}
