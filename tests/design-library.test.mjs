import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const catalog = fs.readFileSync(path.join(root, "src/editor/design/catalog.ts"), "utf8");

function layoutsOf(exportName) {
  const match = catalog.match(new RegExp(`export const ${exportName}[\\s\\S]*?=\\s*\\[([\\s\\S]*?)\\n\\];`));
  assert.ok(match, `${exportName} is missing`);
  return [...match[1].matchAll(/layout:\s*"([^"]+)"/g)].map((item) => item[1]);
}

const groups = {
  CHAPTER_SPECS: 30,
  HEADING_SPECS: 50,
  RUNNING_SPECS: 20,
  BODY_SPECS: 24,
  QUOTE_SPECS: 16,
  LEARNING_SPECS: 28,
  PRACTICE_SPECS: 28,
  TABLE_SPECS: 16,
  FIGURE_SPECS: 16,
  FURNITURE_SPECS: 22,
};

test("preset catalog meets the publication counts and stays structurally unique", () => {
  const all = [];
  for (const [name, count] of Object.entries(groups)) {
    const layouts = layoutsOf(name);
    assert.equal(layouts.length, count, name);
    all.push(...layouts);
  }
  assert.equal(all.length, 250);
  assert.equal(new Set(all).size, all.length);
});
