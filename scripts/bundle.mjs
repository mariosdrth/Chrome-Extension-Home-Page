import { createWriteStream } from "node:fs";
import { access, mkdir, rm } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import archiver from "archiver";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");
const distDir = path.join(rootDir, "dist");
const unpackedDir = path.join(distDir, "unpacked");
const zipPath = path.join(distDir, "chrome-extension-home-page.zip");

async function assertBuildExists() {
  try {
    await access(path.join(unpackedDir, "manifest.json"));
    await access(path.join(unpackedDir, "newtab.html"));
  } catch {
    throw new Error('Build output not found. Run "npm run build" first.');
  }
}

function createZip() {
  return new Promise((resolve, reject) => {
    const output = createWriteStream(zipPath);
    const archive = archiver("zip", { zlib: { level: 9 } });

    output.on("close", resolve);
    output.on("error", reject);
    archive.on("error", reject);

    archive.pipe(output);
    archive.directory(unpackedDir, false);
    archive.finalize();
  });
}

async function main() {
  await mkdir(distDir, { recursive: true });
  await rm(zipPath, { force: true });
  await assertBuildExists();
  await createZip();

  console.log("Bundle ready:");
  console.log(`- Unpacked: ${unpackedDir}`);
  console.log(`- Zip: ${zipPath}`);
}

main().catch((error) => {
  console.error("Failed to bundle extension:", error);
  process.exit(1);
});
