import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from "@firebase/rules-unit-testing";
import { doc, setDoc } from "firebase/firestore";
import {
  deleteObject,
  getBytes,
  ref,
  updateMetadata,
  uploadBytes,
} from "firebase/storage";
import { afterAll, beforeAll, beforeEach, describe, it } from "vitest";

const projectId = "demo-training-chat";
const firestoreRulesPath = fileURLToPath(
  new URL("../../rules/firestore.rules", import.meta.url),
);
const storageRulesPath = fileURLToPath(
  new URL("../../rules/storage.rules", import.meta.url),
);
let testEnv: RulesTestEnvironment;

beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    projectId,
    firestore: { rules: await readFile(firestoreRulesPath, "utf8") },
    storage: { rules: await readFile(storageRulesPath, "utf8") },
  });
});

afterAll(async () => testEnv.cleanup());

beforeEach(async () => {
  await Promise.all([testEnv.clearFirestore(), testEnv.clearStorage()]);
  await testEnv.withSecurityRulesDisabled(async (context) => {
    await setDoc(doc(context.firestore(), "rooms/room-a"), {
      name: "Room A",
      memberIds: ["owner", "member", "admin"],
      adminIds: ["admin"],
    });
  });
});

function objectRef(asUid: string, ownerUid = asUid, fileId = "file-1") {
  return ref(
    testEnv.authenticatedContext(asUid).storage(),
    `rooms/room-a/attachments/${ownerUid}/${fileId}`,
  );
}

describe("canonical corrected Storage Rules", () => {
  it("JPEG/PNG 5MiBとPDF 10MiBの境界をowner memberへ許可する", async () => {
    await assertSucceeds(
      uploadBytes(
        objectRef("owner", "owner", "jpeg"),
        new Uint8Array(5 * 1024 * 1024),
        { contentType: "image/jpeg" },
      ),
    );
    await assertSucceeds(
      uploadBytes(
        objectRef("owner", "owner", "png"),
        new Uint8Array(5 * 1024 * 1024),
        { contentType: "image/png" },
      ),
    );
    await assertSucceeds(
      uploadBytes(
        objectRef("owner", "owner", "pdf"),
        new Uint8Array(10 * 1024 * 1024),
        { contentType: "application/pdf" },
      ),
    );
  });

  it("zero、type別上限超過、未許可/欠落MIMEを拒否する", async () => {
    await assertFails(
      uploadBytes(objectRef("owner", "owner", "zero"), new Uint8Array(), {
        contentType: "image/png",
      }),
    );
    await assertFails(
      uploadBytes(
        objectRef("owner", "owner", "large-image"),
        new Uint8Array(5 * 1024 * 1024 + 1),
        { contentType: "image/png" },
      ),
    );
    await assertFails(
      uploadBytes(
        objectRef("owner", "owner", "large-pdf"),
        new Uint8Array(10 * 1024 * 1024 + 1),
        { contentType: "application/pdf" },
      ),
    );
    await assertFails(
      uploadBytes(objectRef("owner", "owner", "text"), new Uint8Array([1]), {
        contentType: "text/plain",
      }),
    );
    await assertFails(
      uploadBytes(
        objectRef("owner", "owner", "missing-type"),
        new Uint8Array([1]),
      ),
    );
  });

  it("wrong uid path、nonmember、unauthenticated createを拒否する", async () => {
    await assertFails(
      uploadBytes(
        objectRef("member", "owner", "wrong-uid"),
        new Uint8Array([1]),
        { contentType: "application/pdf" },
      ),
    );
    await assertFails(
      uploadBytes(
        objectRef("outsider", "outsider", "outsider"),
        new Uint8Array([1]),
        { contentType: "application/pdf" },
      ),
    );
    await assertFails(
      uploadBytes(
        ref(
          testEnv.unauthenticatedContext().storage(),
          "rooms/room-a/attachments/owner/unauth",
        ),
        new Uint8Array([1]),
        { contentType: "application/pdf" },
      ),
    );
  });

  it("句読点を含む各segmentを許可し、segment注入を拒否する", async () => {
    const roomId = "room.team+v1";
    const uid = "owner+team@example.com";
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), `rooms/${roomId}`), {
        name: "Punctuation IDs",
        memberIds: [uid],
        adminIds: [],
      });
    });
    const storage = testEnv.authenticatedContext(uid).storage();
    await assertSucceeds(
      uploadBytes(
        ref(storage, `rooms/${roomId}/attachments/${uid}/file+v1.pdf`),
        new Uint8Array([1]),
        { contentType: "application/pdf" },
      ),
    );
    await assertFails(
      uploadBytes(
        ref(storage, `rooms/${roomId}/attachments/${uid}/nested/file+v1.pdf`),
        new Uint8Array([1]),
        { contentType: "application/pdf" },
      ),
    );
  });

  it("member readを許可し、nonmember/unauthenticated readを拒否する", async () => {
    await assertSucceeds(
      uploadBytes(objectRef("owner"), new Uint8Array([1, 2]), {
        contentType: "application/pdf",
      }),
    );
    await assertSucceeds(getBytes(objectRef("member", "owner")));
    await assertFails(getBytes(objectRef("outsider", "owner")));
    await assertFails(
      getBytes(
        ref(
          testEnv.unauthenticatedContext().storage(),
          "rooms/room-a/attachments/owner/file-1",
        ),
      ),
    );
  });

  it("owner deleteだけを許可し、別member/admin/nonmemberを拒否する", async () => {
    for (const fileId of ["member", "admin", "outsider", "owner"]) {
      await assertSucceeds(
        uploadBytes(objectRef("owner", "owner", fileId), new Uint8Array([1]), {
          contentType: "application/pdf",
        }),
      );
    }
    await assertFails(deleteObject(objectRef("member", "owner", "member")));
    await assertFails(deleteObject(objectRef("admin", "owner", "admin")));
    await assertFails(deleteObject(objectRef("outsider", "owner", "outsider")));
    await assertSucceeds(deleteObject(objectRef("owner", "owner", "owner")));
  });

  it("same-path overwriteを拒否する", async () => {
    await assertSucceeds(
      uploadBytes(
        objectRef("owner", "owner", "overwrite"),
        new Uint8Array([1]),
        { contentType: "application/pdf" },
      ),
    );
    await assertFails(
      uploadBytes(
        objectRef("owner", "owner", "overwrite"),
        new Uint8Array([2]),
        { contentType: "application/pdf" },
      ),
    );
  });

  it("metadata updateを拒否する", async () => {
    await assertSucceeds(
      uploadBytes(
        objectRef("owner", "owner", "metadata-update"),
        new Uint8Array([1]),
        { contentType: "application/pdf" },
      ),
    );
    await assertFails(
      updateMetadata(objectRef("owner", "owner", "metadata-update"), {
        contentType: "image/png",
      }),
    );
  });
});
