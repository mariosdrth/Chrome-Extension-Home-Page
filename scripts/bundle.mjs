import { createWriteStream } from "node:fs";
import { copyFile, mkdir, rm } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import archiver from "archiver";
import chokidar from "chokidar";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");
const distDir = path.join(rootDir, "dist");
const unpackedDir = path.join(distDir, "unpacked");
const zipPath = path.join(distDir, "chrome-extension-home-page.zip");

const extensionFiles = ["manifest.json", "newtab.html", "newtab.js", "styles.css"];
const runMode = process.argv[2] ?? "bundle";

async function createBuildFolders() {
  await rm(unpackedDir, { recursive: true, force: true });
  await mkdir(unpackedDir, { recursive: true });
}

async function copyExtensionFiles() {
  await Promise.all(
    extensionFiles.map((file) => {
      const sourcePath = path.join(rootDir, file);
      const targetPath = path.join(unpackedDir, file);
      return copyFile(sourcePath, targetPath);
    })
  );
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

async function build({ includeZip }) {
  await createBuildFolders();
  await copyExtensionFiles();

  if (includeZip) {
    await createZip();
  }
}

function logBuildResult({ includeZip }) {
  console.log("Build ready:");
  console.log(`- Unpacked: ${unpackedDir}`);

  if (includeZip) {
    console.log(`- Zip: ${zipPath}`);
  }
}

async function runBundleMode() {
  await build({ includeZip: true });
  logBuildResult({ includeZip: true });
}

async function runWatchMode() {
  await build({ includeZip: false });
  logBuildResult({ includeZip: false });

  console.log("Watching for changes...");

  let isBuilding = false;
  let pendingBuild = false;

  const rebuild = async () => {
    if (isBuilding) {
      pendingBuild = true;
      return;
    }

    isBuilding = true;
    try {
      await build({ includeZip: false });
      logBuildResult({ includeZip: false });
    } catch (error) {
      console.error("Rebuild failed:", error);
    } finally {
      isBuilding = false;
      if (pendingBuild) {
        pendingBuild = false;
        void rebuild();
      }
    }
  };

  const watcher = chokidar.watch(extensionFiles, {
    cwd: rootDir,
    ignoreInitial: true,
  });

  watcher.on("all", (eventName, filePath) => {
    console.log(`Change detected (${eventName}): ${filePath}`);
    void rebuild();
  });
}

async function main() {
  if (runMode === "watch") {
    await runWatchMode();
    return;
  }

  if (runMode === "bundle") {
    await runBundleMode();
    return;
  }

  console.error('Invalid mode. Use "bundle" or "watch".');
  process.exit(1);
}

main().catch((error) => {
  console.error("Failed to bundle extension:", error);
  process.exit(1);
});
