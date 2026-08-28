import type { ChatMessage } from "./ChatMessage";

export function removeMessage(
  messages: readonly ChatMessage[],
  messageId: string,
): ChatMessage[] {
  return messages.filter((message) => message.id !== messageId);
}

export function replaceMessageText(
  messages: readonly ChatMessage[],
  messageId: string,
  nextText: string,
  editedAt: string,
): ChatMessage[] {
  return messages.map((message) =>
    message.id === messageId
      ? { ...message, text: nextText, editedAt }
      : message,
  );
}

export function filterMessages(
  messages: readonly ChatMessage[],
  searchText: string,
): ChatMessage[] {
  const normalizedSearchTest = searchText.trim().toLocaleLowerCase("jp-JP");
  if (!normalizedSearchTest) return [...messages];

  return messages.filter((message) =>
    message.text
      .trim()
      .toLocaleLowerCase("jp-JP")
      .includes(normalizedSearchTest),
  );
}

export function validateMessage(
  text: string,
  maxMessageLength: number,
): string | null {
  const normalizedText = text.trim();
  if (normalizedText.length === 0) return "メッセージを入力してください。";
  if (normalizedText.length > maxMessageLength)
    return `メッセージは${maxMessageLength}文字以内で入力してください。`;
  return null;
}
