import "server-only";

function requireEnvironmentVariable(name: string): string {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }
  return value;
}

export function getServerConfig() {
  return {
    InternalApiToken: requireEnvironmentVariable("INTERNAL_API_TOKEN"),
  } as const;
}
