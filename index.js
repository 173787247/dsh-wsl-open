import { existsSync, realpathSync, statSync } from "node:fs";
import { homedir } from "node:os";
import { resolve } from "node:path";
import { execFile } from "node:child_process";
import {
  detectWsl,
  distroName,
  isSafeLinuxPath,
  isWithin,
  toWindowsPath,
} from "./lib/windows-path.js";

export const name = "dsh-wsl-open";
export const inject = ["webServer", "sessions"];

const MAX_BODY_BYTES = 32 * 1024;

export function apply(ctx, config = {}) {
  const enabled = config.enabled !== false;
  const webServer = ctx.webServer;
  const sessions = ctx.sessions;
  if (!enabled || webServer === undefined) {
    if (!enabled) console.log("[dsh-wsl-open] disabled");
    return;
  }

  const wsl = detectWsl();
  if (!wsl) {
    console.log("[dsh-wsl-open] not running in WSL; Windows open is skipped");
  } else {
    console.log(`[dsh-wsl-open] loaded distro=${distroName()}`);
  }

  ctx.effect(() => webServer.register({
    kind: "exact",
    path: "/api/wsl-open/open",
    handler: async (req, res) => {
      try {
        if (!isSameOrigin(req)) {
          writeJson(res, 403, { ok: false, error: "forbidden" });
          return;
        }
        if (!wsl) {
          writeJson(res, 501, { ok: false, error: "not WSL" });
          return;
        }
        const body = await readBody(req, MAX_BODY_BYTES);
        const sessionId = typeof body.sessionId === "string" ? body.sessionId : "";
        const raw = typeof body.path === "string" ? body.path.trim() : "";
        if (!raw) {
          writeJson(res, 400, { ok: false, error: "missing path" });
          return;
        }

        const cwd = sessionCwd(sessions, sessionId);
        const abs = resolveLinux(raw, cwd);
        if (!abs || !isSafeLinuxPath(abs) || !isProbeable(abs, cwd)) {
          writeJson(res, 404, { ok: false, error: "path not allowed" });
          return;
        }
        if (!existsSync(abs)) {
          writeJson(res, 404, { ok: false, error: "path not found" });
          return;
        }

        const real = realpathSync(abs);
        if (!isProbeable(real, cwd)) {
          writeJson(res, 404, { ok: false, error: "path not allowed" });
          return;
        }

        const winPath = await linuxToWindows(real);
        if (!winPath) {
          writeJson(res, 500, { ok: false, error: "could not map to a Windows path" });
          return;
        }

        const opened = await openOnWindows(nativeWinPath(winPath), statSync(real).isDirectory());
        if (!opened) {
          writeJson(res, 500, { ok: false, error: "Windows open failed", windowsPath: winPath });
          return;
        }
        writeJson(res, 200, { ok: true, windowsPath: winPath });
      } catch (err) {
        writeJson(res, 500, { ok: false, error: err instanceof Error ? err.message : String(err) });
      }
    },
  }), "dsh-wsl-open: open");
}

function sessionCwd(sessions, sessionId) {
  if (!sessionId || sessions === undefined || typeof sessions.get !== "function") return "";
  try {
    const session = sessions.get(sessionId);
    const cwd = session && session.header && session.header.cwd;
    return typeof cwd === "string" ? cwd : "";
  } catch {
    return "";
  }
}

function resolveLinux(path, cwd) {
  if (path.startsWith("~/")) return `${homedir()}${path.slice(1)}`;
  if (path.startsWith("/")) return path;
  if (cwd) return resolve(cwd, path);
  return "";
}

function isProbeable(abs, cwd) {
  const home = homedir();
  if (home && home !== "/" && isWithin(home, abs)) return true;
  if (cwd && isWithin(cwd, abs)) return true;
  if (isWithin("/mnt/c/Users", abs) || isWithin("/mnt/d/Users", abs)) return true;
  return false;
}

function linuxToWindows(abs) {
  return new Promise((resolveWin) => {
    execFile("wslpath", ["-w", abs], { timeout: 5000 }, (err, stdout) => {
      const mapped = err ? "" : String(stdout || "").trim().replace(/\r/g, "");
      if (mapped) {
        resolveWin(mapped);
        return;
      }
      resolveWin(toWindowsPath(abs));
    });
  });
}

function nativeWinPath(winPath) {
  if (/^[A-Za-z]:/.test(winPath)) return winPath.replace(/\//g, "\\");
  return winPath;
}

function windowsSpawned(err) {
  // explorer.exe often exits 1 after reusing a window; ENOENT is a string code.
  return !err || typeof err.code === "number";
}

function openOnWindows(winPath, isDir) {
  return new Promise((resolveOpen) => {
    const explore = (next) => {
      execFile("explorer.exe", [winPath], { timeout: 15000 }, (err) => {
        if (windowsSpawned(err)) resolveOpen(true);
        else if (next) next();
        else resolveOpen(false);
      });
    };
    const start = (next) => {
      execFile("cmd.exe", ["/c", "start", "", winPath], { timeout: 15000 }, (err) => {
        if (windowsSpawned(err)) resolveOpen(true);
        else if (next) next();
        else resolveOpen(false);
      });
    };
    if (isDir) explore(() => start(null));
    else start(() => explore(null));
  });
}

function isSameOrigin(req) {
  const origin = req.headers.origin || "";
  if (origin !== "") return /^https?:\/\/(127\.0\.0\.1|localhost)(:\d+)?$/.test(origin);
  const host = req.headers.host || "";
  return /^(127\.0\.0\.1|localhost)(:\d+)?$/.test(host);
}

function readBody(req, maxBytes) {
  return new Promise((resolveBody, reject) => {
    const chunks = [];
    let total = 0;
    let aborted = false;
    req.on("data", (chunk) => {
      total += chunk.length;
      if (total > maxBytes) {
        aborted = true;
        req.destroy();
        reject(new Error("request body too large"));
        return;
      }
      chunks.push(chunk);
    });
    req.on("end", () => {
      if (aborted) return;
      try {
        const text = Buffer.concat(chunks).toString("utf8");
        resolveBody(text === "" ? {} : JSON.parse(text));
      } catch (err) {
        reject(err);
      }
    });
    req.on("error", reject);
  });
}

function writeJson(res, status, body) {
  res.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store",
  });
  res.end(JSON.stringify(body));
}
