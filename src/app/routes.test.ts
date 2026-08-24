import { expect, test } from "vitest";
import { primaryRoutes } from "./routes";

test("primaryRoutesに必要なルートが含まれていること", () => {
  expect(primaryRoutes).toEqual([
    { href: "/", label: "Home" },
    { href: "./chat", label: "Chat" },
    { href: "./about", label: "About" },
    { href: "./guide", label: "Guide" },
  ]);
});
