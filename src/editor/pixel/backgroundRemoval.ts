/**
 * Edge-aware background removal for uploaded photos and preset pictures.
 *
 * Opaque pictures are separated with a border color model (flat colour or
 * gradient), then a flood that stops at Scharr edges. The cut is softened
 * with a colour-line matte and a guided filter so the alpha follows the
 * picture’s own edges. Pictures that already have a transparent backdrop
 * keep that matte and only have the rim defringed.
 */

export interface BackgroundRemovalOptions {
  /** Higher values treat more near-background colour as backdrop. 28 is neutral. */
  tolerance?: number;
}

export interface BackgroundRemovalResult {
  rgba: Uint8ClampedArray;
  /** Foreground strength, 0–255, one value per pixel. */
  mask: Uint8Array;
  mode: "cutout" | "refine";
  changed: boolean;
}

const LINEAR = new Float32Array(256);
for (let i = 0; i < 256; i++) {
  const c = i / 255;
  LINEAR[i] = c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

const MAX_EDGE = 1280;

export function removeBackgroundRgba(
  input: Uint8ClampedArray,
  width: number,
  height: number,
  options: BackgroundRemovalOptions = {}
): BackgroundRemovalResult {
  if (width < 2 || height < 2 || input.length < width * height * 4) {
    return {
      rgba: new Uint8ClampedArray(input),
      mask: new Uint8Array(Math.max(0, width * height)).fill(255),
      mode: "cutout",
      changed: false,
    };
  }

  const scale = Math.min(1, MAX_EDGE / Math.max(width, height));
  const workW = Math.max(2, Math.round(width * scale));
  const workH = Math.max(2, Math.round(height * scale));
  const work = scale === 1 ? input : downsample(input, width, height, workW, workH);
  const cut = segment(work, workW, workH, options.tolerance ?? 28);

  if (workW === width && workH === height) return cut;

  const alpha = bilinearMask(cut.mask, workW, workH, width, height);
  const composed = compose(input, width, height, alpha, sampleWorkColor(cut, workW, workH, width, height), cut.mode);
  return { ...composed, mode: cut.mode, changed: cut.changed && composed.changed };
}

interface SegmentExtras {
  bgR: Uint8ClampedArray;
  bgG: Uint8ClampedArray;
  bgB: Uint8ClampedArray;
  fgR: Uint8ClampedArray;
  fgG: Uint8ClampedArray;
  fgB: Uint8ClampedArray;
  distBg: Uint16Array;
}

function segment(input: Uint8ClampedArray, width: number, height: number, tolerance: number): BackgroundRemovalResult & SegmentExtras {
  const n = width * height;
  const emptyColor = () => new Uint8ClampedArray(n);
  const base: SegmentExtras = {
    bgR: emptyColor(), bgG: emptyColor(), bgB: emptyColor(),
    fgR: emptyColor(), fgG: emptyColor(), fgB: emptyColor(),
    distBg: new Uint16Array(n),
  };

  if (transparentBorderRatio(input, width, height) >= 0.62) {
    const refined = refineMatte(input, width, height);
    return { ...refined, ...colorMapsFromAlpha(input, width, height, refined.mask), distBg: distanceToClear(refined.mask, width, height) };
  }

  const lab = toLab(input, width, height);
  const border = borderIndices(input, width, height);
  const model = backgroundModel(lab, border);
  const field = backgroundField(lab, width, height, model);
  const delta = new Float32Array(n);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = y * width + x;
      delta[i] = Math.min(distanceToModel(lab, i, model), field.error[i]);
    }
  }

  const accepted = border.filter(i => delta[i] <= Math.max(14, model.gate));
  const sample = (accepted.length > 32 ? accepted : border).map(i => delta[i]).sort((a, b) => a - b);
  const p90 = sample[Math.min(sample.length - 1, Math.floor(sample.length * 0.9))] ?? 4;
  const sensitivity = clamp((tolerance || 28) / 28, 0.65, 1.75);
  const threshold = clamp(p90 * 1.9 + 2.5, 7, 18) * sensitivity;
  const edge = scharr(lab.luma, width, height);
  let background = floodBackground(input, width, height, delta, edge, threshold);

  const removed = count(background) / n;
  if (removed < 0.08) {
    const grabbed = grabCut(lab, width, height, edge, background);
    if (grabbed) background = grabbed;
  }
  const beforeGlow = background.slice();
  absorbPaleGlow(input, background, edge, width, height);
  if (count(background) / n > 0.985) background = beforeGlow;
  if (count(background) / n > 0.985) {
    return unchanged(input, width, height, base);
  }

  removeSmallIslands(background, width, height, Math.max(6, Math.round(n * 0.00005)));
  const distBg = distanceFromMask(background, width, height, 1);
  const band = Math.max(2, Math.round(Math.min(width, height) * 0.006));
  const fgColor = nearestColor(input, width, height, index => !background[index] && distBg[index] > band, index => !background[index]);
  const bgColor = nearestColor(input, width, height, index => background[index] === 1 && input[index * 4 + 3] >= 16, index => background[index] === 1 && input[index * 4 + 3] >= 16);

  const alpha = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    if (background[i] && distTo(fgColor.dist, i) > band) {
      alpha[i] = 0;
      continue;
    }
    if (!background[i] && distBg[i] > band) {
      alpha[i] = 1;
      continue;
    }
    const pixel = [lab.l[i], lab.a[i], lab.b[i]] as const;
    const backdrop = rgbToLab(bgColor.r[i], bgColor.g[i], bgColor.b[i]);
    const towardBg = deltaE(pixel[0], pixel[1], pixel[2], backdrop[0], backdrop[1], backdrop[2]);
    const fg = rgbToLab(fgColor.r[i], fgColor.g[i], fgColor.b[i]);
    const towardFg = deltaE(pixel[0], pixel[1], pixel[2], fg[0], fg[1], fg[2]);
    alpha[i] = clamp(towardBg / (towardBg + towardFg + 0.001), 0, 1);
  }

  const guided = guidedFilter(normalize(lab.luma), alpha, width, height, Math.max(1, Math.round(Math.min(width, height) / 220)), 0.0008);
  for (let i = 0; i < n; i++) {
    if (!background[i] && distBg[i] > band + 1) guided[i] = 1;
    else if (background[i] && distTo(fgColor.dist, i) > band + 1) guided[i] = 0;
    else if (guided[i] < 0.035) guided[i] = 0;
    else if (guided[i] > 0.985) guided[i] = 1;
    else guided[i] = clamp(guided[i], 0, 1);
  }

  const composed = compose(input, width, height, guided, {
    bgR: bgColor.r, bgG: bgColor.g, bgB: bgColor.b,
    fgR: fgColor.r, fgG: fgColor.g, fgB: fgColor.b,
    distBg,
  }, "cutout");
  return { ...composed, mode: "cutout", changed: composed.changed, ...{
    bgR: bgColor.r, bgG: bgColor.g, bgB: bgColor.b,
    fgR: fgColor.r, fgG: fgColor.g, fgB: fgColor.b,
    distBg,
  } };
}

function refineMatte(input: Uint8ClampedArray, width: number, height: number): BackgroundRemovalResult {
  const n = width * height;
  const alpha = new Float32Array(n);
  const luma = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const o = i * 4;
    alpha[i] = input[o + 3] / 255;
    luma[i] = (0.2126 * input[o] + 0.7152 * input[o + 1] + 0.0722 * input[o + 2]) / 255;
  }
  const guided = guidedFilter(luma, alpha, width, height, Math.max(1, Math.round(Math.min(width, height) / 240)), 0.0006);
  const opaque = nearestColor(input, width, height, index => alpha[index] >= 0.96, index => alpha[index] >= 0.9);
  const out = new Uint8ClampedArray(input.length);
  const mask = new Uint8Array(n);
  let changed = false;
  for (let i = 0; i < n; i++) {
    const o = i * 4;
    const source = alpha[i];
    let a = source <= 0.04 ? 0 : source >= 0.96 ? 1 : clamp(guided[i], 0, 1);
    if (a < 0.03) a = 0;
    if (a > 0.985) a = 1;
    mask[i] = Math.round(a * 255);
    if (a <= 0) {
      changed = changed || input[o + 3] !== 0;
      continue;
    }
    if (source >= 0.96) {
      out[o] = input[o];
      out[o + 1] = input[o + 1];
      out[o + 2] = input[o + 2];
      out[o + 3] = 255;
      continue;
    }
    out[o] = opaque.r[i];
    out[o + 1] = opaque.g[i];
    out[o + 2] = opaque.b[i];
    out[o + 3] = mask[i];
    changed = true;
  }
  return { rgba: out, mask, mode: "refine", changed };
}

function compose(
  input: Uint8ClampedArray,
  width: number,
  height: number,
  alpha: Float32Array,
  colors: SegmentExtras,
  mode: "cutout" | "refine"
): BackgroundRemovalResult {
  const n = width * height;
  const out = new Uint8ClampedArray(input.length);
  const mask = new Uint8Array(n);
  let changed = false;
  for (let i = 0; i < n; i++) {
    const o = i * 4;
    let a = clamp(alpha[i], 0, 1);
    if (a < 0.03) a = 0;
    if (a > 0.985) a = 1;
    mask[i] = Math.round(a * 255);
    if (a <= 0) {
      changed = changed || input[o + 3] !== 0;
      continue;
    }
    const keepInterior = mode === "refine" ? input[o + 3] >= 245 : a > 0.985 && colors.distBg[i] > 1;
    if (keepInterior) {
      out[o] = input[o];
      out[o + 1] = input[o + 1];
      out[o + 2] = input[o + 2];
      out[o + 3] = 255;
      if (input[o + 3] !== 255) changed = true;
      continue;
    }
    const br = colors.bgR[i], bg = colors.bgG[i], bb = colors.bgB[i];
    const unmix = (channel: number, backdrop: number) => (channel - (1 - a) * backdrop) / Math.max(a, 0.2);
    let r = unmix(input[o], br);
    let g = unmix(input[o + 1], bg);
    let b = unmix(input[o + 2], bb);
    if (r < -8 || r > 263 || g < -8 || g > 263 || b < -8 || b > 263) {
      r = colors.fgR[i];
      g = colors.fgG[i];
      b = colors.fgB[i];
    }
    const blend = clamp((a - 0.18) / 0.62, 0, 1);
    out[o] = Math.round(clamp(r, 0, 255) * blend + colors.fgR[i] * (1 - blend));
    out[o + 1] = Math.round(clamp(g, 0, 255) * blend + colors.fgG[i] * (1 - blend));
    out[o + 2] = Math.round(clamp(b, 0, 255) * blend + colors.fgB[i] * (1 - blend));
    out[o + 3] = mask[i];
    changed = true;
  }
  return { rgba: out, mask, mode, changed };
}

function unchanged(input: Uint8ClampedArray, width: number, height: number, extra: SegmentExtras): BackgroundRemovalResult & SegmentExtras {
  const mask = new Uint8Array(width * height);
  for (let i = 0; i < mask.length; i++) mask[i] = input[i * 4 + 3];
  return { rgba: new Uint8ClampedArray(input), mask, mode: "cutout", changed: false, ...extra };
}

interface LabImage {
  l: Float32Array;
  a: Float32Array;
  b: Float32Array;
  luma: Float32Array;
}

function toLab(input: Uint8ClampedArray, width: number, height: number): LabImage {
  const n = width * height;
  const l = new Float32Array(n);
  const a = new Float32Array(n);
  const b = new Float32Array(n);
  const luma = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const o = i * 4;
    const lab = rgbToLab(input[o], input[o + 1], input[o + 2]);
    l[i] = lab[0];
    a[i] = lab[1];
    b[i] = lab[2];
    luma[i] = 0.2126 * input[o] + 0.7152 * input[o + 1] + 0.0722 * input[o + 2];
  }
  return { l, a, b, luma };
}

function rgbToLab(r: number, g: number, b: number): [number, number, number] {
  const R = LINEAR[r] ?? 0;
  const G = LINEAR[g] ?? 0;
  const B = LINEAR[b] ?? 0;
  const x = (R * 0.4124564 + G * 0.3575761 + B * 0.1804375) / 0.95047;
  const y = R * 0.2126729 + G * 0.7151522 + B * 0.072175;
  const z = (R * 0.0193339 + G * 0.119192 + B * 0.9503041) / 1.08883;
  const fx = labF(x);
  const fy = labF(y);
  const fz = labF(z);
  return [116 * fy - 16, 500 * (fx - fy), 200 * (fy - fz)];
}

function labF(t: number) {
  return t > 0.008856 ? Math.cbrt(t) : 7.787037 * t + 0.137931;
}

function deltaE(l1: number, a1: number, b1: number, l2: number, a2: number, b2: number) {
  const dl = l1 - l2;
  const da = a1 - a2;
  const db = b1 - b2;
  return Math.sqrt(dl * dl + da * da + db * db);
}

interface ColorModel {
  centers: Array<[number, number, number]>;
  gate: number;
}

function backgroundModel(lab: LabImage, border: number[]): ColorModel {
  const step = Math.max(1, Math.floor(border.length / 2400));
  const samples: number[] = [];
  for (let i = 0; i < border.length; i += step) samples.push(border[i]);
  if (!samples.length) return { centers: [[100, 0, 0]], gate: 12 };
  let meanL = 0, meanA = 0, meanB = 0;
  for (const i of samples) {
    meanL += lab.l[i];
    meanA += lab.a[i];
    meanB += lab.b[i];
  }
  meanL /= samples.length;
  meanA /= samples.length;
  meanB /= samples.length;
  let varL = 0, varA = 0, varB = 0;
  for (const i of samples) {
    varL += (lab.l[i] - meanL) ** 2;
    varA += (lab.a[i] - meanA) ** 2;
    varB += (lab.b[i] - meanB) ** 2;
  }
  const k = Math.sqrt(varL / samples.length) < 7 && Math.sqrt(varA / samples.length) < 5 && Math.sqrt(varB / samples.length) < 5 ? 1 : 3;
  const centers: Array<[number, number, number]> = [];
  for (let c = 0; c < k; c++) {
    const id = samples[Math.min(samples.length - 1, Math.floor((c + 0.5) * samples.length / k))];
    centers.push([lab.l[id], lab.a[id], lab.b[id]]);
  }
  const counts = new Array(k).fill(0);
  for (let iter = 0; iter < 8; iter++) {
    const sum = Array.from({ length: k }, () => [0, 0, 0, 0]);
    for (const id of samples) {
      let best = 0;
      let bestD = Infinity;
      for (let c = 0; c < k; c++) {
        const d = deltaE(lab.l[id], lab.a[id], lab.b[id], centers[c][0], centers[c][1], centers[c][2]);
        if (d < bestD) {
          bestD = d;
          best = c;
        }
      }
      sum[best][0] += lab.l[id];
      sum[best][1] += lab.a[id];
      sum[best][2] += lab.b[id];
      sum[best][3] += 1;
    }
    for (let c = 0; c < k; c++) {
      counts[c] = sum[c][3];
      if (!sum[c][3]) {
        const id = samples[(c * 97) % samples.length];
        centers[c] = [lab.l[id], lab.a[id], lab.b[id]];
      } else {
        centers[c] = [sum[c][0] / sum[c][3], sum[c][1] / sum[c][3], sum[c][2] / sum[c][3]];
      }
    }
  }
  const keep = centers.filter((_, c) => counts[c] >= samples.length * (k === 1 ? 0 : 0.12));
  const kept = keep.length ? keep : [centers[0]];
  let gate = 0;
  let seen = 0;
  for (const id of samples) {
    const d = distanceToCenters(lab, id, kept);
    gate += d;
    seen++;
  }
  return { centers: kept, gate: seen ? gate / seen + 8 : 12 };
}

function distanceToModel(lab: LabImage, index: number, model: ColorModel) {
  return distanceToCenters(lab, index, model.centers);
}

function distanceToCenters(lab: LabImage, index: number, centers: Array<[number, number, number]>) {
  let best = Infinity;
  for (const center of centers) {
    const d = deltaE(lab.l[index], lab.a[index], lab.b[index], center[0], center[1], center[2]);
    if (d < best) best = d;
  }
  return best;
}

function backgroundField(lab: LabImage, width: number, height: number, model: ColorModel) {
  const ok = (index: number) => distanceToModel(lab, index, model) <= Math.max(16, model.gate);
  const top = profile(width, x => ({ index: x, ok: ok(x) }), lab);
  const bottom = profile(width, x => ({ index: (height - 1) * width + x, ok: ok((height - 1) * width + x) }), lab);
  const left = profile(height, y => ({ index: y * width, ok: ok(y * width) }), lab);
  const right = profile(height, y => ({ index: y * width + width - 1, ok: ok(y * width + width - 1) }), lab);
  const error = new Float32Array(width * height);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const wt = 1 / (y + 1);
      const wb = 1 / (height - y);
      const wl = 1 / (x + 1);
      const wr = 1 / (width - x);
      const sum = wt + wb + wl + wr;
      const l = (wt * top.l[x] + wb * bottom.l[x] + wl * left.l[y] + wr * right.l[y]) / sum;
      const a = (wt * top.a[x] + wb * bottom.a[x] + wl * left.a[y] + wr * right.a[y]) / sum;
      const b = (wt * top.b[x] + wb * bottom.b[x] + wl * left.b[y] + wr * right.b[y]) / sum;
      const i = y * width + x;
      error[i] = deltaE(lab.l[i], lab.a[i], lab.b[i], l, a, b);
    }
  }
  return { error };
}

function profile(length: number, at: (index: number) => { index: number; ok: boolean }, lab: LabImage) {
  const l = new Float32Array(length);
  const a = new Float32Array(length);
  const b = new Float32Array(length);
  const known = new Uint8Array(length);
  for (let i = 0; i < length; i++) {
    const sample = at(i);
    if (!sample.ok) continue;
    l[i] = lab.l[sample.index];
    a[i] = lab.a[sample.index];
    b[i] = lab.b[sample.index];
    known[i] = 1;
  }
  let seed = -1;
  for (let i = 0; i < length; i++) if (known[i]) { seed = i; break; }
  if (seed < 0) return { l, a, b };
  for (let i = seed + 1; i < length; i++) if (!known[i]) { l[i] = l[i - 1]; a[i] = a[i - 1]; b[i] = b[i - 1]; }
  for (let i = seed - 1; i >= 0; i--) if (!known[i]) { l[i] = l[i + 1]; a[i] = a[i + 1]; b[i] = b[i + 1]; }
  return { l: smooth(l, 6), a: smooth(a, 6), b: smooth(b, 6) };
}

function smooth(values: Float32Array, radius: number) {
  const out = new Float32Array(values.length);
  for (let i = 0; i < values.length; i++) {
    let sum = 0;
    let count = 0;
    const from = Math.max(0, i - radius);
    const to = Math.min(values.length - 1, i + radius);
    for (let k = from; k <= to; k++) {
      sum += values[k];
      count++;
    }
    out[i] = sum / count;
  }
  return out;
}

function floodBackground(
  input: Uint8ClampedArray,
  width: number,
  height: number,
  delta: Float32Array,
  edge: Float32Array,
  threshold: number
) {
  const n = width * height;
  const background = new Uint8Array(n);
  const queue = new Int32Array(n);
  let head = 0;
  let tail = 0;
  const push = (index: number) => {
    if (background[index]) return;
    background[index] = 1;
    queue[tail++] = index;
  };
  for (let i = 0; i < n; i++) if (input[i * 4 + 3] < 12) push(i);
  const seed = (index: number) => {
    if (input[index * 4 + 3] < 12 || canEnter(delta[index], edge[index], threshold)) push(index);
  };
  for (let x = 0; x < width; x++) {
    seed(x);
    seed((height - 1) * width + x);
  }
  for (let y = 0; y < height; y++) {
    seed(y * width);
    seed(y * width + width - 1);
  }
  while (head < tail) {
    const index = queue[head++];
    const x = index % width;
    const y = (index / width) | 0;
    const neighbors = [index - 1, index + 1, index - width, index + width];
    for (const next of neighbors) {
      if (next < 0 || next >= n || background[next]) continue;
      const nx = next % width;
      if (Math.abs(nx - x) > 1) continue;
      if (input[next * 4 + 3] < 12 || canEnter(delta[next], edge[next], threshold)) push(next);
    }
  }
  return background;
}

/** Removes a soft pale glow connected to the backdrop. Drawn strokes are too sharp to enter. */
function absorbPaleGlow(input: Uint8ClampedArray, background: Uint8Array, edge: Float32Array, width: number, height: number) {
  const n = width * height;
  const added: number[] = [];
  const queue = new Int32Array(n);
  const queued = new Uint8Array(n);
  let tail = 0;
  for (let i = 0; i < n; i++) {
    if (!background[i]) continue;
    queue[tail++] = i;
    queued[i] = 1;
  }
  for (let head = 0; head < tail; head++) {
    const index = queue[head];
    const x = index % width;
    for (const next of [index - 1, index + 1, index - width, index + width]) {
      if (next < 0 || next >= n || queued[next] || edge[next] >= 0.22) continue;
      if (Math.abs((next % width) - x) > 1) continue;
      const offset = next * 4;
      const r = input[offset];
      const g = input[offset + 1];
      const b = input[offset + 2];
      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      if (max < 210 || max - min > 36) continue;
      background[next] = 1;
      queued[next] = 1;
      queue[tail++] = next;
      added.push(next);
    }
  }
  if (added.length < 400) {
    for (const index of added) background[index] = 0;
  }
}

function canEnter(delta: number, edge: number, threshold: number) {
  const clear = delta <= threshold * 0.45;
  const open = delta <= threshold && edge < 0.92;
  const wall = edge > 1.08 && delta > Math.min(6, threshold * 0.4);
  return (clear || open) && !wall;
}

function grabCut(
  lab: LabImage,
  width: number,
  height: number,
  edge: Float32Array,
  flood: Uint8Array
) {
  const n = width * height;
  const frame = Math.max(2, Math.round(Math.min(width, height) * 0.06));
  const sureBg: number[] = [];
  const sureFg: number[] = [];
  const cx = (width - 1) / 2;
  const cy = (height - 1) / 2;
  const rx = width * 0.22;
  const ry = height * 0.28;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = y * width + x;
      const onFrame = x < frame || y < frame || x >= width - frame || y >= height - frame || flood[i] === 1;
      if (onFrame) sureBg.push(i);
      else if (((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1) sureFg.push(i);
    }
  }
  if (sureFg.length < n * 0.02 || sureBg.length < 8) return;
  const bgModel = backgroundModel(lab, sureBg);
  const fgModel = backgroundModel(lab, sureFg);
  const label = new Uint8Array(n);
  for (const i of sureBg) label[i] = 0;
  for (const i of sureFg) label[i] = 1;
  const sure = new Uint8Array(n);
  for (const i of sureBg) sure[i] = 1;
  for (const i of sureFg) sure[i] = 1;
  for (let i = 0; i < n; i++) {
    if (sure[i]) continue;
    label[i] = distanceToModel(lab, i, fgModel) <= distanceToModel(lab, i, bgModel) ? 1 : 0;
  }
  for (let pass = 0; pass < 4; pass++) {
    for (let y = pass % 2 ? height - 1 : 0; pass % 2 ? y >= 0 : y < height; pass % 2 ? y-- : y++) {
      for (let x = 0; x < width; x++) {
        const i = y * width + x;
        if (sure[i]) continue;
        let costBg = distanceToModel(lab, i, bgModel);
        let costFg = distanceToModel(lab, i, fgModel);
        for (let ny = y - 1; ny <= y + 1; ny++) {
          if (ny < 0 || ny >= height) continue;
          for (let nx = x - 1; nx <= x + 1; nx++) {
            if (nx < 0 || nx >= width || (nx === x && ny === y)) continue;
            const penalty = edge[ny * width + nx] > 0.8 ? 4 : 16;
            if (label[ny * width + nx]) costBg += penalty;
            else costFg += penalty;
          }
        }
        label[i] = costBg <= costFg ? 0 : 1;
      }
    }
  }
  const background = new Uint8Array(n);
  for (let i = 0; i < n; i++) background[i] = label[i] ? 0 : 1;
  const removed = background.reduce((sum, bit) => sum + bit, 0) / n;
  if (removed < 0.05 || removed > 0.9) return;
  return background;
}

function scharr(luma: Float32Array, width: number, height: number) {
  const mag = new Float32Array(width * height);
  const hist = new Uint32Array(512);
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const i = y * width + x;
      const gx =
        -3 * luma[i - width - 1] + 3 * luma[i - width + 1] +
        -10 * luma[i - 1] + 10 * luma[i + 1] +
        -3 * luma[i + width - 1] + 3 * luma[i + width + 1];
      const gy =
        -3 * luma[i - width - 1] - 10 * luma[i - width] - 3 * luma[i - width + 1] +
        3 * luma[i + width - 1] + 10 * luma[i + width] + 3 * luma[i + width + 1];
      const value = Math.sqrt(gx * gx + gy * gy);
      mag[i] = value;
      hist[Math.min(511, value / 8 | 0)]++;
    }
  }
  const interior = Math.max(1, (width - 2) * (height - 2));
  let seen = 0;
  let p95 = 8;
  for (let bin = 0; bin < hist.length; bin++) {
    seen += hist[bin];
    if (seen >= interior * 0.95) {
      p95 = Math.max(8, bin * 8);
      break;
    }
  }
  for (let i = 0; i < mag.length; i++) mag[i] /= p95;
  return mag;
}

function removeSmallIslands(background: Uint8Array, width: number, height: number, minArea: number) {
  const n = width * height;
  const seen = new Uint8Array(n);
  const stack: number[] = [];
  for (let start = 0; start < n; start++) {
    if (background[start] || seen[start]) continue;
    stack.push(start);
    seen[start] = 1;
    const component: number[] = [];
    while (stack.length) {
      const index = stack.pop()!;
      component.push(index);
      const x = index % width;
      const y = (index / width) | 0;
      if (x > 0 && !background[index - 1] && !seen[index - 1]) { seen[index - 1] = 1; stack.push(index - 1); }
      if (x + 1 < width && !background[index + 1] && !seen[index + 1]) { seen[index + 1] = 1; stack.push(index + 1); }
      if (y > 0 && !background[index - width] && !seen[index - width]) { seen[index - width] = 1; stack.push(index - width); }
      if (y + 1 < height && !background[index + width] && !seen[index + width]) { seen[index + width] = 1; stack.push(index + width); }
    }
    if (component.length < minArea) for (const index of component) background[index] = 1;
  }
}

function distanceFromMask(mask: Uint8Array, width: number, height: number, value: number) {
  const n = width * height;
  const dist = new Uint16Array(n).fill(65535);
  const queue = new Int32Array(n);
  let head = 0;
  let tail = 0;
  for (let i = 0; i < n; i++) {
    if (mask[i] !== value) continue;
    dist[i] = 0;
    queue[tail++] = i;
  }
  while (head < tail) {
    const index = queue[head++];
    const x = index % width;
    const y = (index / width) | 0;
    const nextDist = dist[index] + 1;
    for (let ny = y - 1; ny <= y + 1; ny++) {
      if (ny < 0 || ny >= height) continue;
      for (let nx = x - 1; nx <= x + 1; nx++) {
        if (nx < 0 || nx >= width) continue;
        const next = ny * width + nx;
        if (dist[next] !== 65535) continue;
        dist[next] = nextDist;
        queue[tail++] = next;
      }
    }
  }
  return dist;
}

function nearestColor(
  input: Uint8ClampedArray,
  width: number,
  height: number,
  primary: (index: number) => boolean,
  fallback: (index: number) => boolean
) {
  const n = width * height;
  let considerColor = primary;
  let seeds = 0;
  for (let i = 0; i < n; i++) if (primary(i)) seeds++;
  if (seeds < 12) considerColor = fallback;
  const r = new Uint8ClampedArray(n);
  const g = new Uint8ClampedArray(n);
  const b = new Uint8ClampedArray(n);
  const dist = new Uint16Array(n).fill(65535);
  const queue = new Int32Array(n);
  let head = 0;
  let tail = 0;
  for (let i = 0; i < n; i++) {
    if (!considerColor(i)) continue;
    const o = i * 4;
    r[i] = input[o];
    g[i] = input[o + 1];
    b[i] = input[o + 2];
    dist[i] = 0;
    queue[tail++] = i;
  }
  if (!tail) {
    r.fill(input[0] || 0);
    g.fill(input[1] || 0);
    b.fill(input[2] || 0);
    return { r, g, b, dist };
  }
  while (head < tail) {
    const index = queue[head++];
    const x = index % width;
    const y = (index / width) | 0;
    const nextDist = dist[index] + 1;
    for (let ny = y - 1; ny <= y + 1; ny++) {
      if (ny < 0 || ny >= height) continue;
      for (let nx = x - 1; nx <= x + 1; nx++) {
        if (nx < 0 || nx >= width) continue;
        const next = ny * width + nx;
        if (dist[next] !== 65535) continue;
        dist[next] = nextDist;
        r[next] = r[index];
        g[next] = g[index];
        b[next] = b[index];
        queue[tail++] = next;
      }
    }
  }
  return { r, g, b, dist };
}

function guidedFilter(guide: Float32Array, source: Float32Array, width: number, height: number, radius: number, eps: number) {
  const n = width * height;
  const meanI = new Float32Array(n);
  const meanP = new Float32Array(n);
  const meanII = new Float32Array(n);
  const meanIP = new Float32Array(n);
  const ii = new Float32Array(n);
  const ip = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    ii[i] = guide[i] * guide[i];
    ip[i] = guide[i] * source[i];
  }
  boxFilter(guide, width, height, radius, meanI);
  boxFilter(source, width, height, radius, meanP);
  boxFilter(ii, width, height, radius, meanII);
  boxFilter(ip, width, height, radius, meanIP);
  const a = new Float32Array(n);
  const b = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const variance = meanII[i] - meanI[i] * meanI[i];
    const covariance = meanIP[i] - meanI[i] * meanP[i];
    a[i] = covariance / (variance + eps);
    b[i] = meanP[i] - a[i] * meanI[i];
  }
  const meanA = new Float32Array(n);
  const meanB = new Float32Array(n);
  boxFilter(a, width, height, radius, meanA);
  boxFilter(b, width, height, radius, meanB);
  const out = new Float32Array(n);
  for (let i = 0; i < n; i++) out[i] = clamp(meanA[i] * guide[i] + meanB[i], 0, 1);
  return out;
}

function boxFilter(source: Float32Array, width: number, height: number, radius: number, dest: Float32Array) {
  const stride = width + 1;
  const integral = new Float64Array(stride * (height + 1));
  for (let y = 0; y < height; y++) {
    let row = 0;
    for (let x = 0; x < width; x++) {
      row += source[y * width + x];
      integral[(y + 1) * stride + x + 1] = integral[y * stride + x + 1] + row;
    }
  }
  for (let y = 0; y < height; y++) {
    const y0 = Math.max(0, y - radius);
    const y1 = Math.min(height - 1, y + radius);
    for (let x = 0; x < width; x++) {
      const x0 = Math.max(0, x - radius);
      const x1 = Math.min(width - 1, x + radius);
      const area = (x1 - x0 + 1) * (y1 - y0 + 1);
      const sum =
        integral[(y1 + 1) * stride + x1 + 1] -
        integral[y0 * stride + x1 + 1] -
        integral[(y1 + 1) * stride + x0] +
        integral[y0 * stride + x0];
      dest[y * width + x] = sum / area;
    }
  }
}

function transparentBorderRatio(input: Uint8ClampedArray, width: number, height: number) {
  const thickness = Math.max(2, Math.round(Math.min(width, height) * 0.03));
  let total = 0;
  let clear = 0;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (x >= thickness && y >= thickness && x < width - thickness && y < height - thickness) continue;
      total++;
      if (input[(y * width + x) * 4 + 3] < 16) clear++;
    }
  }
  return total ? clear / total : 0;
}

function borderIndices(input: Uint8ClampedArray, width: number, height: number) {
  const thickness = Math.max(2, Math.round(Math.min(width, height) * 0.025));
  const indices: number[] = [];
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (x >= thickness && y >= thickness && x < width - thickness && y < height - thickness) continue;
      const index = y * width + x;
      if (input[index * 4 + 3] >= 16) indices.push(index);
    }
  }
  return indices.length ? indices : [0];
}

function colorMapsFromAlpha(input: Uint8ClampedArray, width: number, height: number, mask: Uint8Array): Omit<SegmentExtras, "distBg"> {
  const fg = nearestColor(input, width, height, index => mask[index] > 245, index => mask[index] > 200);
  const bg = nearestColor(input, width, height, () => false, () => false);
  return { bgR: bg.r, bgG: bg.g, bgB: bg.b, fgR: fg.r, fgG: fg.g, fgB: fg.b };
}

function distanceToClear(mask: Uint8Array, width: number, height: number) {
  const binary = new Uint8Array(mask.length);
  for (let i = 0; i < mask.length; i++) binary[i] = mask[i] < 12 ? 1 : 0;
  return distanceFromMask(binary, width, height, 1);
}

function count(mask: Uint8Array) {
  let total = 0;
  for (let i = 0; i < mask.length; i++) total += mask[i];
  return total;
}

function normalize(values: Float32Array) {
  const out = new Float32Array(values.length);
  for (let i = 0; i < values.length; i++) out[i] = values[i] / 255;
  return out;
}

function distTo(dist: Uint16Array, index: number) {
  return dist[index] === 65535 ? 999 : dist[index];
}

function sampleWorkColor(cut: BackgroundRemovalResult & Partial<SegmentExtras>, workW: number, workH: number, width: number, height: number): SegmentExtras {
  const n = width * height;
  const map = (source?: Uint8ClampedArray) => {
    const dest = new Uint8ClampedArray(n);
    if (!source) return dest;
    for (let y = 0; y < height; y++) {
      const sy = Math.min(workH - 1, Math.floor(((y + 0.5) * workH) / height));
      for (let x = 0; x < width; x++) {
        const sx = Math.min(workW - 1, Math.floor(((x + 0.5) * workW) / width));
        dest[y * width + x] = source[sy * workW + sx];
      }
    }
    return dest;
  };
  const distBg = new Uint16Array(n);
  for (let i = 0; i < n; i++) distBg[i] = 2;
  return {
    bgR: map(cut.bgR), bgG: map(cut.bgG), bgB: map(cut.bgB),
    fgR: map(cut.fgR), fgG: map(cut.fgG), fgB: map(cut.fgB),
    distBg,
  };
}

function bilinearMask(mask: Uint8Array, sourceW: number, sourceH: number, width: number, height: number) {
  const alpha = new Float32Array(width * height);
  for (let y = 0; y < height; y++) {
    const fy = ((y + 0.5) * sourceH) / height - 0.5;
    const y0 = clamp(Math.floor(fy), 0, sourceH - 1);
    const y1 = clamp(y0 + 1, 0, sourceH - 1);
    const ty = clamp(fy - y0, 0, 1);
    for (let x = 0; x < width; x++) {
      const fx = ((x + 0.5) * sourceW) / width - 0.5;
      const x0 = clamp(Math.floor(fx), 0, sourceW - 1);
      const x1 = clamp(x0 + 1, 0, sourceW - 1);
      const tx = clamp(fx - x0, 0, 1);
      const value =
        mask[y0 * sourceW + x0] * (1 - tx) * (1 - ty) +
        mask[y0 * sourceW + x1] * tx * (1 - ty) +
        mask[y1 * sourceW + x0] * (1 - tx) * ty +
        mask[y1 * sourceW + x1] * tx * ty;
      alpha[y * width + x] = value / 255;
    }
  }
  return alpha;
}

function downsample(input: Uint8ClampedArray, width: number, height: number, targetW: number, targetH: number) {
  const dest = new Uint8ClampedArray(targetW * targetH * 4);
  for (let y = 0; y < targetH; y++) {
    const y0 = Math.floor((y * height) / targetH);
    const y1 = Math.max(y0 + 1, Math.floor(((y + 1) * height) / targetH));
    for (let x = 0; x < targetW; x++) {
      const x0 = Math.floor((x * width) / targetW);
      const x1 = Math.max(x0 + 1, Math.floor(((x + 1) * width) / targetW));
      let r = 0, g = 0, b = 0, a = 0, count = 0;
      for (let yy = y0; yy < Math.min(height, y1); yy++) {
        for (let xx = x0; xx < Math.min(width, x1); xx++) {
          const o = (yy * width + xx) * 4;
          const pa = input[o + 3];
          r += input[o] * pa;
          g += input[o + 1] * pa;
          b += input[o + 2] * pa;
          a += pa;
          count++;
        }
      }
      const o = (y * targetW + x) * 4;
      const inv = a > 0 ? 1 / a : 0;
      dest[o] = r * inv;
      dest[o + 1] = g * inv;
      dest[o + 2] = b * inv;
      dest[o + 3] = count ? a / count : 0;
    }
  }
  return dest;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}
