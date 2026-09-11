import type { FullMetadata } from "firebase/storage";

export const IMAGE_MAX_BYTES = 5 * 1024 * 1024;
export const PDF_MAX_BYTES = 10 * 1024 * 1024;
export type AttachmentContentType =
  | "image/jpeg"
  | "image/png"
  | "image/webp"
  | "application/pdf";
export type AttachmentMetadata = {
  fullPath: string;
  displayName: string;
  contentType: AttachmentContentType;
  size: number;
};

export function validateAttachmentFile(
  file: Pick<File, "size" | "type">,
): string | null {
  const maxMB = 5;
  const allowedTypes = [
    "image/jpeg",
    "image/png",
    "image/webp",
    "application/pdf",
  ];
  if (!allowedTypes.includes(file.type)) {
    return "許可されてないファイル形式です。";
  }
  if (file.size > maxMB * 1024 * 1024) {
    return `ファイルサイズは${maxMB}MB以下にしてください。`;
  }
  return null;
}

export function createAttachmentPath(roomId: string, userId: string): string {
  const uniqueId =
    typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : Date.now().toString();
  return `rooms/${roomId}/attachments/${userId}/${uniqueId}`;
}

export function attachmentMetadataFromStoredObject(
  displayName: string,
  metadata: FullMetadata,
): AttachmentMetadata {
  return {
    fullPath: metadata.fullPath,
    displayName,
    contentType:
      (metadata.contentType as AttachmentContentType) ?? "image/jpeg",
    size: metadata.size,
  };
}
