import { readFile, readdir, stat } from "node:fs/promises";
import path from "node:path";

const probe = process.env.SECRET_PROBE;

if (!probe) {
  throw new Error("SECRET_PROBE is required: use a training-only dummy value.");
}

const roots = [path.resolve(".next/static"), path.resolve(".next/server/app")];
const deliveredExtensions = new Set([".html", ".rsc", ".txt"]);

async function collectDeliveredFiles(target, files = []) {
  const targetStat = await stat(target).catch(() => null);
  if (!targetStat) return files;

  if (targetStat.isFile()) {
    const extension = path.extname(target);
    if (
      target.includes(`${path.sep}.next${path.sep}static${path.sep}`) ||
      deliveredExtensions.has(extension)
    ) {
      files.push(target);
    }
    return files;
  }

  for (const entry of await readdir(target)) {
    await collectDeliveredFiles(path.join(target, entry), files);
  }
  return files;
}

const files = [];
for (const root of roots) {
  const rootStat = await stat(root).catch(() => null);
  if (!rootStat?.isDirectory()) {
    throw new Error(
      `Expected build output directory is missing: ${path.relative(".", root)}`,
    );
  }
  await collectDeliveredFiles(root, files);
}

if (files.length === 0) {
  throw new Error(
    "No client-delivered build files were found; run npm run build first.",
  );
}

const leakedFiles = [];
for (const file of files) {
  const content = await readFile(file);
  if (content.includes(Buffer.from(probe))) {
    leakedFiles.push(path.relative(".", file));
  }
}

if (leakedFiles.length > 0) {
  throw new Error(
    `Server secret found in client-delivered output: ${leakedFiles.join(",")}`,
  );
}

console.log(
  `Secret probe was absent from ${files.length} client-delivered build files.`,
);
