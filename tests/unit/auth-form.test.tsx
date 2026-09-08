import { createElement } from "react";
import { FirebaseError } from "firebase/app";
import TestRenderer, { act } from "react-test-renderer";
import { describe, expect, it, vi } from "vitest";
import { AuthForm, type AuthFormService } from "../../src/auth/AuthForm";

(
  globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

function deferred() {
  let resolve!: () => void;
  const promise = new Promise<void>((resolvePromise) => {
    resolve = resolvePromise;
  });
  return { promise, resolve };
}

async function enterCredentials(
  renderer: TestRenderer.ReactTestRenderer,
  email: string,
  password: string,
) {
  const [emailInput, passwordInput] = renderer.root.findAllByType("input");

  await act(async () => {
    emailInput?.props.onChange({ target: { value: email } });
    passwordInput?.props.onChange({ target: { value: password } });
  });
}

describe("AuthForm", () => {
  it("送信中の二重実行を防ぎ、login/registerをserviceへ委譲する", async () => {
    const pending = deferred();
    const service: AuthFormService = {
      login: vi.fn(() => pending.promise),
      register: vi.fn(async () => undefined),
    };

    let renderer: TestRenderer.ReactTestRenderer;
    await act(async () => {
      renderer = TestRenderer.create(createElement(AuthForm, { service }));
    });

    await enterCredentials(renderer!, " user@example.test ", "password");
    const preventDefault = vi.fn();
    const submit = renderer!.root.findByType("form").props.onSubmit;
    await act(async () => {
      void submit({ preventDefault });
      void submit({ preventDefault });
      await Promise.resolve();
    });

    expect(service.login).toHaveBeenCalledOnce();
    expect(service.login).toHaveBeenCalledWith("user@example.test", "password");
    expect(renderer!.root.findByProps({ type: "submit" }).props.disabled).toBe(
      true,
    );

    await act(async () => pending.resolve());
    expect(renderer!.root.findByProps({ type: "submit" }).props.disabled).toBe(
      false,
    );

    await act(async () => {
      renderer!.root.findByProps({ type: "button" }).props.onClick();
    });
    await enterCredentials(renderer!, "new@example.test", "new-password");
    await act(async () => {
      await renderer!.root
        .findByType("form")
        .props.onSubmit({ preventDefault });
    });
    expect(service.register).toHaveBeenCalledWith(
      "new@example.test",
      "new-password",
    );
    await act(async () => renderer!.unmount());
  });

  it("Firebase内部errorを利用者向け文言へ変換し、passwordを保持する", async () => {
    const service: AuthFormService = {
      login: vi.fn(async () => {
        throw new FirebaseError("auth/invalid-credential", "internal detail");
      }),
      register: vi.fn(async () => undefined),
    };
    let renderer: TestRenderer.ReactTestRenderer;
    await act(async () => {
      renderer = TestRenderer.create(createElement(AuthForm, { service }));
    });

    await enterCredentials(renderer!, "user@example.test", "wrong-password");
    await act(async () => {
      await renderer!.root
        .findByType("form")
        .props.onSubmit({ preventDefault: vi.fn() });
    });
    const alert = renderer!.root.findByProps({ role: "alert" });
    expect(alert.children.join("")).toBe(
      "メールアドレスまたはパスワードを確認してください。",
    );

    expect(alert.children.join("")).not.toContain("internal detail");
    expect(renderer!.root.findByProps({ name: "password" }).props.value).toBe(
      "wrong-password",
    );
    await act(async () => renderer!.unmount());
  });
});
