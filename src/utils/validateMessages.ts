export const MESSAGE_MAX_LENGTH = 200;

export type ValidationResult = {
  canSubmit: boolean;
  hasError: boolean;
  message: string | null;
};

export function validateMessages(
  draftMessage: string,
  submitAttempted: boolean,
): ValidationResult {
  const trimmedValue = draftMessage.trim();

  if (!submitAttempted && trimmedValue.length === 0) {
    return {
      canSubmit: false,
      hasError: false,
      message: null,
    };
  }

  if (trimmedValue.length === 0) {
    return {
      canSubmit: false,
      hasError: true,
      message: "メッセージを1文字以上入力してください",
    };
  }

  if (trimmedValue.length > MESSAGE_MAX_LENGTH) {
    return {
      canSubmit: false,
      hasError: true,
      message: "200文字を超えています。",
    };
  }

  if (180 <= trimmedValue.length && trimmedValue.length <= MESSAGE_MAX_LENGTH) {
    return {
      canSubmit: true,
      hasError: false,
      message: "文字数制限に近づいています。",
    };
  }

  return {
    canSubmit: true,
    hasError: false,
    message: null,
  };
}
