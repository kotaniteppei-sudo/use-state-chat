import {
  Button,
  Card,
  CardActions,
  CardContent,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

import type { ChatMessage } from "../model/ChatMessage";

type MessageListProps = {
  messages: readonly ChatMessage[];
  editingMessageId: string | null;
  editingText: string;
  editingError: string | null;
  onEditingTextChange: (value: string) => void;
  onStartEditing: (message: ChatMessage) => void;
  onCancelEditing: () => void;
  onSaveEditing: (id: string) => void;
  onRequestDelete: (message: ChatMessage) => void;
};

export function MessageList(props: MessageListProps) {
  return (
    <Stack component="ul" spacing={1.5} sx={{ listStyle: "none", m: 0, p: 0 }}>
      {props.messages.map((message) => {
        const isEditing = props.editingMessageId === message.id;
        return (
          <Card component="li" key={message.id} variant="outlined">
            <CardContent sx={{ "&&": { pb: 0 } }}>
              {isEditing ? (
                <TextField
                  fullWidth
                  label="編集メッセージ"
                  value={props.editingText}
                  error={props.editingError !== null}
                  helperText={props.editingError}
                  onChange={(event) =>
                    props.onEditingTextChange(event.target.value)
                  }
                />
              ) : (
                <>
                  <Typography sx={{ wordWrap: "break-word" }}>
                    {message.text}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {message.editedAt ? "編集済み" : "送信済み"}
                  </Typography>
                </>
              )}
            </CardContent>
            <CardActions>
              {isEditing ? (
                <>
                  <Button onClick={() => props.onSaveEditing(message.id)}>
                    保存
                  </Button>
                  <Button onClick={props.onCancelEditing}>取消</Button>
                </>
              ) : (
                <>
                  <Button
                    aria-label={`「${message.text}」を編集`}
                    onClick={() => props.onStartEditing(message)}
                  >
                    編集
                  </Button>
                  <Button
                    color="error"
                    aria-label={`「${message.text}」を削除`}
                    onClick={() => props.onRequestDelete(message)}
                  >
                    削除
                  </Button>
                </>
              )}
            </CardActions>
          </Card>
        );
      })}
    </Stack>
  );
}
