"use client";

import {
  getApp,
  getApps,
  initializeApp,
  type FirebaseApp,
  type FirebaseOptions,
} from "firebase/app";
import { connectAuthEmulator, getAuth, type Auth } from "firebase/auth";

export type AuthBootstrapSteps<TApp, TAuth> = {
  app(): TApp;
  auth(app: TApp): TAuth;
};

export function initializeAuthInOrder<TApp, TAuth>(
  steps: AuthBootstrapSteps<TApp, TAuth>,
) {
  const firebaseApp = steps.app();
  const auth = steps.auth(firebaseApp);
  return { firebaseApp, auth };
}

const bootstrapGlobal = globalThis as typeof globalThis & {
  trainingCheckpoint14EmulatorApps?: WeakSet<FirebaseApp>;
};

const emulatorApps =
  bootstrapGlobal.trainingCheckpoint14EmulatorApps ??
  new WeakSet<FirebaseApp>();
bootstrapGlobal.trainingCheckpoint14EmulatorApps = emulatorApps;

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

export function bootstrapFirebaseAuth(options: {
  firebaseConfig: FirebaseOptions;
  useEmulator: boolean;
}): { firebaseApp: FirebaseApp; auth: Auth } {
  if (
    options.useEmulator &&
    options.firebaseConfig.projectId !== "demo-training-chat"
  ) {
    throw new Error("Emulatorではdemo-training-chatだけを使用できます。");
  }

  const client = initializeAuthInOrder({
    app: () => defaultFirebaseApp(options.firebaseConfig),
    auth: (firebaseApp) => getAuth(firebaseApp),
  });

  if (options.useEmulator && !emulatorApps.has(client.firebaseApp)) {
    connectAuthEmulator(client.auth, "http://127.0.0.1:9099", {
      disableWarnings: true,
    });
    emulatorApps.add(client.firebaseApp);
  }
  return client;
}
