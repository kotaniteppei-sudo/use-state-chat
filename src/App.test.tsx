import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import App from "./App";
import { STORAGE_KEY, STORAGE_SCHEMA_VERSION } from "./storage/chatStorage";

describe("教材06の型の非同期通信", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it("入力を正規化し、日時付きのメッセージを追加する", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.type(
      screen.getByRole("textbox", { name: "メッセージ" }),
      "　　　はじめまして　　　",
    );

    await user.click(screen.getByRole("button", { name: "送信" }));

    const article = screen.getByRole("article");
    expect(within(article).getByText("はじめまして")).toBeInTheDocument();
    expect(article.querySelector("time")?.dateTime).toMatch(
      /^\d{4}-\d{2}-\d{2}T/,
    );
  });

  it("正しい保存履歴を起動時に復元する", () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        schemaVersion: STORAGE_SCHEMA_VERSION,
        messages: [
          {
            id: "saved-1",
            text: "保存済み本文",
            sentAt: "2026-08-05T01:00:00.000Z",
          },
        ],
      }),
    );

    render(<App />);
    expect(screen.getByText("保存済み本文")).toBeInTheDocument();
  });

  it("壊れた保存値では警告して空の履歴を使う", () => {
    localStorage.setItem(STORAGE_KEY, "broken-json");
    render(<App />);
    expect(screen.getByRole("alert")).toHaveTextContent("保存データが壊れて");
    expect(
      screen.getByText("まだメッセージはありません。"),
    ).toBeInTheDocument();
  });

  it("対象メッセージを編集する", async () => {
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

  it("確認後に対象メッセージを削除する", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(true);
    const user = userEvent.setup();
    render(<App />);

    await user.type(
      screen.getByRole("textbox", { name: "メッセージ" }),
      "削除対象",
    );
    await user.click(screen.getByRole("button", { name: "送信" }));

    const card = screen.getByRole("article");
    const deleteBtn = within(card).getByRole("button", { name: "削除" });
    await user.click(deleteBtn);

    expect(screen.queryByText("削除対象")).not.toBeInTheDocument();
  });

  it("検索条件に一致するメッセージだけを表示する", async () => {
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

  it("空白だけの送信理由をalertで伝える", async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.type(screen.getByRole("textbox", { name: "メッセージ" }), " ");
    await user.click(screen.getByRole("button", { name: "送信" }));

    expect(screen.getByRole("alert")).toHaveTextContent("1文字以上");
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

  it("履歴取得のerrorを表示し、再試行操作を提供する", async () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("radio", { name: "error" }));

    expect(
      await screen.findByText("履歴を読み込めませんでした。"),
    ).toBeInTheDocument();
    expect(await screen.getByRole("button", { name: "再試行" })).toBeEnabled();
  });

  it("送信失敗時に入力を保持して再試行可能にする", async () => {
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
