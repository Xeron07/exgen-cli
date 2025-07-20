const { printBanner } = require("../lib/utils/banner");
const { mkdirp, writeFile } = require("../lib/fsHelpers");
const fs = require("fs");
const path = require("path");

describe("EXGEN Utilities", () => {
  test("printBanner should not throw", () => {
    expect(() => printBanner()).not.toThrow();
  });

  test("mkdirp should create nested directories", () => {
    const testDir = path.join(__dirname, "tmp/deep/structure");
    mkdirp(testDir);
    expect(fs.existsSync(testDir)).toBe(true);
    fs.rmSync(path.join(__dirname, "tmp"), { recursive: true, force: true });
  });

  test("writeFile should write content to file", () => {
    const testFile = path.join(__dirname, "tmp/testfile.txt");
    mkdirp(path.dirname(testFile));
    writeFile(testFile, "Hello EXGEN!");
    const content = fs.readFileSync(testFile, "utf-8");
    expect(content).toBe("Hello EXGEN!");
    fs.rmSync(path.join(__dirname, "tmp"), { recursive: true, force: true });
  });
});
