"use client";

import { Button, Stack, TextField, Typography } from "@mui/material";
import type { ChatMessage } from "../model/ChatMessage";
import { filterMessages } from "../model/messageOperations";

export function ChatFilters({
  messages,
  searchText,
  onSearchTextChange,
}: {
  messages: readonly ChatMessage[];
  searchText: string;
  onSearchTextChange: (value: string) => void;
}) {
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
        onChange={(event) => onSearchTextChange(event.target.value)}
      />
      <Button
        onClick={() => onSearchTextChange("")}
        disabled={searchText === ""}
      >
        クリア
      </Button>
      <Typography aria-live="polite" sx={{ minWidth: "4rem" }}>
        {visibleCount}件
      </Typography>
    </Stack>
  );
}
