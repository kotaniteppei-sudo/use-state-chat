export function validateMessageDraft(
  value: string,
  maxLength: number,
): string | null {
  const normalized = value.trim();
  if (!normalized) return "メッセージを入力してください。";
  if (normalized.length > maxLength)
    return `メッセージは${maxLength}文字以内で入力してください。`;
  return null;
}
