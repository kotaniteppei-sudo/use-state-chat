"use client";

import { Button, Stack, TextField, Typography } from "@mui/material";
import type { ChatMessage } from "../model/ChatMessage";
import { filterMessages } from "../model/messageOperations";
import { useChatUiStore } from "../store/ChatUiStoreProvider";

export function ChatFilters({
  messages,
}: {
  messages: readonly ChatMessage[];
}) {
  const searchText = useChatUiStore((state) => state.searchText);
  const setSearchText = useChatUiStore((state) => state.setSearchText);
  const clearSearchText = useChatUiStore((state) => state.clearSearchText);
  const visibleCount = filterMessages(messages, searchText).length;

  return (
    <Stack
      direction={{ xs: "column", sm: "row" }}
      spacing={1}
      sx={{ alignItems: { sm: "center" } }}
    >
      <TextField
        fullWidth
        label="検索"
        value={searchText}
        onChange={(event) => setSearchText(event.target.value)}
      />
      <Button onClick={clearSearchText} disabled={searchText === ""}>
        クリア
      </Button>
      <Typography aria-live="polite" sx={{ minWidth: "4rem" }}>
        {visibleCount}件
      </Typography>
    </Stack>
  );
}
