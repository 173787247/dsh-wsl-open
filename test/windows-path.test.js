import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  detectWsl,
  isSafeLinuxPath,
  isWithin,
  toWindowsPath,
} from "../lib/windows-path.js";
import { matchLinuxPaths } from "../lib/scan-path.js";

describe("toWindowsPath", () => {
  it("maps /mnt/c to a Windows drive letter", () => {
    assert.equal(
      toWindowsPath("/mnt/c/Users/rchua/GO/deck.pptx"),
      "C:\\Users\\rchua\\GO\\deck.pptx",
    );
  });

  it("maps a Linux home path to a \\\\wsl$ UNC path", () => {
    assert.equal(
      toWindowsPath("/home/rchua/GO/o2o/大洋晶典_O2O战略汇报.pptx", { distro: "Ubuntu-24.04" }),
      "\\\\wsl$\\Ubuntu-24.04\\home\\rchua\\GO\\o2o\\大洋晶典_O2O战略汇报.pptx",
    );
  });

  it("rejects relative paths", () => {
    assert.equal(toWindowsPath("o2o/deck.pptx"), "");
  });
});

describe("isSafeLinuxPath", () => {
  it("accepts absolute Linux paths and rejects NUL or oversize", () => {
    assert.equal(isSafeLinuxPath("/home/rchua/a.pptx"), true);
    assert.equal(isSafeLinuxPath("C:\\Users\\a"), false);
    assert.equal(isSafeLinuxPath("/home/\0x"), false);
  });
});

describe("isWithin", () => {
  it("does not treat /home/rchua as a prefix of /home/rchua2", () => {
    assert.equal(isWithin("/home/rchua", "/home/rchua/GO/a.pptx"), true);
    assert.equal(isWithin("/home/rchua", "/home/rchua2/a.pptx"), false);
  });
});

describe("detectWsl", () => {
  it("trusts WSL_DISTRO_NAME", () => {
    assert.equal(detectWsl({ env: { WSL_DISTRO_NAME: "Ubuntu-24.04" }, readRelease: () => { throw new Error("unused"); } }), true);
    assert.equal(detectWsl({ env: {}, readRelease: () => { throw new Error("ENOENT"); } }), false);
  });
});

describe("matchLinuxPaths", () => {
  it("finds a CJK pptx path in plain prose", () => {
    const text = "文件已写到 /home/rchua/GO/o2o/大洋晶典_O2O战略汇报.pptx 请查收。";
    assert.deepEqual(matchLinuxPaths(text), [
      "/home/rchua/GO/o2o/大洋晶典_O2O战略汇报.pptx",
    ]);
  });

  it("finds /mnt/c paths and strips a trailing period", () => {
    assert.deepEqual(
      matchLinuxPaths("see /mnt/c/Users/rchua/GO/deck.pptx."),
      ["/mnt/c/Users/rchua/GO/deck.pptx"],
    );
  });
});
