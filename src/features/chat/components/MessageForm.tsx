"use client";

import { Button, Stack, TextField } from "@mui/material";
import { useRef } from "react";
import type { FormEvent, KeyboardEvent } from "react";

type MessageFormProps = {
  draftMessage: string;
  validationMessage: string | null;
  isSending: boolean;
  maxMessageLength: number;
  onDraftMessageChange: (value: string) => void;
  onSend: () => Promise<boolean>;
};

export function MessageForm(props: MessageFormProps) {
  const inputRef = useRef<HTMLTextAreaElement>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await props.onSend();
    inputRef.current?.focus();
  }

  function handleKeyDown(event: KeyboardEvent<HTMLFormElement>) {
    if (event.nativeEvent.isComposing) return;
    if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) {
      event.preventDefault();
      event.currentTarget.requestSubmit();
    }
  }

  return (
    <Stack
      component="form"
      onSubmit={handleSubmit}
      onKeyDown={handleKeyDown}
      aria-busy={props.isSending}
      direction={{ xs: "column", sm: "row" }}
      spacing={1.5}
      sx={{
        alignItems: { sm: "stretch" },
        position: "relative",
      }}
    >
      <TextField
        fullWidth
        multiline
        minRows={2}
        inputRef={inputRef}
        label="メッセージ"
        value={props.draftMessage}
        onChange={(event) => props.onDraftMessageChange(event.target.value)}
        error={props.validationMessage !== null}
        helperText={
          props.validationMessage ??
          `Enterで改行、Ctrl/Cmd+Enterで送信。${props.draftMessage.length} / ${props.maxMessageLength}文字`
        }
        slotProps={{
          htmlInput: {
            maxLength: props.maxMessageLength + 1,
            readOnly: props.isSending,
          },
          formHelperText: {
            sx: {
              position: "absolute",
              bottom: -20,
              left: 0,
              // margin: 0,
            },
          },
        }}
      />
      <Button
        type="submit"
        variant="contained"
        disabled={props.isSending}
        sx={{
          whiteSpace: "nowrap",
          minWidth: { sm: 96 },
          "&&": {
            mt: { xs: 4, sm: 0 },
          },
        }}
      >
        {props.isSending ? "送信中" : "送信"}
      </Button>
    </Stack>
  );
}
