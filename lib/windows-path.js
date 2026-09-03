import { existsSync, readFileSync } from "node:fs";

const WINDOWS_BINS = {
  "cmd.exe": ["/mnt/c/Windows/System32/cmd.exe"],
  "explorer.exe": ["/mnt/c/Windows/explorer.exe"],
  "powershell.exe": ["/mnt/c/Windows/System32/WindowsPowerShell/v1.0/powershell.exe"],
};

/** Resolve a Windows exe even when PATH has no /mnt/c/Windows. */
export function windowsBin(name, { exists = existsSync } = {}) {
  for (const p of WINDOWS_BINS[name] || []) {
    if (exists(p)) return p;
  }
  return name;
}

export function detectWsl({ env = process.env, readRelease = readOsRelease } = {}) {
  if (env.WSL_DISTRO_NAME || env.WSL_INTEROP) return true;
  try {
    return /microsoft/i.test(readRelease());
  } catch {
    return false;
  }
}

export function distroName({ env = process.env } = {}) {
  return env.WSL_DISTRO_NAME || "WSL";
}

/**
 * Convert a Linux/WSL absolute path to a Windows path.
 * /mnt/c/Users/a/b → C:\Users\a\b
 * /home/a/b → \\wsl$\<distro>\home\a\b
 */
export function toWindowsPath(linuxPath, { env = process.env, distro = distroName({ env }) } = {}) {
  const normalized = String(linuxPath || "").trim().replace(/\\/g, "/");
  if (!normalized.startsWith("/")) return "";

  const mnt = normalized.match(/^\/mnt\/([a-zA-Z])\/(.*)$/);
  if (mnt) {
    const rest = mnt[2].replace(/\//g, "\\");
    return `${mnt[1].toUpperCase()}:\\${rest}`;
  }

  const mntRoot = normalized.match(/^\/mnt\/([a-zA-Z])\/?$/);
  if (mntRoot) {
    return `${mntRoot[1].toUpperCase()}:\\`;
  }

  const trimmed = normalized.replace(/^\//, "").replace(/\//g, "\\");
  return `\\\\wsl$\\${distro}\\${trimmed}`;
}

export function isSafeLinuxPath(abs) {
  if (typeof abs !== "string" || abs.length === 0 || abs.length > 1024) return false;
  if (abs.includes("\0") || abs.includes("\\")) return false;
  if (!abs.startsWith("/")) return false;
  return true;
}

export function isWithin(base, target) {
  if (typeof base !== "string" || base === "" || typeof target !== "string" || target === "") {
    return false;
  }
  const b = base.replace(/\/+$/, "") || "/";
  const t = target;
  return t === b || t.startsWith(b === "/" ? "/" : `${b}/`);
}

function readOsRelease() {
  return readFileSync("/proc/sys/kernel/osrelease", "utf8");
}
