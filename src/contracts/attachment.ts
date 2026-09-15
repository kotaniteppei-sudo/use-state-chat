export const IMAGE_MAX_BYTES = 5 * 1024 * 1024;
export const PDF_MAX_BYTES = 10 * 1024 * 1024;

export const ATTACHMENT_CONTENT_TYPES = [
  "image/jpeg",
  "image/png",
  "application/pdf",
] as const;

export type AttachmentContentType = (typeof ATTACHMENT_CONTENT_TYPES)[number];

export type AttachmentMetadata = {
  fullPath: string;
  contentType: AttachmentContentType;
  size: number;
  displayName: string;
};

const allowedTypes = new Set<string>(ATTACHMENT_CONTENT_TYPES);

export function isAttachmentContentType(
  value: unknown,
): value is AttachmentContentType {
  return typeof value === "string" && allowedTypes.has(value);
}

export function maximumBytesFor(type: AttachmentContentType): number {
  return type === "application/pdf" ? PDF_MAX_BYTES : IMAGE_MAX_BYTES;
}

export function validateAttachmentFile(
  file: Pick<File, "size" | "type">,
): string | null {
  if (!isAttachmentContentType(file.type)) {
    return "JPEG・PNG・PDFのみ選択できます。";
  }
  if (!Number.isInteger(file.size) || file.size <= 0) {
    return "空のファイルはアップロードできません。";
  }
  if (file.size > maximumBytesFor(file.type)) {
    return "ファイルサイズが上限を超えています。";
  }
  return null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export function isAttachmentMetadata(
  value: unknown,
): value is AttachmentMetadata {
  if (!isRecord(value)) return false;
  const keys = Object.keys(value);
  if (
    keys.length !== 4 ||
    !keys.every((key) =>
      ["fullPath", "contentType", "size", "displayName"].includes(key),
    )
  ) {
    return false;
  }
  if (
    typeof value.fullPath !== "string" ||
    !/^rooms\/[^/]+\/attachments\/[^/]+\/[^/]+$/.test(value.fullPath) ||
    !isAttachmentContentType(value.contentType) ||
    typeof value.size !== "number" ||
    !Number.isInteger(value.size) ||
    value.size <= 0 ||
    value.size > maximumBytesFor(value.contentType) ||
    typeof value.displayName !== "string" ||
    value.displayName !== value.displayName.trim() ||
    value.displayName.length === 0 ||
    value.displayName.length > 255
  ) {
    return false;
  }
  return true;
}
export function createAttachmentPath(roomId: string, userId: string): string {
  if (!roomId || roomId.includes("/") || !userId || userId.includes("/")) {
    throw new Error(
      "roomIdとuserIdは空でなく、slashを含まない必要があります。",
    );
  }
  return `rooms/${roomId}/attachments/${userId}/${crypto.randomUUID()}`;
}

export function normalizedDisplayName(name: string): string {
  const normalized = name.trim().slice(0, 255);
  return normalized || "attachment";
}

export function attachmentMetadataFromStoredObject(
  displayName: string,
  stored: {
    fullPath: string;
    contentType?: string | null | undefined;
    size: number;
  },
): AttachmentMetadata {
  const candidate = {
    fullPath: stored.fullPath,
    contentType: stored.contentType,
    size: stored.size,
    displayName: normalizedDisplayName(displayName),
  };
  if (!isAttachmentMetadata(candidate)) {
    throw new Error("保存済みStorage metadataが添付契約に一致しません。");
  }
  return candidate;
}
