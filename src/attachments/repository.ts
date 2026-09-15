import {
  deleteObject,
  getBytes,
  getMetadata,
  ref,
  uploadBytes,
  type FirebaseStorage,
} from "firebase/storage";
import {
  attachmentMetadataFromStoredObject,
  createAttachmentPath,
  validateAttachmentFile,
  type AttachmentMetadata,
} from "@/contracts/attachment";

export function createAttachmentRepository(storage: FirebaseStorage) {
  async function upload(
    roomId: string,
    userId: string,
    file: File,
  ): Promise<AttachmentMetadata> {
    const validationError = validateAttachmentFile(file);
    if (validationError) throw new Error(validationError);

    const fullPath = createAttachmentPath(roomId, userId);
    const uploaded = await uploadBytes(ref(storage, fullPath), file, {
      contentType: file.type,
    });
    const stored = await getMetadata(uploaded.ref);

    return attachmentMetadataFromStoredObject(file.name, stored);
  }

  function download(fullPath: string): Promise<ArrayBuffer> {
    return getBytes(ref(storage, fullPath));
  }

  function metadata(fullPath: string) {
    return getMetadata(ref(storage, fullPath));
  }

  function remove(fullPath: string): Promise<void> {
    return deleteObject(ref(storage, fullPath));
  }

  return { upload, download, metadata, remove };
}
