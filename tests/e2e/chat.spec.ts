import { expect, test } from "@playwright/test";

test("HomeからChatへ移動してメッセージを送信できる", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: "Chat" }).click();
  await expect(page).toHaveURL(/\/chat$/);

  await page.getByRole("textbox", { name: "メッセージ" }).fill("E2E確認");
  await page.getByRole("button", { name: "送信" }).click();

  await expect(page.getByText("E2E確認")).toBeVisible();
});

test("削除Dialogで取消と確定を確認できる", async ({ page }) => {
  await page.goto("/chat");

  await page.getByRole("textbox", { name: "メッセージ" }).fill("削除E2E");
  await page.getByRole("button", { name: "送信" }).click();

  await page.getByRole("button", { name: "「削除E2E」を削除" }).click();

  await page.getByRole("button", { name: "取消" }).click();
  await expect(page.getByText("削除E2E")).toBeVisible();

  await page.getByRole("button", { name: "「削除E2E」を削除" }).click();
  await page.getByRole("button", { name: "削除", exact: true }).click();

  await expect(page.getByText("削除E2E")).toBeHidden();
});
