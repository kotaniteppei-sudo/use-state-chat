import nextEnvironment from "@next/env";
const { loadEnvConfig } = nextEnvironment;
loadEnvConfig(process.cwd());

const requireServerVariables = ["NEXT_PUBLIC_FIREBASE_API_KEY"];

const missingVariables = requireServerVariables.filter(
  (name) => !process.env[name]?.trim(),
);

if (missingVariables.length > 0) {
  throw new Error(
    `Missing required server environment variables: ${missingVariables.join(",")}`,
  );
}
