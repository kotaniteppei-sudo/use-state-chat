import pluginJs from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import reactRefresh from "eslint-plugin-react-refresh";

export default tseslint.config(
  { ignores: ["dist", "node_modules", ".next"] },
  pluginJs.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["src/**/*.{ts,tsx}"],
    // extends: [
    //   js.configs.recommended,
    //   tseslint.configs.recommended,
    //   reactHooks.configs.flat.recommended,
    //   reactRefresh.configs.vite,
    // ],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },
      parserOptions: {
        project: true,
      },
    },
    plugins: {
      "react-refresh": reactRefresh,
    },
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
    },
  },
  {
    files: ["scripts/**/*.mjs", "exlint.config.mjs"],
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
  },
);
