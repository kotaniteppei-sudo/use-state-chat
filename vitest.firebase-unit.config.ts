import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // 1. テスト環境の設定（画面がないのでnode環境を指定）
    environment: "node",

    // 2. 実行対象のファイルをFirebase関連のロジックに絞り込む
    include: [
      "tests/unit/**/*-repository.test.ts",
      "tests/unit/**/*-model.test.ts",
      "tests/unit/firebase-*.test.ts",
    ],

    // 3. UIコンポーネント（React）のテストなどを除外する
    exclude: [
      "tests/unit/**/*.test.tsx",
      "tests/unit/health.test.ts",
      "node_modules",
    ],

    // 4. （必要に応じて）テスト実行前に読み込む環境変数やセットアップファイル
    env: {
      NEXT_PUBLIC_FIREBASE_PROJECT_ID: "demo-training-chat",
      NEXT_PUBLIC_USE_FIREBASE_EMULATORS: "true",
    },
  },
});
