import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from "@mui/material";

type DeleteDialogMessage = {
  messagePreview: string | null;
  onCancel: () => void;
  onConfirm: () => void;
};

export function DeleteMessageDialog({
  messagePreview,
  onCancel,
  onConfirm,
}: DeleteDialogMessage) {
  return (
    <Dialog
      open={messagePreview !== null}
      onClose={onCancel}
      aria-labelledby="delete-title"
    >
      <DialogTitle id="delete-title">メッセージを削除しますか？</DialogTitle>
      <DialogContent>
        <DialogContentText>
          「{messagePreview}」を削除します。この操作は取り消せません。
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={onCancel} autoFocus>
          取消
        </Button>
        <Button onClick={onConfirm} color="error" variant="contained">
          削除
        </Button>
      </DialogActions>
    </Dialog>
  );
}
