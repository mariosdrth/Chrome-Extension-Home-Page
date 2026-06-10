import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as launcher from "chrome-launcher";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const unpackedDir = path.resolve(__dirname, "..", "dist", "unpacked");
const profileDir = path.resolve(__dirname, "..", "dist", "chrome-profile");

async function launch() {
  if (!existsSync(unpackedDir)) {
    console.error(`Unpacked extension not found at: ${unpackedDir}`);
    console.error('Run "npm run bundle" first.');
    process.exit(1);
  }

  const chromeFlags = launcher.Launcher.defaultFlags()
    .filter((flag) => flag !== "--disable-extensions")
    .concat([
      "--remote-debugging-pipe",
      "--enable-unsafe-extension-debugging",
      "--no-first-run",
      "--no-default-browser-check",
    ]);

  const chrome = await launcher.launch({
    chromeFlags,
    ignoreDefaultFlags: true,
    startingUrl: "about:blank",
    userDataDir: profileDir,
  });

  const pipes = chrome.remoteDebuggingPipes;
  if (!pipes) {
    throw new Error("Chrome did not expose remoteDebuggingPipes");
  }

  let nextId = 1;
  const pending = new Map();
  let buffer = "";

  pipes.incoming.on("error", (err) => { throw err; });
  pipes.incoming.on("data", (chunk) => {
    buffer += chunk;
    let end;
    while ((end = buffer.indexOf("\x00")) !== -1) {
      const message = buffer.slice(0, end);
      buffer = buffer.slice(end + 1);
      try {
        const parsed = JSON.parse(message);
        if (parsed.id !== undefined && pending.has(parsed.id)) {
          pending.get(parsed.id)(parsed);
          pending.delete(parsed.id);
        }
      } catch {
        // ignore non-JSON noise
      }
    }
  });

  function sendCommand(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = nextId++;
      pending.set(id, resolve);
      pipes.outgoing.write(JSON.stringify({ id, method, params }) + "\x00");
    });
  }

  const loadResponse = await sendCommand("Extensions.loadUnpacked", { path: unpackedDir });
  if (loadResponse.error) {
    throw new Error(`Failed to load extension: ${loadResponse.error.message}`);
  }

  const { result: { targetInfos } } = await sendCommand("Target.getTargets");
  const blankTarget = targetInfos.find((t) => t.url === "about:blank");

  await sendCommand("Target.createTarget", { url: "chrome://newtab" });

  if (blankTarget) {
    await sendCommand("Target.closeTarget", { targetId: blankTarget.targetId });
  }

  console.log(`Extension loaded from: ${unpackedDir}`);

  chrome.process.on("exit", () => process.exit(0));
}

launch().catch((err) => {
  console.error(err);
  process.exit(1);
});
