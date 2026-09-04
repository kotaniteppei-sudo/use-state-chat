import { expect, test } from "@playwright/test";

test("URL直打ちと404の戻る動線を確認する", async ({ page }) => {
  await page.goto("/about");
  await expect(
    page.getByRole("heading", { name: "この研修について" }),
  ).toBeVisible();

  await page.goto("/does-not-exist");
  await expect(
    page.getByRole("heading", { name: "ページが見つかりません" }),
  ).toBeVisible();

  await page.getByRole("link", { name: "チャットへ戻る" }).click();
  await expect(page).toHaveURL(/\/chat$/);
});

test("狭い画面で横スクロールせずキーボード送信できる", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/chat");
  const input = page.getByRole("textbox", { name: "メッセージ" });
  await input.focus();
  await page.keyboard.type("モバイル確認");
  await page.keyboard.press("Tab");
  await page.keyboard.press("Enter");
  await expect(page.getByText("モバイル確認")).toBeVisible();

  const hasNoHorizontalOverflow = await page.evaluate(
    () =>
      document.documentElement.scrollWidth <=
      document.documentElement.clientWidth,
  );
  expect(hasNoHorizontalOverflow).toBe(true);
});
