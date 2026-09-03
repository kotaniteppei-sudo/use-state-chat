import { describe, expect, it } from "vitest";
import { createChatUiStore } from "./chatUiStore";

describe("chatUiStore", () => {
  it("actionでUI状態を更新し、初期状態をstoreごとに分離する", () => {
    const firstStore = createChatUiStore({ selectedRoomId: "support" });
    const secondStore = createChatUiStore();

    firstStore.getState().setSearchText("確認");
    firstStore.getState().openSidebar();

    expect(firstStore.getState()).toMatchObject({
      searchText: "確認",
      selectedRoomId: "support",
      sidebarOpen: true,
    });

    expect(secondStore.getState()).toMatchObject({
      searchText: "",
      selectedRoomId: null,
      sidebarOpen: false,
    });
  });
});
