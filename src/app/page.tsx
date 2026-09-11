"use client";

import { AuthForm } from "@/auth/AuthForm";
import { AuthProvider, useAuth } from "@/auth/AuthProvider";
import { createAuthService } from "@/auth/authService";
import { bootstrapFirebaseClient } from "../firebase/bootstrap";
import { SimpleUploader } from "./SimpleUploader";

const { auth } = bootstrapFirebaseClient({
  firebaseConfig: {
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  },
  useEmulators: process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATORS === "true",
});

const authService = createAuthService(auth);

function LoggedInView() {
  const { user } = useAuth();
  if (!user) return null;

  return (
    <div style={{ padding: "20px", border: "2px solid green" }}>
      <h2>ログイン成功！</h2>
      <p>あなたのUID: {user.uid}</p>
      <button onClick={() => authService.logout()}>ログアウト</button>
    </div>
  );
}

function AppContent() {
  const { status } = useAuth();

  if (status === "initializing") return <p>読み込み中...</p>;

  if (status === "signedIn") {
    return <LoggedInView />;
  }

  return (
    <>
      <div style={{ padding: "20px", border: "2px solid blue" }}>
        <h2>ログイン / 新規登録</h2>
        <AuthForm service={authService} />
      </div>
      <div>
        <SimpleUploader />
      </div>
    </>
  );
}

export default function Page() {
  return (
    <AuthProvider auth={auth}>
      <AppContent />
    </AuthProvider>
  );
}
