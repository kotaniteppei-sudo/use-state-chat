import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from "@firebase/rules-unit-testing";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
} from "firebase/firestore";
import { afterAll, beforeAll, beforeEach, describe, it } from "vitest";

const projectId = "demo-training-chat";
const rulesPath = fileURLToPath(
  new URL("../../rules/firestore.rules", import.meta.url),
);

let testEnv: RulesTestEnvironment;

async function seedFixtures() {
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
        attachment: null,
      });
    }
  });
}

function validCreate(senderId = "member") {
  return {
    text: "hello",
    senderId,
    createdAt: serverTimestamp(),
    updatedAt: null,
    attachment: null,
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
  await seedFixtures();
});

describe("canonical corrected Firestore Rules", () => {
  it("memberのroom/message readとqueryを許可し、unauth/nonmemberを拒否する", async () => {
    const memberDb = testEnv.authenticatedContext("member").firestore();
    await assertSucceeds(getDoc(doc(memberDb, "rooms/room-a")));
    await assertSucceeds(
      getDoc(doc(memberDb, "rooms/room-a/messages/message-a")),
    );
    await assertSucceeds(
      getDocs(collection(memberDb, "rooms/room-a/messages")),
    );

    await assertFails(
      getDoc(doc(testEnv.unauthenticatedContext().firestore(), "rooms/room-a")),
    );
    await assertFails(
      getDoc(
        doc(
          testEnv.authenticatedContext("outsider").firestore(),
          "rooms/room-a/messages/message-a",
        ),
      ),
    );
  });

  it("clientによるroom create/update/deleteを常に拒否する", async () => {
    const db = testEnv.authenticatedContext("admin").firestore();
    await assertFails(
      setDoc(doc(db, "rooms/room-new"), {
        name: "new",
        memberIds: ["admin"],
        adminIds: ["admin"],
      }),
    );
    await assertFails(updateDoc(doc(db, "rooms/room-a"), { name: "changed" }));
    await assertFails(deleteDoc(doc(db, "rooms/room-a")));
  });

  it("memberの正式createをattachment欠落/nullの両方で許可する", async () => {
    const messages = collection(
      testEnv.authenticatedContext("member").firestore(),
      "rooms/room-a/messages",
    );
    const { attachment: omittedAttachment, ...withoutAttachment } =
      validCreate();
    void omittedAttachment;

    await assertSucceeds(addDoc(messages, withoutAttachment));
    await assertSucceeds(addDoc(messages, validCreate()));
  });

  it("nonmember, sender spoof、field/本文/time違反createを拒否する", async () => {
    const memberMessages = collection(
      testEnv.authenticatedContext("member").firestore(),
      "rooms/room-a/messages",
    );

    await assertFails(
      addDoc(
        collection(
          testEnv.authenticatedContext("outsider").firestore(),
          "rooms/room-a/messages",
        ),
        validCreate("outsider"),
      ),
    );

    await assertFails(addDoc(memberMessages, validCreate("author")));
    await assertFails(
      addDoc(memberMessages, { ...validCreate(), isAdmin: true }),
    );
    await assertFails(
      addDoc(memberMessages, { ...validCreate(), text: "   " }),
    );
    await assertFails(
      addDoc(memberMessages, { ...validCreate(), text: "x".repeat(201) }),
    );
    await assertFails(
      addDoc(memberMessages, {
        ...validCreate(),
        createdAt: Timestamp.fromMillis(2),
      }),
    );
    await assertFails(
      addDoc(memberMessages, {
        ...validCreate(),
        updatedAt: serverTimestamp(),
      }),
    );
  });

  it("正式attachment metadataを許可し、不一致path/MIME/size/name/追加fieldを拒否する", async () => {
    const messages = collection(
      testEnv.authenticatedContext("member").firestore(),
      "rooms/room-a/messages",
    );

    const attachment = {
      fullPath: "rooms/room-a/attachments/member/file-1",
      contentType: "application/pdf",
      size: 4,
      displayName: "guide.pdf",
    };

    await assertSucceeds(addDoc(messages, { ...validCreate(), attachment }));

    await assertFails(
      addDoc(messages, {
        ...validCreate(),
        attachment: {
          ...attachment,
          fullPath: "rooms/room-a/attachments/author/file-1",
        },
      }),
    );

    await assertFails(
      addDoc(messages, {
        ...validCreate(),
        attachment: { ...attachment, contentType: "text/plain" },
      }),
    );

    await assertFails(
      addDoc(messages, {
        ...validCreate(),
        attachment: {
          ...attachment,
          contentType: "image/png",
          size: 5 * 1024 * 1024 + 1,
        },
      }),
    );

    await assertFails(
      addDoc(messages, {
        ...validCreate(),
        attachment: { ...attachment, displayName: "  guide.pdf  " },
      }),
    );

    await assertFails(
      addDoc(messages, {
        ...validCreate(),
        attachment: { ...attachment, downloadToken: "secret" },
      }),
    );
  });

  it("句読点を含む各segmentを許可し、room/UID不一致とsegment注入を拒否する", async () => {
    const roomId = "room.team+v1";
    const uid = "member+team@example.com";
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const db = context.firestore();
      await setDoc(doc(db, `rooms/${roomId}`), {
        name: "Punctuation IDs",
        memberIds: [uid],
        adminIds: [],
      });
    });

    const messages = collection(
      testEnv.authenticatedContext(uid).firestore(),
      `rooms/${roomId}/messages`,
    );

    const attachment = {
      fullPath: `rooms/${roomId}/attachments/${uid}/file+v1.pdf`,
      contentType: "application/pdf",
      size: 4,
      displayName: "guide.pdf",
    };

    await assertSucceeds(
      addDoc(messages, {
        ...validCreate(uid),
        attachment,
      }),
    );

    for (const fullPath of [
      `rooms/other-room/attachments/${uid}/file+v1.pdf`,
      `rooms/${roomId}/attachments/other-user/file+v1.pdf`,
      `rooms/${roomId}/attachments/${uid}/nested/file+v1.pdf`,
    ]) {
      await assertFails(
        addDoc(messages, {
          ...validCreate(uid),
          attachment: { ...attachment, fullPath },
        }),
      );
    }
  });

  it("authorだけがtext/updatedAtを更新でき、adminを含む他memberは更新できない", async () => {
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
          { text: `${uid} edit`, updatedAt: serverTimestamp() },
        ),
      );
    }
  });

  it("不変field、attachment、追加field、bad text/timeのupdateを拒否する", async () => {
    const target = doc(
      testEnv.authenticatedContext("author").firestore(),
      "rooms/room-a/messages/message-a",
    );
    await assertFails(updateDoc(target, { senderId: "member" }));
    await assertFails(updateDoc(target, { createdAt: serverTimestamp() }));
    await assertFails(
      updateDoc(target, {
        attachment: {
          fullPath: "rooms/room-a/attachments/author/file-1",
          contentType: "application/pdf",
          size: 1,
          displayName: "a.pdf",
        },
      }),
    );
    await assertFails(updateDoc(target, { isAdmin: true }));
    await assertFails(
      updateDoc(target, { text: " bad ", updatedAt: serverTimestamp() }),
    );
    await assertFails(
      updateDoc(target, { text: "after", updatedAt: Timestamp.fromMillis(2) }),
    );
  });

  it("author/admin deleteを許可し、ordinary member/outsiderを拒否する", async () => {
    await assertFails(
      deleteDoc(
        doc(
          testEnv.authenticatedContext("member").firestore(),
          "rooms/room-a/messages/message-a",
        ),
      ),
    );
    await assertFails(
      deleteDoc(
        doc(
          testEnv.authenticatedContext("outsider").firestore(),
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
