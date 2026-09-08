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
    InternalApiToken: requireEnvironmentVariable(
      "NEXT_PUBLIC_FIREBASE_API_KEY",
    ),
  } as const;
}
