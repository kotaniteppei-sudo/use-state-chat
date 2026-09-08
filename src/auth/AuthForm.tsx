"use script";

import { type FormEvent, useRef, useState } from "react";
import { toAuthErrorMessages } from "./authErrors";

export type AuthFormService = {
  login(email: string, password: string): Promise<unknown>;
  register(email: string, password: string): Promise<unknown>;
};

type AuthMode = "login" | "register";

export function AuthForm({ service }: { service: AuthFormService }) {
  const [mode, setMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const submittingRef = useRef(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submittingRef.current) return;
    submittingRef.current = true;
    setSubmitting(true);
    setErrorMessage(null);

    try {
      const submit = mode === "login" ? service.login : service.register;
      await submit(email.trim(), password);

      setPassword("");
    } catch (error: unknown) {
      setErrorMessage(toAuthErrorMessages(error));
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  }

  function toggleMode() {
    if (submittingRef.current) return;

    setMode((current) => (current === "login" ? "register" : "login"));
    setErrorMessage(null);
  }

  return (
    <form onSubmit={handleSubmit} aria-busy={submitting}>
      <label>
        メールアドレス
        <input
          name="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          disabled={submitting}
        />
      </label>
      <label>
        パスワード
        <input
          name="password"
          type="password"
          autoComplete={mode === "login" ? "current-password" : "new-password"}
          required
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          disabled={submitting}
        />
      </label>
      <button type="submit" disabled={submitting}>
        {submitting ? "送信中..." : mode === "login" ? "ログイン" : "登録"}
      </button>
      <button type="button" onClick={toggleMode} disabled={submitting}>
        {mode === "login" ? "登録へ切替" : "ログインへ切替"}
      </button>
      {errorMessage && <p role="alert">{errorMessage}</p>}
    </form>
  );
}
