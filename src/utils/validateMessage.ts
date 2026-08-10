export const MESSAGE_MAX_LENGTH = 200;

export function normalizeMessage(value: string): string {
  return value.trim();
}

export function validateMessage(value: string): string | null {
  const normalized = normalizeMessage(value);

  if (normalized.length === 0) {
    return "メッセージは1文字以上入力してください。";
  }

  if (normalized.length > MESSAGE_MAX_LENGTH) {
    return `メッセージは${MESSAGE_MAX_LENGTH}文字以内で入力してください。`;
  }

  return null;
}
