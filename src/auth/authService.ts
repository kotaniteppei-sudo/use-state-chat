import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  type Auth,
  type UserCredential,
} from "firebase/auth";

export function createAuthService(auth: Auth) {
  return {
    register(email: string, password: string): Promise<UserCredential> {
      return createUserWithEmailAndPassword(auth, email, password);
    },
    login(email: string, password: string): Promise<UserCredential> {
      return signInWithEmailAndPassword(auth, email, password);
    },
    logout(): Promise<void> {
      return signOut(auth);
    },
  };
}
