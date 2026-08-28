import { Paper, Stack, Typography } from "@mui/material";

export function EmptyState() {
  return (
    <Paper variant="outlined" sx={{ p: 3 }}>
      <Stack spacing={0.5}>
        <Typography component="h2" variant="h6">
          メッセージはありません
        </Typography>
        <Typography color="text.secondary">
          検索条件を変えるか、最初のメッセージを送信してください。
        </Typography>
      </Stack>
    </Paper>
  );
}
