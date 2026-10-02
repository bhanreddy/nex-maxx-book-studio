import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import ts from 'typescript';

const require = createRequire(import.meta.url);
require.extensions['.ts'] = (module, file) => module._compile(ts.transpileModule(fs.readFileSync(file, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
}).outputText, file);
const { removeBackgroundRgba } = require('../src/editor/pixel/backgroundRemoval.ts');

function blank(width, height, color) {
  const data = new Uint8ClampedArray(width * height * 4);
  for (let i = 0; i < width * height; i++) {
    data[i * 4] = color[0];
    data[i * 4 + 1] = color[1];
    data[i * 4 + 2] = color[2];
    data[i * 4 + 3] = color[3];
  }
  return data;
}

function paintDisc(data, width, height, cx, cy, radius, color) {
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const cover = Math.min(1, Math.max(0, radius - Math.hypot(x + 0.5 - cx, y + 0.5 - cy) + 0.5));
      if (cover <= 0) continue;
      const offset = (y * width + x) * 4;
      const keep = 1 - cover;
      data[offset] = data[offset] * keep + color[0] * cover;
      data[offset + 1] = data[offset + 1] * keep + color[1] * cover;
      data[offset + 2] = data[offset + 2] * keep + color[2] * cover;
      data[offset + 3] = data[offset + 3] * keep + 255 * cover;
    }
  }
}

function pixel(data, width, x, y) {
  const offset = (y * width + x) * 4;
  return [data[offset], data[offset + 1], data[offset + 2], data[offset + 3]];
}

test('solid backdrop keeps the subject, an enclosed light area, and a soft edge', () => {
  const width = 96;
  const height = 96;
  const data = blank(width, height, [248, 248, 248, 255]);
  paintDisc(data, width, height, 48, 48, 30, [196, 48, 42]);
  for (let y = 43; y < 54; y++) {
    for (let x = 43; x < 54; x++) {
      const offset = (y * width + x) * 4;
      data[offset] = 250;
      data[offset + 1] = 250;
      data[offset + 2] = 250;
      data[offset + 3] = 255;
    }
  }
  const cut = removeBackgroundRgba(data, width, height);
  const corner = pixel(cut.rgba, width, 2, 2);
  const shirt = pixel(cut.rgba, width, 48, 48);
  const body = pixel(cut.rgba, width, 48, 28);
  assert.equal(cut.mode, 'cutout');
  assert.equal(cut.changed, true);
  assert.equal(corner[3], 0, `corner stayed opaque ${corner}`);
  assert.ok(shirt[3] > 240, `enclosed light area was removed ${shirt}`);
  assert.ok(shirt[0] > 200 && shirt[1] > 200, `enclosed light colour changed ${shirt}`);
  assert.ok(body[3] > 240 && body[0] > body[2], `subject body was removed ${body}`);
  let partial = 0;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const alpha = cut.mask[y * width + x];
      if (alpha > 12 && alpha < 243) partial++;
    }
  }
  assert.ok(partial > 20, `edge matte has ${partial} partial pixels`);
});

test('a smooth gradient backdrop is removed up to the subject edge', () => {
  const width = 96;
  const height = 96;
  const data = blank(width, height, [255, 255, 255, 255]);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const t = x / (width - 1);
      const offset = (y * width + x) * 4;
      data[offset] = 255;
      data[offset + 1] = Math.round(255 * (1 - t) + 214 * t);
      data[offset + 2] = Math.round(255 * (1 - t) + 170 * t);
    }
  }
  for (let y = 28; y < 68; y++) {
    for (let x = 28; x < 68; x++) {
      const offset = (y * width + x) * 4;
      data[offset] = 36;
      data[offset + 1] = 140;
      data[offset + 2] = 72;
    }
  }
  const cut = removeBackgroundRgba(data, width, height);
  assert.equal(pixel(cut.rgba, width, 2, 48)[3], 0);
  assert.equal(pixel(cut.rgba, width, 93, 48)[3], 0);
  const subject = pixel(cut.rgba, width, 48, 48);
  assert.ok(subject[3] > 240, `subject alpha ${subject[3]}`);
  assert.ok(subject[1] > subject[0] && subject[1] > 80, `subject colour ${subject}`);
});

test('an existing transparent preset keeps dark subject pixels and its clear backdrop', () => {
  const width = 96;
  const height = 96;
  const data = blank(width, height, [0, 0, 0, 0]);
  paintDisc(data, width, height, 48, 48, 28, [150, 84, 48]);
  const detail = (48 * width + 48) * 4;
  data[detail] = 28;
  data[detail + 1] = 16;
  data[detail + 2] = 12;
  data[detail + 3] = 255;
  const cut = removeBackgroundRgba(data, width, height);
  assert.equal(cut.mode, 'refine');
  assert.equal(pixel(cut.rgba, width, 1, 1)[3], 0);
  const kept = pixel(cut.rgba, width, 48, 48);
  assert.ok(kept[3] > 240, `dark detail alpha ${kept[3]}`);
  assert.ok(kept[0] < 80 && kept[1] < 60, `dark detail was recolored ${kept}`);
});

test('a near-black backdrop does not eat dark detail inside the subject', () => {
  const width = 96;
  const height = 96;
  const data = blank(width, height, [8, 8, 8, 255]);
  paintDisc(data, width, height, 48, 48, 30, [168, 96, 52]);
  const detail = (48 * width + 48) * 4;
  data[detail] = 24;
  data[detail + 1] = 16;
  data[detail + 2] = 14;
  data[detail + 3] = 255;
  const cut = removeBackgroundRgba(data, width, height);
  assert.equal(pixel(cut.rgba, width, 2, 2)[3], 0, 'black backdrop remained');
  const kept = pixel(cut.rgba, width, 48, 48);
  assert.ok(kept[3] > 240, `interior detail removed ${kept}`);
  assert.ok(kept[0] < 90, `interior detail recolored ${kept}`);
});
