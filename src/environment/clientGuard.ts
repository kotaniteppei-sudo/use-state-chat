type PublicTrainingEnvironment = Pick<
  NodeJS.ProcessEnv,
  | "NEXT_PUBLIC_APP_ENV"
  | "NEXT_PUBLIC_FIREBASE_PROJECT_ID"
  | "NEXT_PUBLIC_EXPECTED_FIREBASE_PROJECT_ID"
>;

function bundledPublicEnvironment(): PublicTrainingEnvironment {
  return {
    NEXT_PUBLIC_APP_ENV: process.env.NEXT_PUBLIC_APP_ENV,
    NEXT_PUBLIC_FIREBASE_PROJECT_ID:
      process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    NEXT_PUBLIC_EXPECTED_FIREBASE_PROJECT_ID:
      process.env.NEXT_PUBLIC_EXPECTED_FIREBASE_PROJECT_ID,
  };
}

export function assertTrainingEnvironment(
  environment: PublicTrainingEnvironment = bundledPublicEnvironment(),
): void {
  const appEnvironment = environment.NEXT_PUBLIC_APP_ENV;
  const project = environment.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const expected = environment.NEXT_PUBLIC_EXPECTED_FIREBASE_PROJECT_ID;
  if (appEnvironment !== "training" || !project || project !== expected) {
    throw new Error("研修用project設定の一致を確認してください。");
  }
}
