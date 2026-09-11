import { act } from "react-test-renderer";
import { useAttachmentUpload } from "../../src/attachments/useAttachmentUpload";
import { describe, expect, it, vi } from "vitest";
import {
  ATTACHMENT_CONTENT_TYPES,
  createAttachmentPath,
  IMAGE_MAX_BYTES,
  PDF_MAX_BYTES,
  validateAttachmentFile,
} from "../../src/contracts/attachment";
import next from "next";

(
  globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

function fileOf(size: number, type: string): Pick<File, "size" | "type"> {
  return { size, type };
}

function pdf(name: string): File {
  return new File([new Uint8Array([1, 2, 3, 4])], name, {
    type: "application/pdf",
  });
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
    expect(validateAttachmentFile(fileOf(0, "text/plain"))).not.toBeNull();
  });

  it("room、current uid、UUIDから正式pathを作る", () => {
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

  it("進捗と成功metadataを反映する", async () => {
    let callbacks: useAttachmentUploadCallbacks | undefined;
    const adapter: useAttachmentUpload = {
      start: vi.fn((path, file, next) => {
        callbacks = next;
        return { cancel: vi.fn(() => true), unsubscribe: vi.fn() };
      }),
    };
  });
});
