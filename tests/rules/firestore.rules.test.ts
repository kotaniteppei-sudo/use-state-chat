import { readFile } from "fs/promises";
import { fileURLToPath } from "node:url";
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  RulesTestEnvironment,
} from "@firebase/rules-unit-testing";
import {
  addDoc,
  collection,
  getDoc,
  doc,
  setDoc,
  serverTimestamp,
  Timestamp,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";
import { beforeAll, beforeEach, describe, it, afterAll } from "vitest";

const projectId = "demo-training-chat";
const rulesPath = fileURLToPath(
  new URL("../../rules/firestore.rules", import.meta.url),
);
let testEnv: RulesTestEnvironment;

function validCreate(senderId = "member") {
  return {
    text: "hello",
    senderId,
    createdAt: serverTimestamp(),
    updatedAt: null,
  };
}

beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    projectId,
    firestore: { rules: await readFile(rulesPath, "utf8") },
  });
});

afterAll(async () => testEnv.cleanup());

beforeEach(async () => {
  await testEnv.clearFirestore();
  await testEnv.withSecurityRulesDisabled(async (context) => {
    const db = context.firestore();
    await setDoc(doc(db, "rooms/room-a"), {
      name: "Room A",
      memberIds: ["author", "member", "admin"],
      adminIds: ["admin"],
    });

    for (const id of ["message-a", "message-b"]) {
      await setDoc(doc(db, `rooms/room-a/messages/${id}`), {
        text: "before",
        senderId: "author",
        createdAt: Timestamp.fromMillis(1),
        updatedAt: null,
      });
    }
  });
});

describe("lesson 16 Firestore Rules", () => {
  it("memberのroom文書readを許可し、未認証とnon-memberを拒否する", async () => {
    const memberDb = testEnv.authenticatedContext("member").firestore();
    await assertSucceeds(getDoc(doc(memberDb, "rooms/room-a")));

    await assertFails(
      getDoc(doc(testEnv.unauthenticatedContext().firestore(), "rooms/room-a")),
    );

    await assertFails(
      getDoc(
        doc(
          testEnv.authenticatedContext("outsider").firestore(),
          "rooms/room-a",
        ),
      ),
    );
  });

  it("member本人の正式createを許可する", async () => {
    const messages = collection(
      testEnv.authenticatedContext("member").firestore(),
      "rooms/room-a/messages",
    );
    await assertSucceeds(addDoc(messages, validCreate()));
  });

  it("non-member,sender spoof、追加field、本文、時刻違反を拒否する", async () => {
    const memberMessages = collection(
      testEnv.authenticatedContext("member").firestore(),
      "rooms/room-a/messages",
    );

    await assertFails(addDoc(memberMessages, validCreate("author")));
    await assertFails(
      addDoc(memberMessages, { ...validCreate(), isAdmin: true }),
    );
    await assertFails(
      addDoc(memberMessages, { ...validCreate(), text: " bad " }),
    );
    await assertFails(
      addDoc(memberMessages, {
        ...validCreate,
        createdAt: Timestamp.fromMillis(2),
      }),
    );
    await assertFails(
      addDoc(memberMessages, { ...validCreate(), text: "a".repeat(201) }),
    );
  });

  it("投稿者だけがtextとserver updatedAtを更新できる", async () => {
    await assertSucceeds(
      updateDoc(
        doc(
          testEnv.authenticatedContext("author").firestore(),
          "rooms/room-a/messages/message-a",
        ),
        { text: "after", updatedAt: serverTimestamp() },
      ),
    );

    for (const uid of ["member", "admin"]) {
      await assertFails(
        updateDoc(
          doc(
            testEnv.authenticatedContext(uid).firestore(),
            "rooms/room-a/messages/message-a",
          ),
          {
            text: `${uid} edit`,
            updatedAt: serverTimestamp(),
          },
        ),
      );
    }
  });

  it("不変field、追加field、bad text/timeのupdateを拒否する", async () => {
    const target = doc(
      testEnv.authenticatedContext("author").firestore(),
      "rooms/room-a/messages/message-a",
    );
    await assertFails(updateDoc(target, { senderId: "member" }));
    await assertFails(updateDoc(target, { isAdmin: true }));
  });

  it("投稿者とadminのdeleteだけを許可する", async () => {
    await assertFails(
      deleteDoc(
        doc(
          testEnv.authenticatedContext("member").firestore(),
          "rooms/room-a/messages/message-a",
        ),
      ),
    );
    await assertSucceeds(
      deleteDoc(
        doc(
          testEnv.authenticatedContext("author").firestore(),
          "rooms/room-a/messages/message-a",
        ),
      ),
    );
    await assertSucceeds(
      deleteDoc(
        doc(
          testEnv.authenticatedContext("admin").firestore(),
          "rooms/room-a/messages/message-b",
        ),
      ),
    );
  });
});
