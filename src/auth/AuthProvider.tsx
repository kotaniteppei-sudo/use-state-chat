"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { onAuthStateChanged, type Auth, type User } from "firebase/auth";

export type AuthState =
  | { status: "initializing" | "signedOut"; user: null }
  | { status: "signedIn"; user: User };

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({
  auth,
  children,
}: {
  auth: Auth;
  children: ReactNode;
}) {
  const [state, setState] = useState<AuthState>({
    status: "initializing",
    user: null,
  });

  useEffect(
    () =>
      onAuthStateChanged(auth, (user) => {
        setState(
          user
            ? { status: "signedIn", user }
            : { status: "signedOut", user: null },
        );
      }),
    [auth],
  );

  return <AuthContext.Provider value={state}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const value = useContext(AuthContext);
  if (value === null)
    throw new Error("useAuth must be used inside AuthProvider");
  return value;
}
