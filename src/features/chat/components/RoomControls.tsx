"use client";

import { Button, Paper, Stack, Typography } from "@mui/material";
import { useChatUiStore } from "../store/ChatUiStoreProvider";

const rooms = [
  { id: "general", label: "一般" },
  { id: "support", label: "サポート" },
];

export function RoomControls() {
  const sidebarOpen = useChatUiStore((state) => state.sidebarOpen);
  const openSidebar = useChatUiStore((state) => state.openSidebar);
  const closeSidebar = useChatUiStore((state) => state.closeSidebar);
  const selectedRoomId = useChatUiStore((state) => state.selectedRoomId);
  const selectRoom = useChatUiStore((state) => state.selectRoom);

  const selectedRoomLabel =
    rooms.find((room) => room.id === selectedRoomId)?.label ?? "なし";

  return (
    <Paper variant="outlined" sx={{ p: 2 }}>
      <Stack spacing={1}>
        <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
          <Typography component="h2" variant="h6" sx={{ flexGrow: 1 }}>
            ルーム
          </Typography>
          <Button onClick={sidebarOpen ? closeSidebar : openSidebar}>
            {sidebarOpen ? "サイドバーを閉じる" : "サイドバーを開く"}
          </Button>
        </Stack>
        {sidebarOpen && (
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
            {rooms.map((room) => (
              <Button
                key={room.id}
                variant={selectedRoomId === room.id ? "contained" : "outlined"}
                onClick={() => selectRoom(room.id)}
              >
                {room.label}
              </Button>
            ))}
          </Stack>
        )}
        <Typography color="text.secondary" aria-live="polite">
          選択中：{selectedRoomLabel}
        </Typography>
      </Stack>
    </Paper>
  );
}
