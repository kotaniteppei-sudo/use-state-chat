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

export type FirebaseBootstrapSteps<TApp, TAuth, TDb> = {
  app(): TApp;
  auth(app: TApp): TAuth;
  firestore(app: TApp): TDb;
};

export function initializeFirebaseInOrder<TApp, TAuth, TDb>(
  steps: FirebaseBootstrapSteps<TApp, TAuth, TDb>,
) {
  const firebaseApp = steps.app();
  const auth = steps.auth(firebaseApp);
  const db = steps.firestore(firebaseApp);
  return { firebaseApp, auth, db };
}

const bootstrapGlobal = globalThis as typeof globalThis & {
  __trainingCheckpoint15EmulatorApps?: WeakSet<FirebaseApp>;
};

const emulatorApps =
  bootstrapGlobal.__trainingCheckpoint15EmulatorApps ??
  new WeakSet<FirebaseApp>();
bootstrapGlobal.__trainingCheckpoint15EmulatorApps = emulatorApps;

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
}): { firebaseApp: FirebaseApp; auth: Auth; db: Firestore } {
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
  });

  if (options.useEmulators && !emulatorApps.has(client.firebaseApp)) {
    connectAuthEmulator(client.auth, "http://127.0.0.1:9099", {
      disableWarnings: true,
    });
    connectFirestoreEmulator(client.db, "127.0.0.1", 8080);
    emulatorApps.add(client.firebaseApp);
  }
  return client;
}
