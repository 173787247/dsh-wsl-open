window.__ModuleLoader__.load({
  id: "dsh-wsl-open",
  factory: () => {
    var module = { exports: {} };
    var exports = module.exports;

    var inject = [];
    // Keep in sync with lib/scan-path.js.
    var PATH_RE = /(?:^|[\s:(（`])(\/(?:home|mnt|opt|tmp|root|Users)[^\s<>"'`()（）\[\]，。；、]+)/g;
    var HIGHLIGHT = "dsh-wsl-open-path";
    var SKIP = "pre, a, button, script, style, textarea, input, [contenteditable], [data-input-mirror], [data-input-backdrop], [data-composer-card]";

    function findLinuxPaths(text) {
      if (typeof text !== "string" || !text.includes("/")) return [];
      var out = [];
      var re = new RegExp(PATH_RE.source, "g");
      var match;
      while ((match = re.exec(text)) !== null) {
        var raw = match[1];
        var path = raw.replace(/[.,;:]+$/, "");
        if (path.length < 2 || path.length > 1024) continue;
        var start = match.index + match[0].length - raw.length;
        out.push({ path: path, start: start, end: start + path.length });
      }
      return out;
    }

    function apply(ctx) {
      if (typeof document === "undefined") return;

      if (!document.getElementById("dsh-wsl-open-style")) {
        var tag = document.createElement("style");
        tag.id = "dsh-wsl-open-style";
        tag.textContent = "::highlight(" + HIGHLIGHT + "){color:var(--dsw-alias-state-business-primary,#2f6fed);text-decoration:underline;text-decoration-style:dotted;}";
        document.head.appendChild(tag);
      }

      var sessionsSvc = typeof ctx.get === "function" ? ctx.get("sessions") : undefined;
      var bareHits = [];
      var scanQueued = false;

      function sessionId() {
        try {
          var snap = sessionsSvc && sessionsSvc.list && sessionsSvc.list.getSnapshot ? sessionsSvc.list.getSnapshot() : null;
          if (snap && snap.activeId) return snap.activeId;
          if (snap && snap.byId) return Object.keys(snap.byId)[0] || "";
        } catch (error) {
          // ignore
        }
        return "";
      }

      function openPath(linuxPath) {
        fetch("/api/wsl-open/open", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ sessionId: sessionId(), path: linuxPath }),
          cache: "no-store",
        }).then(function (res) {
          return res.json().catch(function () { return {}; }).then(function (data) {
            if (!res.ok || !data.ok) console.warn("[dsh-wsl-open]", data.error || res.status);
          });
        }).catch(function (error) {
          console.warn("[dsh-wsl-open]", error);
        });
      }

      function highlightSupported() {
        return typeof CSS !== "undefined" && CSS.highlights !== undefined && typeof Highlight === "function";
      }

      function collectBareHits() {
        var walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
          acceptNode: function (node) {
            var parent = node.parentElement;
            if (!parent) return NodeFilter.FILTER_REJECT;
            if (parent.closest(SKIP)) return NodeFilter.FILTER_REJECT;
            return NodeFilter.FILTER_ACCEPT;
          },
        });
        var hits = [];
        while (walker.nextNode()) {
          var node = walker.currentNode;
          var text = node.nodeValue || "";
          if (text.length > 8000) continue;
          var found = findLinuxPaths(text);
          for (var i = 0; i < found.length && i < 16; i++) {
            hits.push({ node: node, path: found[i].path, start: found[i].start, end: found[i].end });
          }
        }
        return hits;
      }

      function renderBareHighlights() {
        var hits = collectBareHits();
        var ranges = [];
        bareHits = [];
        for (var i = 0; i < hits.length; i++) {
          var hit = hits[i];
          var range = document.createRange();
          range.setStart(hit.node, hit.start);
          range.setEnd(hit.node, hit.end);
          ranges.push(range);
          bareHits.push({ range: range, path: hit.path });
        }
        if (highlightSupported()) CSS.highlights.set(HIGHLIGHT, new Highlight(...ranges));
      }

      function scheduleScan() {
        if (scanQueued) return;
        scanQueued = true;
        requestAnimationFrame(function () {
          scanQueued = false;
          renderBareHighlights();
        });
      }

      function hitBarePath(event) {
        if (bareHits.length === 0) return null;
        var r = null;
        if (typeof document.caretRangeFromPoint === "function") {
          r = document.caretRangeFromPoint(event.clientX, event.clientY);
        } else if (typeof document.caretPositionFromPoint === "function") {
          var pos = document.caretPositionFromPoint(event.clientX, event.clientY);
          if (pos) {
            r = document.createRange();
            r.setStart(pos.offsetNode, pos.offset);
            r.setEnd(pos.offsetNode, pos.offset);
          }
        }
        if (!r) return null;
        for (var i = 0; i < bareHits.length; i++) {
          var cr = bareHits[i].range;
          if (
            cr.startContainer === r.startContainer &&
            cr.endContainer === r.endContainer &&
            r.startOffset >= cr.startOffset &&
            r.startOffset <= cr.endOffset
          ) {
            return bareHits[i].path;
          }
        }
        return null;
      }

      function onClick(event) {
        var target = event.target;
        if (!target || target.nodeType !== 1) return;
        if (target.closest("button, a, pre, textarea, input, [contenteditable]")) return;

        var bare = hitBarePath(event);
        if (bare) {
          event.preventDefault();
          event.stopPropagation();
          openPath(bare);
          return;
        }

        var code = target.closest("code");
        if (!code) return;
        var path = (code.textContent || "").trim().replace(/[.,;:]+$/, "");
        if (!path.startsWith("/") || findLinuxPaths(path).every(function (hit) { return hit.path !== path; })) return;
        event.preventDefault();
        event.stopPropagation();
        openPath(path);
      }

      function start() {
        document.addEventListener("click", onClick, true);
        var observer = new MutationObserver(function () { scheduleScan(); });
        observer.observe(document.body, { childList: true, subtree: true });
        scheduleScan();
        return function () {
          document.removeEventListener("click", onClick, true);
          observer.disconnect();
          if (highlightSupported()) CSS.highlights.delete(HIGHLIGHT);
        };
      }

      if (ctx.effect) ctx.effect(start, "dsh-wsl-open: click");
      else start();
    }

    exports.name = "dsh-wsl-open";
    exports.inject = inject;
    exports.apply = apply;
    return module.exports;
  },
});
