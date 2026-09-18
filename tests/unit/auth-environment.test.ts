import { FirebaseError } from "firebase/app";
import { afterEach, describe, expect, it, vi } from "vitest";
import { toAuthErrorMessages } from "../../src/auth/authErrors";
import { assertTrainingEnvironment } from "../../src/environment/clientGuard";
import { assertServerTrainingProject } from "../../src/environment/serverGuard";

vi.mock("server-only", () => ({}));

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("auth error and environment guards", () => {
  it("既知Auth codeを利用者向け文へ変換する", () => {
    expect(
      toAuthErrorMessages(
        new FirebaseError("auth/invalid-credential", "internal"),
      ),
    ).toBe("メールアドレスまたはパスワードを確認してください。");
  });

  it("未知errorの内部詳細を表示しない", () => {
    expect(toAuthErrorMessages(new Error("secret detail"))).not.toContain(
      "secret",
    );
  });

  it("trainingかつproject一致だけを許可する", () => {
    expect(() =>
      assertTrainingEnvironment({
        NEXT_PUBLIC_APP_ENV: "training",
        NEXT_PUBLIC_FIREBASE_PROJECT_ID: "demo-training-chat",
        NEXT_PUBLIC_EXPECTED_FIREBASE_PROJECT_ID: "demo-training-chat",
      }),
    ).not.toThrow();

    expect(() =>
      assertTrainingEnvironment({
        NEXT_PUBLIC_APP_ENV: "production",
        NEXT_PUBLIC_FIREBASE_PROJECT_ID: "production-a",
        NEXT_PUBLIC_EXPECTED_FIREBASE_PROJECT_ID: "production-a",
      }),
    ).toThrow(/研修用project/);
    expect(() =>
      assertTrainingEnvironment({
        NEXT_PUBLIC_APP_ENV: "training",
        NEXT_PUBLIC_FIREBASE_PROJECT_ID: "demo-training-chat",
        NEXT_PUBLIC_EXPECTED_FIREBASE_PROJECT_ID: "demo-other",
      }),
    ).toThrow(/研修用project/);
    expect(() =>
      assertTrainingEnvironment({
        NEXT_PUBLIC_APP_ENV: "training",
        NEXT_PUBLIC_FIREBASE_PROJECT_ID: "",
        NEXT_PUBLIC_EXPECTED_FIREBASE_PROJECT_ID: "demo-training-chat",
      }),
    ).toThrow(/研修用project/);
  });

  it("server allowlistに含まれるprojectだけを許可する", () => {
    expect(() =>
      assertServerTrainingProject(
        "demo-training-chat",
        "demo-other, demo-training-chat",
      ),
    ).not.toThrow();
  });

  it("server allowlistが空なら拒否する", () => {
    expect(() => assertServerTrainingProject("demo-training-chat", "")).toThrow(
      "project not allowed",
    );
  });

  it("server allowlistにないprojectを拒否する", () => {
    expect(() =>
      assertServerTrainingProject("production-project", "demo-training-chat"),
    ).toThrow("project not allowed");
  });

  it("server allowlistの既定値を環境変数から読む", () => {
    vi.stubEnv("ALLOWED_TRAINING_PROJECT_IDS", "demo-training-chat");
    expect(() =>
      assertServerTrainingProject("demo-training-chat"),
    ).not.toThrow();
  });
});
