import { describe, expect, it, vi } from "vitest";
import {
  attachmentMetadataFromStoredObject,
  createAttachmentPath,
  IMAGE_MAX_BYTES,
  isAttachmentMetadata,
  PDF_MAX_BYTES,
  validateAttachmentFile,
} from "../../src/contracts/attachment";

function fileOf(size: number, type: string): Pick<File, "size" | "type"> {
  return { size, type } as Pick<File, "size" | "type">;
}

describe("attachment contract", () => {
  it("JPEG/PNGは5MiB、PDFは10MiBの境界まで許可する", () => {
    for (const type of ["image/jpeg", "image/png"]) {
      expect(
        validateAttachmentFile(fileOf(IMAGE_MAX_BYTES - 1, type)),
      ).toBeNull();
      expect(validateAttachmentFile(fileOf(IMAGE_MAX_BYTES, type))).toBeNull();
      expect(
        validateAttachmentFile(fileOf(IMAGE_MAX_BYTES + 1, type)),
      ).not.toBeNull();
    }
    expect(
      validateAttachmentFile(fileOf(PDF_MAX_BYTES - 1, "application/pdf")),
    ).toBeNull();
    expect(
      validateAttachmentFile(fileOf(PDF_MAX_BYTES, "application/pdf")),
    ).toBeNull();
    expect(
      validateAttachmentFile(fileOf(PDF_MAX_BYTES + 1, "application/pdf")),
    ).not.toBeNull();
  });

  it("空fileと未許可MIMEを拒否する", () => {
    expect(validateAttachmentFile(fileOf(0, "image/png"))).not.toBeNull();
    expect(validateAttachmentFile(fileOf(1, "text/plain"))).not.toBeNull();
  });

  it("room, current uid、UUIDから正式pathを作る", () => {
    vi.spyOn(crypto, "randomUUID").mockReturnValue(
      "00000000-0000-4000-8000-000000000000",
    );
    expect(createAttachmentPath("room-a", "user-a")).toBe(
      "rooms/room-a/attachments/user-a/00000000-0000-4000-8000-000000000000",
    );
    expect(createAttachmentPath("room.team+v1", "user+team@example.com")).toBe(
      "rooms/room.team+v1/attachments/user+team@example.com/00000000-0000-4000-8000-000000000000",
    );
    expect(() => createAttachmentPath("room/a", "user-a")).toThrow();
  });

  it("実Storage metadataからだけ正規化metadataを作る", () => {
    const metadata = attachmentMetadataFromStoredObject(" guide.pdf ", {
      fullPath: "rooms/room-a/attachments/user-a/file-1",
      contentType: "application/pdf",
      size: 4,
    });
    expect(metadata).toEqual({
      fullPath: "rooms/room-a/attachments/user-a/file-1",
      contentType: "application/pdf",
      size: 4,
      displayName: "guide.pdf",
    });
    expect(isAttachmentMetadata({ ...metadata, extra: true })).toBe(false);

    expect(() =>
      attachmentMetadataFromStoredObject("guide.pdf", {
        ...metadata,
        contentType: "text/plain",
      }),
    ).toThrow();
  });
});
