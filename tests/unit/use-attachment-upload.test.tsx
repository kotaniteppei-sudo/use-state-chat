import { createElement } from "react";
import TestRenderer, { act } from "react-test-renderer";
import { describe, expect, it, vi } from "vitest";
import type { AttachmentMetadata } from "../../src/contracts/attachment";
import {
  useAttachmentUpload,
  type AttachmentUploadAdapter,
  type AttachmentUploadCallbacks,
} from "../../src/attachments/useAttachmentUpload";

(
  globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

function pdf(name: string): File {
  return new File([new Uint8Array([1, 2, 3, 4])], name, {
    type: "application/pdf",
  });
}

describe("useAttachmentUpload", () => {
  it("進捗と成功metadataを反映する", async () => {
    let callbacks: AttachmentUploadCallbacks | undefined;
    const adapter: AttachmentUploadAdapter = {
      start: vi.fn((path, file, next) => {
        callbacks = next;
        return { cancel: vi.fn(() => true), unsubscribe: vi.fn() };
      }),
    };

    let hook: ReturnType<typeof useAttachmentUpload> | undefined;
    function Probe() {
      hook = useAttachmentUpload(adapter);
      return null;
    }

    let renderer: TestRenderer.ReactTestRenderer;
    await act(async () => {
      renderer = TestRenderer.create(createElement(Probe));
    });
    await act(async () => hook?.start("room-a", "user-a", pdf("guide.pdf")));

    await act(async () => callbacks?.progress(0.5));
    expect(hook?.state).toEqual({ status: "uploading", progress: 0.5 });

    const attachment: AttachmentMetadata = {
      fullPath: "rooms/room-a/attachments/user-a/file-1",
      contentType: "application/pdf",
      size: 4,
      displayName: "guide.pdf",
    };
    await act(async () => callbacks?.complete(attachment));
    expect(hook?.state).toEqual({ status: "success", attachment });

    await act(async () => renderer.unmount());
  });

  it("replacementは旧taskをcancel/unsubscribeし、遅延callbackを無視する", async () => {
    const runs: Array<{
      callbacks: AttachmentUploadCallbacks;
      cancel: ReturnType<typeof vi.fn>;
      unsubscribe: ReturnType<typeof vi.fn>;
    }> = [];

    const adapter: AttachmentUploadAdapter = {
      start: (path, file, callbacks) => {
        const run = {
          callbacks,
          cancel: vi.fn(() => true),
          unsubscribe: vi.fn(),
        };
        runs.push(run);
        return run;
      },
    };

    let hook: ReturnType<typeof useAttachmentUpload> | undefined;
    function Probe() {
      hook = useAttachmentUpload(adapter);
      return null;
    }

    let renderer: TestRenderer.ReactTestRenderer;
    await act(async () => {
      renderer = TestRenderer.create(createElement(Probe));
    });
    await act(async () => hook?.start("room-a", "user-a", pdf("first.pdf")));
    await act(async () => hook?.start("room-a", "user-a", pdf("second.pdf")));

    expect(runs[0]?.cancel).toHaveBeenCalledOnce();
    expect(runs[0]?.unsubscribe).toHaveBeenCalledOnce();

    await act(async () => runs[0]?.callbacks.error("storage/canceled"));
    expect(hook?.state.status).toBe("uploading");

    await act(async () => renderer.unmount());
    expect(runs[1]?.cancel).toHaveBeenCalledOnce();
    expect(runs[1]?.unsubscribe).toHaveBeenCalledOnce();
  });

  it("不正fileへの再選択でも旧taskを停止しvalidation errorを維持する", async () => {
    let callbacks: AttachmentUploadCallbacks | undefined;
    const cancel = vi.fn(() => true);
    const unsubscribe = vi.fn();
    const adapter: AttachmentUploadAdapter = {
      start: (path, file, next) => {
        callbacks = next;
        return { cancel, unsubscribe };
      },
    };

    let hook: ReturnType<typeof useAttachmentUpload> | undefined;
    function Probe() {
      hook = useAttachmentUpload(adapter);
      return null;
    }

    let renderer: TestRenderer.ReactTestRenderer;
    await act(async () => {
      renderer = TestRenderer.create(createElement(Probe));
    });
    await act(async () => hook?.start("room-a", "user-a", pdf("first.pdf")));

    const invalid = new File(["plain"], "notes.txt", { type: "text/plain" });
    await act(async () => hook?.start("room-a", "user-a", invalid));

    expect(cancel).toHaveBeenCalledOnce();
    expect(unsubscribe).toHaveBeenCalledOnce();
    expect(hook?.state).toMatchObject({ status: "error" });

    await act(async () =>
      callbacks?.complete({
        fullPath: "rooms/room-a/attachments/user-a/late",
        contentType: "application/pdf",
        size: 4,
        displayName: "first.pdf",
      }),
    );

    expect(hook?.state).toMatchObject({ status: "error" });
    await act(async () => renderer.unmount());
  });

  it("明示cancelと一般errorを区別する", async () => {
    let callbacks: AttachmentUploadCallbacks | undefined;
    const adapter: AttachmentUploadAdapter = {
      start: (path, file, next) => {
        callbacks = next;
        return { cancel: vi.fn(() => true), unsubscribe: vi.fn() };
      },
    };

    let hook: ReturnType<typeof useAttachmentUpload> | undefined;
    function Probe() {
      hook = useAttachmentUpload(adapter);
      return null;
    }

    let renderer: TestRenderer.ReactTestRenderer;
    await act(async () => {
      renderer = TestRenderer.create(createElement(Probe));
    });
    await act(async () => hook?.start("room-a", "user-a", pdf("guide.pdf")));

    await act(async () => callbacks?.error("storage/retry-limit-exceeded"));
    expect(hook?.state).toEqual({
      status: "error",
      message: "アップロードに失敗しました。",
    });

    await act(async () => hook?.cancel());
    expect(hook?.state).toEqual({ status: "canceled" });
    await act(async () => renderer.unmount());
  });
});
