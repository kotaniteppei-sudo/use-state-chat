import { createElement } from "react";
import TestRenderer, { act } from "react-test-renderer";
import { describe, it, expect, vi } from "vitest";
import { ChatMessage } from "../../src/chat/model";
import { SubscribeToRoomMessages } from "../../src/chat/repository";
import {
  useRoomMessages,
  type RoomMessagesState,
} from "../../src/chat/useRoomMessages";

(
  globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

function message(id: string): ChatMessage {
  return {
    id,
    text: id,
    senderId: "user-a",
    createdAt: null,
    updatedAt: null,
  };
}

describe("useRoomMessages", () => {
  it("room切替時に即座に空表示へ戻し、旧callbackを無視する", async () => {
    const subscriptions = new Map<
      string,
      {
        messages(value: ChatMessage[]): void;
        error(error: Error): void;
        unsubscribe: ReturnType<typeof vi.fn>;
      }
    >();

    const subscribe: SubscribeToRoomMessages = (roomId, messages, error) => {
      const unsubscribe = vi.fn();
      subscriptions.set(roomId, { messages, error, unsubscribe });
      return unsubscribe;
    };

    let latest: RoomMessagesState | undefined;
    function Probe({ roomId }: { roomId: string | null }) {
      latest = useRoomMessages(roomId, subscribe);
      return null;
    }

    let renderer: TestRenderer.ReactTestRenderer;
    await act(async () => {
      renderer = TestRenderer.create(
        createElement(Probe, { roomId: "room-a" }),
      );
    });
    expect(latest).toMatchObject({ messages: [], loading: true });

    await act(async () =>
      subscriptions.get("room-a")?.messages([message("a")]),
    );
    expect(latest?.messages.map((item) => item.id)).toEqual(["a"]);

    await act(async () =>
      renderer.update(createElement(Probe, { roomId: "room-b" })),
    );
    expect(subscriptions.get("room-a")?.unsubscribe).toHaveBeenCalledOnce();
    expect(latest).toMatchObject({ messages: [], loading: true });

    await act(async () =>
      subscriptions.get("room-a")?.messages([message("late-a")]),
    );
    expect(latest?.messages).toEqual([]);

    await act(async () =>
      subscriptions.get("room-b")?.messages([message("b")]),
    );
    expect(latest?.messages.map((item) => item.id)).toEqual(["b"]);

    await act(async () => renderer.unmount());
  });

  it("購読errorとroom未選択を明示状態へ変換する", async () => {
    let latest: RoomMessagesState | undefined;
    let fail: ((error: Error) => void) | undefined;

    const subscribe: SubscribeToRoomMessages = (_roomId, _messages, error) => {
      fail = error;
      return vi.fn();
    };

    function Probe({ roomId }: { roomId: string | null }) {
      latest = useRoomMessages(roomId, subscribe);
      return null;
    }
    let renderer: TestRenderer.ReactTestRenderer;

    await act(async () => {
      renderer = TestRenderer.create(
        createElement(Probe, { roomId: "room-a" }),
      );
    });

    await act(async () => fail?.(new Error("internal")));
    expect(latest).toEqual({
      messages: [],
      loading: false,
      error: "メッセージを読み込めませんでした。",
    });

    await act(async () =>
      renderer.update(createElement(Probe, { roomId: null })),
    );
    expect(latest).toEqual({ messages: [], loading: false, error: null });

    await act(async () => renderer.unmount());
  });

  it("room解除後に同じroomを再選択しても旧messageを再表示しない", async () => {
    const callbacks: Array<(messages: ChatMessage[]) => void> = [];
    const subscribe: SubscribeToRoomMessages = (_roomId, messages) => {
      callbacks.push(messages);
      return vi.fn();
    };

    let latest: RoomMessagesState | undefined;
    function Probe({ roomId }: { roomId: string | null }) {
      latest = useRoomMessages(roomId, subscribe);
      return null;
    }
    let renderer: TestRenderer.ReactTestRenderer;

    await act(async () => {
      renderer = TestRenderer.create(
        createElement(Probe, { roomId: "room-a" }),
      );
    });
    await act(() => callbacks[0]?.([message("old-a")]));
    expect(latest?.messages.map((item) => item.id)).toEqual(["old-a"]);

    await act(async () =>
      renderer.update(createElement(Probe, { roomId: null })),
    );
    expect(latest).toEqual({ messages: [], loading: false, error: null });

    await act(async () =>
      renderer.update(createElement(Probe, { roomId: "room-a" })),
    );
    expect(latest).toEqual({ messages: [], loading: true, error: null });

    await act(async () => renderer.unmount());
  });
});
