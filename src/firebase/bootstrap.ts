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

import {
  initializeAppCheck,
  ReCaptchaEnterpriseProvider,
  type AppCheck,
} from "firebase/app-check";

export type OrderedBootstrapSteps<TApp, TAppCheck, TAuth, TDb, TStorage> = {
  app(): TApp;
  appCheck(app: TApp): TAppCheck;
  auth(app: TApp): TAuth;
  firestore(app: TApp): TDb;
  storage(app: TApp): TStorage;
};

export function initializeInAppCheckOrder<
  TApp,
  TAppCheck,
  TAuth,
  TDb,
  TStorage,
>(steps: OrderedBootstrapSteps<TApp, TAppCheck, TAuth, TDb, TStorage>) {
  const firebaseApp = steps.app();
  const appCheck = steps.appCheck(firebaseApp);
  const auth = steps.auth(firebaseApp);
  const db = steps.firestore(firebaseApp);
  const storage = steps.storage(firebaseApp);
  return { firebaseApp, appCheck, auth, db, storage };
}

export type FirebaseClient = {
  firebaseApp: FirebaseApp;
  appCheck: AppCheck | undefined;
  auth: Auth;
  db: Firestore;
  storage: FirebaseStorage;
};

type FirebaseBootstrapCache = {
  appCheckByApp: WeakMap<FirebaseApp, AppCheck>;
  emulatorApps: WeakSet<FirebaseApp>;
};

const bootstrapGlobal = globalThis as typeof globalThis & {
  _trainingStage3FirebaseBootstrapCache?: FirebaseBootstrapCache;
};

const bootstrapCache =
  bootstrapGlobal._trainingStage3FirebaseBootstrapCache ?? {
    appCheckByApp: new WeakMap<FirebaseApp, AppCheck>(),
    emulatorApps: new WeakSet<FirebaseApp>(),
  };
bootstrapGlobal._trainingStage3FirebaseBootstrapCache = bootstrapCache;
const { appCheckByApp, emulatorApps } = bootstrapCache;

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
  appCheckSiteKey?: string;
  useEmulators: boolean;
}): FirebaseClient {
  const enableAppCheck = typeof window !== "undefined" && !options.useEmulators;
  if (enableAppCheck && !options.appCheckSiteKey) {
    throw new Error("App Check site keyが未設定です。");
  }
  const client = initializeInAppCheckOrder({
    app: () => defaultFirebaseApp(options.firebaseConfig),
    appCheck: (firebaseApp) => {
      let appCheck = appCheckByApp.get(firebaseApp);
      if (enableAppCheck && !appCheck) {
        appCheck = initializeAppCheck(firebaseApp, {
          provider: new ReCaptchaEnterpriseProvider(options.appCheckSiteKey!),
          isTokenAutoRefreshEnabled: true,
        });
        appCheckByApp.set(firebaseApp, appCheck);
      }
      return appCheck;
    },
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
