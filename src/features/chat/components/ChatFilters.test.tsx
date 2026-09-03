import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import type { ChatMessage } from "../model/ChatMessage";
import { ChatFilters } from "./ChatFilters";
import { ChatUiStoreProvider } from "../store/ChatUiStoreProvider";
import { RoomControls } from "./RoomControls";

function createMessage(id: string, text: string): ChatMessage {
  return { id, text, sentAt: "2026-01-01T00:00:00.000Z" };
}

function renderChatFilters(messages: ChatMessage[]) {
  return render(
    <ChatUiStoreProvider>
      <ChatFilters messages={messages} />
    </ChatUiStoreProvider>,
  );
}

describe("ChatFilters", () => {
  it("検索文字列で表示件数を更新し、クリアできる", async () => {
    const user = userEvent.setup();
    renderChatFilters([
      createMessage("1", "確認します"),
      createMessage("2", "資料を送ります"),
    ]);

    const input = await screen.getByRole("textbox", { name: "検索" });
    await user.type(input, "確認");
    expect(screen.getByText("1件")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "クリア" }));
    expect(input).toHaveValue("");
    expect(screen.getByText("2件")).toBeInTheDocument();
  });
});

describe("RoomControls", () => {
  it("内部IDではなく利用者向けのroom名を選択状態へ表示する", async () => {
    const user = userEvent.setup();
    render(
      <ChatUiStoreProvider>
        <RoomControls />
      </ChatUiStoreProvider>,
    );

    await user.click(screen.getByRole("button", { name: "サイドバーを開く" }));
    await user.click(screen.getByRole("button", { name: "サポート" }));
    expect(screen.getByText("選択中：サポート")).toBeInTheDocument();
    expect(screen.queryByText("選択中：support")).not.toBeInTheDocument();
  });
});
