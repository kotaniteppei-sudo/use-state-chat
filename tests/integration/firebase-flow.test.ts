import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import {
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from "@firebase/rules-unit-testing";

import { deleteApp, initializeApp, type FirebaseApp } from "firebase/app";
import {
  connectAuthEmulator,
  createUserWithEmailAndPassword,
  getAuth,
  signOut,
  type Auth,
} from "firebase/auth";

import {
  connectFirestoreEmulator,
  doc,
  getDoc,
  getFirestore,
  setDoc,
  type Firestore,
} from "firebase/firestore";

import {
  connectStorageEmulator,
  getStorage,
  type FirebaseStorage,
} from "firebase/storage";

import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { createAttachmentRepository } from "../../src/attachments/repository";
import { createChatRepository } from "../../src/chat/repository";
import { parseChatMessageDocument } from "../../src/chat/model";

const projectId = "demo-training-chat";
if (projectId !== "demo-training-chat")
  throw new Error("demo-training-chat以外では実行しません。");
const firestoreRulesPath = fileURLToPath(
  new URL("../../rules/firestore.rules", import.meta.url),
);
const storageRulesPath = fileURLToPath(
  new URL("../../rules/storage.rules", import.meta.url),
);

let testEnv: RulesTestEnvironment;
let firebaseApp: FirebaseApp;
let auth: Auth;
let db: Firestore;
let storage: FirebaseStorage;

async function clearAuthEmulator() {
  const response = await fetch(
    `http://127.0.0.1:9099/emulator/v1/projects/${projectId}/accounts`,
    { method: "DELETE" },
  );

  if (!response.ok) {
    throw new Error(`Auth Emulator clear failed: ${response.status}`);
  }
}

async function register(label: string) {
  return createUserWithEmailAndPassword(
    auth,
    `${label}-${crypto.randomUUID()}@example.test`,
    "training-password",
  );
}

async function seedRoom(memberIds: string[], adminIds: string[] = []) {
  await testEnv.withSecurityRulesDisabled(async (context) => {
    await setDoc(doc(context.firestore(), "rooms/room-a"), {
      name: "Room A",
      memberIds,
      adminIds,
    });
  });
}

beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    projectId,
    firestore: { rules: await readFile(firestoreRulesPath, "utf8") },
    storage: { rules: await readFile(storageRulesPath, "utf8") },
  });

  firebaseApp = initializeApp(
    {
      apiKey: "demo-api-key",
      authDomain: `${projectId}.firebaseapp.com`,
      projectId,
      storageBucket: `${projectId}.firebasestorage.app`,
      appId: "1:000000000000:web:stage3-current",
    },
    "stage3-current-integration",
  );

  auth = getAuth(firebaseApp);
  db = getFirestore(firebaseApp);
  storage = getStorage(firebaseApp);

  connectAuthEmulator(auth, "http://127.0.0.1:9099", { disableWarnings: true });
  connectFirestoreEmulator(db, "127.0.0.1", 8080);
  connectStorageEmulator(storage, "127.0.0.1", 9199);
});

afterAll(async () => {
  await testEnv.cleanup();
  await deleteApp(firebaseApp);
});

beforeEach(async () => {
  if (auth.currentUser) await signOut(auth);
  await Promise.all([
    testEnv.clearFirestore(),
    testEnv.clearStorage(),
    clearAuthEmulator(),
  ]);
});

describe("Auth + Firestore + Storage canonical integration", () => {
  it("PDF uploadを実metadataと同じmessage metadataへ結び、read/deleteまで確認する", async () => {
    const credential = await register("member");
    const uid = credential.user.uid;
    await seedRoom([uid], [uid]);

    const attachmentRepository = createAttachmentRepository(storage);
    const chatRepository = createChatRepository({ auth, db });
    const bytes = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d]);
    const file = new File([bytes], "guide.pdf", { type: "application/pdf" });
    const attachment = await attachmentRepository.upload("room-a", uid, file);

    const storedMetadata = await attachmentRepository.metadata(
      attachment.fullPath,
    );
    expect(attachment).toMatchObject({
      fullPath: storedMetadata.fullPath,
      contentType: storedMetadata.contentType,
      size: storedMetadata.size,
      displayName: "guide.pdf",
    });

    const messageId = await chatRepository.createMessage({
      roomId: "room-a",
      text: "PDFを確認してください。",
      attachment,
    });

    const messageSnapshot = await getDoc(
      doc(db, `rooms/room-a/messages/${messageId}`),
    );

    const message = parseChatMessageDocument(messageSnapshot.data() ?? {});
    expect(message.attachment).toEqual(attachment);

    const download = new Uint8Array(
      await attachmentRepository.download(attachment.fullPath),
    );
    expect(download).toEqual(bytes);

    await chatRepository.deleteMessage("room-a", messageId);
    expect(
      (await getDoc(doc(db, `rooms/room-a/messages/${messageId}`))).exists(),
    ).toBe(false);

    await attachmentRepository.remove(attachment.fullPath);
    await expect(
      attachmentRepository.metadata(attachment.fullPath),
    ).rejects.toMatchObject({ code: "storage/object-not-found" });
  });

  it("登録済nonmemberはmessageとfileを読めない", async () => {
    const ownerCredential = await register("owner");
    const ownerUid = ownerCredential.user.uid;
    await seedRoom([ownerUid]);

    const attachmentRepository = createAttachmentRepository(storage);
    const chatRepository = createChatRepository({ auth, db });

    const attachment = await attachmentRepository.upload(
      "room-a",
      ownerUid,
      new File([new Uint8Array([1])], "private.pdf", {
        type: "application/pdf",
      }),
    );

    const messageId = await chatRepository.createMessage({
      roomId: "room-a",
      text: "private",
      attachment,
    });

    await signOut(auth);
    await register("outsider");

    await expect(
      getDoc(doc(db, `rooms/room-a/messages/${messageId}`)),
    ).rejects.toMatchObject({ code: "permission-denied" });

    await expect(
      createAttachmentRepository(storage).download(attachment.fullPath),
    ).rejects.toMatchObject({ code: "storage/unauthorized" });
  });
});
