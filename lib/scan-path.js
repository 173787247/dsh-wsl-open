/** Absolute Linux paths that are worth turning into Windows open targets. */
const PATH_RE = /(?:^|[\s:(（`：；、。，！？])(\/(?:home|mnt|opt|tmp|root|Users)[^\s<>"'`()（）\[\]，。；、]+)/g;

export function findLinuxPaths(text) {
  if (typeof text !== "string" || !text.includes("/")) return [];
  const out = [];
  const re = new RegExp(PATH_RE.source, "g");
  let match;
  while ((match = re.exec(text)) !== null) {
    const raw = match[1];
    const path = raw.replace(/[.,;:]+$/, "");
    if (path.length < 2 || path.length > 1024) continue;
    const start = match.index + match[0].length - raw.length;
    out.push({ path, start, end: start + path.length });
  }
  return out;
}

export function matchLinuxPaths(text) {
  return findLinuxPaths(text).map((hit) => hit.path);
}
