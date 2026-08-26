import nextEnvironment from "@next/env";
const { loadEnvConfig } = nextEnvironment;
loadEnvConfig(process.cwd());

const requireServerVariables = ["INTERNAL_API_TOKEN"];

const missingVariables = requireServerVariables.filter(
  (name) => !process.env[name]?.trim(),
);

if (missingVariables.length > 0) {
  throw new Error(
    `Missing required server environment variables: ${missingVariables.join(",")}`,
  );
}
