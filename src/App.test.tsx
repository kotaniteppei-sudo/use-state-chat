import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import App from "./App";
import { STORAGE_KEY, STORAGE_SCHEMA_VERSION } from "./storage/chatStorage";

describe("教材01~07の累積チャット", () => {
  it("入力したメッセージを送信し日時付きで表示する", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.type(
      screen.getByRole("textbox", { name: "メッセージ" }),
      "  確認します  ",
    );
    await user.click(screen.getByRole("button", { name: "送信" }));

    const article = await screen.findByRole("article");
    expect(within(article).getByText("確認します")).toBeInTheDocument();
    expect(article.querySelector("time")?.dateTime).toMatch(
      /^\d{4}-\d{2}-\d{2}T/,
    );
  });

  it("空白だけの送信理由をalertで伝える", async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.type(
      screen.getByRole("textbox", { name: "メッセージ" }),
      "　　",
    );
    await user.click(screen.getByRole("button", { name: "送信" }));
    expect(screen.getByRole("alert")).toHaveTextContent("1文字以上");
  });

  it("textareaを説明と文字数へaria-describedbyで関連付ける", async () => {
    render(<App />);

    expect(screen.getByRole("textbox", { name: "メッセージ" })).toHaveAttribute(
      "aria-describedby",
      expect.stringContaining("message-count"),
    );
  });

  it("IME変換中のCtrl+Enterでは送信せず、確定後に送信する", async () => {
    const user = userEvent.setup();
    render(<App />);

    const input = screen.getByRole("textbox", { name: "メッセージ" });
    await user.type(input, "変換中の本文");
    fireEvent.keyDown(input, {
      key: "Eenter",
      ctrlKey: true,
      isComposing: true,
    });
    expect(screen.queryByRole("article")).not.toBeInTheDocument();

    fireEvent.keyDown(input, {
      key: "Enter",
      ctrlKey: true,
      isComposing: false,
    });
    expect(screen.getByText("変換中の本文")).toBeInTheDocument();
  });

  it("localStorageから安全に履歴を復元する", () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        schemaVersion: STORAGE_SCHEMA_VERSION,
        messages: [
          {
            id: "restored",
            text: "復元した本文",
            sentAt: "2026-08-05T01:00:00.000Z",
          },
        ],
      }),
    );

    render(<App />);
    expect(screen.getByText("復元した本文")).toBeInTheDocument();
  });

  it("保存値のsentAtが非ISO形式なら拒否する", () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        schemaVersion: STORAGE_SCHEMA_VERSION,
        messages: [
          {
            id: "saved-1",
            text: "保存済み本文",
            sentAt: "2026/08/05,0:00:00",
          },
        ],
      }),
    );
    render(<App />);

    expect(screen.getByRole("alert")).toHaveTextContent("保存データが壊れて");
    expect(
      screen.getByText("まだメッセージはありません。"),
    ).toBeInTheDocument();
  });

  it("壊れた保存データを警告して空の履歴にする", () => {
    localStorage.setItem(STORAGE_KEY, "broken-json");
    render(<App />);
    expect(screen.getByRole("alert")).toHaveTextContent("保存データが壊れて");
    expect(
      screen.getByText("まだメッセージはありません。"),
    ).toBeInTheDocument();
  });

  it("本文を編集して編集済み表示へ更新する", async () => {
    const user = userEvent.setup();
    render(<App />);
    const input = screen.getByRole("textbox", { name: "メッセージ" });
    await user.type(input, "編集前");
    await user.click(screen.getByRole("button", { name: "送信" }));
    await user.click(screen.getByRole("button", { name: "編集" }));
    const editor = screen.getByRole("textbox", { name: "本文を編集" });
    await user.clear(editor);
    await user.type(editor, "編集後");
    await user.click(screen.getByRole("button", { name: "保存" }));

    expect(screen.getByText("編集後")).toBeInTheDocument();
    expect(screen.getByText("編集済み")).toBeInTheDocument();
  });

  it("確認後に対象メッセージだけ削除する", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(true);
    const user = userEvent.setup();
    render(<App />);

    const input = screen.getByRole("textbox", { name: "メッセージ" });
    await user.type(input, "削除対象");
    await user.click(screen.getByRole("button", { name: "送信" }));
    const card = await screen.findByRole("article");
    const deleteBtn = within(card).getByRole("button", { name: "削除" });
    await user.click(deleteBtn);

    expect(screen.queryByText("削除対象")).not.toBeInTheDocument();
  });

  it("削除確認を取り消すとメッセージを残す", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(false);
    const user = userEvent.setup();
    render(<App />);

    const input = screen.getByRole("textbox", { name: "メッセージ" });
    await user.type(input, "残す本文");
    await user.click(screen.getByRole("button", { name: "送信" }));
    await user.click(screen.getByRole("button", { name: "削除" }));

    expect(screen.getByText("残す本文")).toBeInTheDocument();
  });

  it("検索結果だけを表示し元の件数を保持する", async () => {
    const user = userEvent.setup();
    render(<App />);

    const input = screen.getByRole("textbox", { name: "メッセージ" });
    await user.type(input, "りんご");
    await user.click(screen.getByRole("button", { name: "送信" }));
    await user.type(input, "みかん");
    await user.click(screen.getByRole("button", { name: "送信" }));

    await user.type(
      screen.getByRole("searchbox", { name: "本文を検索" }),
      "りん",
    );

    expect(screen.getByText("りんご")).toBeInTheDocument();
    expect(screen.queryByText("みかん")).not.toBeInTheDocument();
    expect(
      screen.getByRole("status", { name: "検索結果件数" }),
    ).toHaveTextContent("1 / 2件");
  });

  it("模擬APIのemptyとerrorを表示し再試行できる", async () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("radio", { name: "empty" }));
    expect(await screen.findByText("履歴はありません。")).toBeInTheDocument();

    await user.click(screen.getByRole("radio", { name: "error" }));
    expect(
      await screen.findByText("履歴を読み込めませんでした。"),
    ).toBeInTheDocument();

    expect(await screen.getByRole("button", { name: "再試行" })).toBeEnabled();
  });

  it("送信失敗時に入力を保持して再試行できる", async () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    const user = userEvent.setup();
    render(<App />);

    const failOnce = screen.getByRole("checkbox", {
      name: "次の送信を失敗させる（教材用）",
    });
    await user.click(failOnce);
    const input = screen.getByRole("textbox", { name: "メッセージ" });
    await user.type(input, "失敗しても残る");
    await user.click(screen.getByRole("button", { name: "送信" }));

    expect(
      await screen.findByText(/入力を残したまま再試行/),
    ).toBeInTheDocument();
    expect(input).toHaveValue("失敗しても残る");
    expect(failOnce).not.toBeChecked();

    await user.click(screen.getByRole("button", { name: "送信" }));
    expect(
      within(await screen.findByRole("article")).getByText("失敗しても残る"),
    ).toBeInTheDocument();
    expect(input).toHaveValue("");
  });
});
