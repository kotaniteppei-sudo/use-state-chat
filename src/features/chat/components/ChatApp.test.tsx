import { ThemeProvider } from "@mui/material/styles";
import React from "react";
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { theme } from "@/theme/theme";
import type { ChatMessage } from "../model/ChatMessage";
import type { MessageRepository } from "../services/messageRepository";
import { ChatApp } from "./ChatApp";
import { ChatUiStoreProvider } from "../store/ChatUiStoreProvider";

const config = { appName: "Team Chat", maxMessageLength: 200 };

function createMemoryRepository(
  initialMessages: ChatMessage[] = [],
  saveResult = true,
) {
  let savedMessages = [...initialMessages];
  const repository: MessageRepository = {
    load: () => [...savedMessages],
    save: (messages) => {
      savedMessages = [...messages];
      return saveResult;
    },
  };
  return { repository, read: () => savedMessages };
}

function renderChatApp(
  repository: MessageRepository,
  deliverMessage?: (message: ChatMessage) => Promise<void>,
) {
  return render(
    <ThemeProvider theme={theme}>
      <ChatUiStoreProvider>
        <ChatApp
          config={config}
          repository={repository}
          deliverMessage={deliverMessage}
        />
      </ChatUiStoreProvider>
    </ThemeProvider>,
  );
}

describe("ChatApp", () => {
  it("メッセージを送信してrepositoryへ保存する", async () => {
    const user = userEvent.setup();
    const memory = createMemoryRepository();
    renderChatApp(memory.repository);

    await user.type(
      screen.getByRole("textbox", { name: "メッセージ" }),
      "動作確認",
    );
    screen.debug();
    await user.click(screen.getByRole("button", { name: "送信" }));
    expect(await screen.findByText("動作確認")).toBeInTheDocument();
    await waitFor(() => expect(memory.read()).toHaveLength(1));
  });

  it("空入力を拒否して理由を入力欄に関連付ける", async () => {
    const user = userEvent.setup();
    const memory = createMemoryRepository();
    renderChatApp(memory.repository);

    await user.click(screen.getByRole("button", { name: "送信" }));
    expect(
      screen.getByText("メッセージを入力してください。"),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("textbox", { name: "メッセージ" }),
    ).toHaveAccessibleDescription("メッセージを入力してください。");
  });

  it("IME変換中のCtrl+Enterでは送信せず、変換確定後だけ送信する", async () => {
    const user = userEvent.setup();
    const memory = createMemoryRepository();
    renderChatApp(memory.repository);

    const input = screen.getByRole("textbox", { name: "メッセージ" });
    await user.type(input, "変換中の本文");
    fireEvent.keyDown(input, {
      key: "Enter",
      ctrlKey: true,
      isComposing: true,
    });
    expect(memory.read()).toHaveLength(0);

    fireEvent.keyDown(input, {
      key: "Enter",
      ctrlKey: true,
      isComposing: false,
    });
    expect(await screen.findByText("変換中の本文")).toBeInTheDocument();
    await waitFor(() => expect(memory.read()).toHaveLength(1));
  });

  it("非同期送信中を表示し、同期待ちguardで二重送信を防ぐ", async () => {
    const user = userEvent.setup();
    const memory = createMemoryRepository();
    let resolveDelivery: (() => void) | undefined;
    const deliverMessage = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          resolveDelivery = resolve;
        }),
    );
    renderChatApp(memory.repository, deliverMessage);

    const input = screen.getByRole("textbox", { name: "メッセージ" });
    await user.type(input, "待機する本文");
    await user.click(screen.getByRole("button", { name: "送信" }));

    expect(screen.getByRole("button", { name: "送信中..." })).toBeDisabled();
    expect(input).toHaveAttribute("readonly");
    expect(input.closest("form")).toHaveAttribute("aria-busy", "true");

    fireEvent.submit(input.closest("form")!);
    expect(deliverMessage).toHaveBeenCalledOnce();
    expect(memory.read()).toHaveLength(0);

    await act(async () => resolveDelivery?.());
    expect(await screen.findByText("待機する本文")).toBeInTheDocument();
    await waitFor(() => expect(memory.read()).toHaveLength(1));
  });

  it("送信失敗をAlertに残し、同じ入力の再試行成功で解消する", async () => {
    const user = userEvent.setup();
    const memory = createMemoryRepository();
    let shouldReject = true;
    const deliverMessage = vi.fn(async () => {
      if (shouldReject) throw new Error("training failure");
    });
    renderChatApp(memory.repository, deliverMessage);

    const input = screen.getByRole("textbox", { name: "メッセージ" });
    await user.type(input, "再試行する本文");
    await user.click(screen.getByRole("button", { name: "送信" }));

    expect(
      await screen.findByText("メッセージを送信できませんでした。"),
    ).toBeInTheDocument();
    expect(input).toHaveValue("再試行する本文");
    expect(memory.read()).toHaveLength(0);

    shouldReject = false;
    await user.click(screen.getByRole("button", { name: "送信" }));
    expect(await screen.findByText("再試行する本文")).toBeInTheDocument();
    await waitFor(() =>
      expect(
        screen.queryByText("メッセージを送信できませんでした。"),
      ).not.toBeInTheDocument(),
    );
    expect(screen.getByText("メッセージを送信しました。")).toBeInTheDocument();
  });

  it("削除Dialogの取消と確定を安全側に処理する", async () => {
    const user = userEvent.setup();
    const target = {
      id: "delete-target",
      text: "削除対象",
      sentAt: "2026-01-01T00:00:00.000Z",
    };
    const memory = createMemoryRepository([target]);
    renderChatApp(memory.repository);

    await screen.findByText("削除対象");
    await user.click(
      screen.getByRole("button", { name: "「削除対象」を削除" }),
    );
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "取消" }));
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
    expect(screen.getByText("削除対象")).toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: "「削除対象」を削除" }),
    );
    await user.click(screen.getByRole("button", { name: "削除" }));
    await waitFor(() =>
      expect(screen.queryByText("削除対象")).not.toBeInTheDocument(),
    );
  });

  it("保存失敗を自動消去しないAlertとして表示する", async () => {
    const memory = createMemoryRepository([], false);
    renderChatApp(memory.repository);

    expect(
      await screen.findByText(
        "履歴を保存できませんでした。次の変更時に再試行します。",
      ),
    ).toBeInTheDocument();
  });
});
