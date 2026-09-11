import {
  createAttachmentPath,
  validateAttachmentFile,
  attachmentMetadataFromStoredObject,
  type AttachmentMetadata,
} from "@/contracts/attachment";
import {
  getMetadata,
  ref,
  uploadBytesResumable,
  type FirebaseStorage,
  type StorageError,
  type UploadTaskSnapshot,
} from "firebase/storage";
import { useState, useRef, useCallback, useEffect } from "react";

export type AttachmentUploadState =
  | { status: "idle" }
  | { status: "uploading"; progress: number }
  | { status: "success"; attachment: AttachmentMetadata }
  | { status: "canceled" }
  | { status: "error"; message: string };

export type useAttachmentUploadCallbacks = {
  progress(progress: number): void;
  complete(attachment: AttachmentMetadata): void;
  error(code: string): void;
};

export type RunningAttachmentUpload = {
  cancel(): boolean;
  unsubscribe(): void;
};

export type AttachmentUploadAdapter = {
  start(
    fullPath: string,
    file: File,
    callbacks: useAttachmentUploadCallbacks,
  ): RunningAttachmentUpload;
};

export function createFirebaseUploadAdapter(
  storage: FirebaseStorage,
): AttachmentUploadAdapter {
  return {
    start(fullPath, file, callbacks) {
      const task = uploadBytesResumable(ref(storage, fullPath), file, {
        contentType: file.type,
      });

      const unsubscribe = task.on(
        "state_changed",
        (snapshot: UploadTaskSnapshot) => {
          callbacks.progress(
            snapshot.totalBytes === 0
              ? 0
              : snapshot.bytesTransferred / snapshot.totalBytes,
          );
        },
        (error: StorageError) => callbacks.error(error.code),
        () => {
          void getMetadata(task.snapshot.ref)
            .then((metadata) => {
              callbacks.complete(
                attachmentMetadataFromStoredObject(file.name, metadata),
              );
            })
            .catch(() => callbacks.error("storage/metadata-unavailable"));
        },
      );
      return {
        cancel: () => {
          return task.cancel();
        },
        unsubscribe: () => {
          unsubscribe();
        },
      };
    },
  };
}

export function useAttachmentUpload(adapter: AttachmentUploadAdapter) {
  const [state, setState] = useState<AttachmentUploadState>({ status: "idle" });
  const runningRef = useRef<RunningAttachmentUpload | null>(null);
  const generationRef = useRef(0);

  const stopCurrent = useCallback(() => {
    generationRef.current += 1;
    runningRef.current?.cancel();
    runningRef.current?.unsubscribe();
    runningRef.current = null;
  }, []);

  const start = useCallback(
    (roomId: string, userId: string, file: File) => {
      stopCurrent();

      const validationError = validateAttachmentFile(file);
      if (validationError) {
        setState({ status: "error", message: validationError });
        return;
      }

      const generation = generationRef.current;
      const fullPath = createAttachmentPath(roomId, userId);

      setState({ status: "uploading", progress: 0 });

      runningRef.current = adapter.start(fullPath, file, {
        progress(progress) {
          if (generation === generationRef.current) {
            setState({ status: "uploading", progress });
          }
        },
        complete(attachment) {
          if (generation === generationRef.current) {
            setState({ status: "success", attachment });
          }
        },
        error(message) {
          if (generation === generationRef.current) {
            setState({ status: "error", message });
          }
        },
      });
    },
    [adapter, stopCurrent],
  );

  const cancel = useCallback(() => {
    stopCurrent();
    setState({ status: "canceled" });
  }, [stopCurrent]);

  useEffect(() => stopCurrent, [stopCurrent]);

  return { state, start, cancel };
}
