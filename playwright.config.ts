import { defineConfig, devices } from "@playwright/test";
const baseURL = "http://127.0.0.1:3413";
export default defineConfig({
  testDir: "./tests/e2e",
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: "list",
  use: {
    baseURL,
    trace: "retain-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: process.env.PLAYWRIGHT_EXTERNAL_SERVER
    ? undefined
    : {
        command: "npm run start -- --hostname 127.0.0.1 --port 3413",
        url: baseURL,
        reuseExistingServer: false,
        timeout: 120_000,
        env: {
          INTERNAL_API_TOKEN: "e2e-server-only-probe",
          NEXT_PUBLIC_APP_NAME: "Team Chat",
        },
      },
});
