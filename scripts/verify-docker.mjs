import { spawn } from "node:child_process";
import { createServer } from "node:net";
import { setTimeout as delay } from "node:timers/promises";

const image = "training-lesson-20";
const container = `training-lesson-20-verify-${process.pid}`;

function runDocker(argumentsList, { capture = false } = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn("docker", argumentsList, {
      cwd: process.cwd(),
      stdio: capture ? ["ignore", "pipe", "pipe"] : "inherit",
      windowsHide: true,
    });
    let stdout = "";
    let stderr = "";
    if (capture) {
      child.stdout.setEncoding("utf8");
      child.stderr.setEncoding("utf8");
      child.stdout.on("data", (chunk) => {
        stdout += chunk;
      });
      child.stderr.on("data", (chunk) => {
        stderr += chunk;
      });
    }
    child.once("error", reject);
    child.once("close", (code) => {
      if (code === 0) {
        resolve(stdout.trim());
      } else {
        reject(
          new Error(
            `docker ${argumentsList.join(" ")} failed (${code}): ${stderr.trim()}`,
          ),
        );
      }
    });
  });
}

function reserveFreePort() {
  return new Promise((resolve, reject) => {
    const server = createServer();
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      if (address === null || typeof address === "string") {
        server.close();
        reject(new Error("検証用portを確保できませんでした"));
        return;
      }
      server.close((error) => (error ? reject(error) : resolve(address.port)));
    });
  });
}

async function waitForHealth(port) {
  const url = `http://127.0.0.1:${port}/api/health`;
  let lastError = new Error("health endpointが応答しませんでした");
  for (let attempt = 1; attempt < 20; attempt += 1) {
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(1_000) });
      const body = await response.json();
      if (!response.ok || body.status !== "ok") {
        throw new Error(`HTTP ${response.status}: ${JSON.stringify(body)}`);
      }
      return body;
    } catch (error) {
      lastError = error;
      await delay(500);
    }
  }
  throw new Error(`${url}: ${lastError.message}`);
}

const hostPort = await reserveFreePort();
let started = false;
let primaryError;
let cleanupError;

try {
  await runDocker([
    "build",
    "-t",
    image,
    "--build-arg",
    "NEXT_PUBLIC_APP_ENV=training",
    "--build-arg",
    "NEXT_PUBLIC_EXPECTED_FIREBASE_PROJECT_ID=demo-training-chat",
    "--build-arg",
    "NEXT_PUBLIC_FIREBASE_PROJECT_ID=demo-training-chat",
    "--build-arg",
    "NEXT_PUBLIC_FIREBASE_API_KEY=demo-api-key",
    "--build-arg",
    "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=demo-training-chat.firebaseapp.com",
    "--build-arg",
    "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=demo-training-chat.firebasestorage.app",
    "--build-arg",
    "NEXT_PUBLIC_FIREBASE_APP_ID=1:000000000000:web:demo",
    ".",
  ]);
  await runDocker(
    [
      "run",
      "--detach",
      "--rm",
      "--name",
      container,
      "--publish",
      `127.0.0.1:${hostPort}:8080`,
      image,
    ],
    { capture: true },
  );
  started = true;

  const uid = await runDocker(["exec", container, "id", "-u"], {
    capture: true,
  });
  if (uid !== "1000")
    throw new Error(`container UIDは1000である必要があります: ${uid}`);

  const health = await waitForHealth(hostPort);
  console.log(
    `Docker verification passed: uid=${uid} health=${JSON.stringify(health)}`,
  );
} catch (error) {
  primaryError = error;
} finally {
  if (started) {
    try {
      await runDocker(["stop", container], { capture: true });
    } catch (error) {
      cleanupError = error;
    }
  }
}

if (primaryError) throw primaryError;
if (cleanupError) throw cleanupError;
