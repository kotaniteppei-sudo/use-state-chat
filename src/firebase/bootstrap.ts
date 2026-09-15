"use client";

import {
  getApp,
  getApps,
  initializeApp,
  type FirebaseApp,
  type FirebaseOptions,
} from "firebase/app";
import { connectAuthEmulator, getAuth, type Auth } from "firebase/auth";
import {
  connectFirestoreEmulator,
  getFirestore,
  type Firestore,
} from "firebase/firestore";
import {
  connectStorageEmulator,
  getStorage,
  type FirebaseStorage,
} from "firebase/storage";

export type FirebaseBootstrapSteps<TApp, TAuth, TDb, TStorage> = {
  app(): TApp;
  auth(app: TApp): TAuth;
  firestore(app: TApp): TDb;
  storage(app: TApp): TStorage;
};

export function initializeFirebaseInOrder<TApp, TAuth, TDb, TStorage>(
  steps: FirebaseBootstrapSteps<TApp, TAuth, TDb, TStorage>,
) {
  const firebaseApp = steps.app();
  const auth = steps.auth(firebaseApp);
  const db = steps.firestore(firebaseApp);
  const storage = steps.storage(firebaseApp);
  return { firebaseApp, auth, db, storage };
}

const bootstrapGlobal = globalThis as typeof globalThis & {
  trainingCheckpoint17EmulatorApps?: WeakSet<FirebaseApp>;
};
const emulatorApps =
  bootstrapGlobal.trainingCheckpoint17EmulatorApps ??
  new WeakSet<FirebaseApp>();
bootstrapGlobal.trainingCheckpoint17EmulatorApps = emulatorApps;

function defaultFirebaseApp(config: FirebaseOptions): FirebaseApp {
  const existing = getApps().find(
    (candidate) => candidate.name === "[DEFAULT]",
  );
  if (!existing) return initializeApp(config);
  if (existing.options.projectId !== config.projectId) {
    throw new Error("既存Firebase appのproject IDが設定と一致しません。");
  }
  return getApp();
}

export function bootstrapFirebaseClient(options: {
  firebaseConfig: FirebaseOptions;
  useEmulators: boolean;
}): {
  firebaseApp: FirebaseApp;
  auth: Auth;
  db: Firestore;
  storage: FirebaseStorage;
} {
  if (
    options.useEmulators &&
    options.firebaseConfig.projectId !== "demo-training-chat"
  ) {
    throw new Error("Emulatorではdemo-training-chatだけを使用できます。");
  }

  const client = initializeFirebaseInOrder({
    app: () => defaultFirebaseApp(options.firebaseConfig),
    auth: (firebaseApp) => getAuth(firebaseApp),
    firestore: (firebaseApp) => getFirestore(firebaseApp),
    storage: (firebaseApp) => getStorage(firebaseApp),
  });

  if (options.useEmulators && !emulatorApps.has(client.firebaseApp)) {
    connectAuthEmulator(client.auth, "http://127.0.0.1:9099", {
      disableWarnings: true,
    });
    connectFirestoreEmulator(client.db, "127.0.0.1", 8080);
    connectStorageEmulator(client.storage, "127.0.0.1", 9199);
    emulatorApps.add(client.firebaseApp);
  }

  return client;
}
