import { createStore } from "zustand/vanilla";

export type ChatUiState = {
  searchText: string;
  selectedRoomId: string | null;
  sidebarOpen: boolean;
};

export type ChatUiActions = {
  setSearchText: (value: string) => void;
  selectRoom: (roomId: string) => void;
  openSidebar: () => void;
  closeSidebar: () => void;
  clearSearchText: () => void;
};

export type ChatUiStore = ChatUiState & ChatUiActions;

const defaultState: ChatUiState = {
  searchText: "",
  selectedRoomId: null,
  sidebarOpen: false,
};

export const createChatUiStore = (initialState: Partial<ChatUiState> = {}) =>
  createStore<ChatUiStore>()((set) => ({
    ...defaultState,
    ...initialState,
    setSearchText: (searchText) => set({ searchText }),
    selectRoom: (selectedRoomId) => set({ selectedRoomId }),
    openSidebar: () => set({ sidebarOpen: true }),
    closeSidebar: () => set({ sidebarOpen: false }),
    clearSearchText: () => set({ searchText: "" }),
  }));
