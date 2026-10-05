export type ArithmeticOperation = "+" | "−" | "×" | "÷";
export const normalizeOperation = (value: unknown): ArithmeticOperation => {
  const op = String(value); if (op === "-" || op === "−") return "−";
  if (op === "*" || op === "×") return "×";
  if (op === "/" || op === "÷") return "÷";
  if (op === "+") return "+";
  throw new Error("Choose +, −, × or ÷.");
};
export function whole(value: unknown, label = "Number", max = 999999): number {
  const n = typeof value === "string" && !value.trim() ? NaN : Number(value);
  if (!Number.isSafeInteger(n) || n < 0 || n > max) throw new Error(`${label} must be a whole number from 0 to ${max.toLocaleString("en-IN")}.`);
  return n;
}
export interface ArithmeticStep { column: number; title: string; detail: string; top?: number[]; carry?: number }
export interface DivisionStep { index: number; current: number; digit: number; product: number; remainder: number }
export function arithmeticTrace(first: unknown, second: unknown, operation: unknown) {
  const a = whole(first, "First number"), b = whole(second, "Second number"), op = normalizeOperation(operation);
  if (op === "−" && b > a) throw new Error("For this whole-number subtraction block, the first number must be at least the second.");
  if (op === "÷" && b === 0) throw new Error("Division by zero is undefined. Enter a divisor of at least 1.");
  const result = op === "+" ? a + b : op === "−" ? a - b : op === "×" ? a * b : Math.floor(a / b);
  const remainder = op === "÷" ? a % b : 0;
  const columns = Math.max(String(a).length, String(b).length, String(result).length);
  const digits = (n: number) => String(n).padStart(columns, "0").split("").map(Number);
  const top = digits(a), bottom = digits(b), modified = [...top], carries = Array<number>(columns).fill(0);
  const steps: ArithmeticStep[] = [], division: DivisionStep[] = [];
  const places = ["ones", "tens", "hundreds", "thousands", "ten thousands", "lakhs", "ten lakhs"];
  let carry = 0;
  if (op === "+" || op === "−" || (op === "×" && b < 10)) {
    // Addition includes a newly created leading column, so the final carry is visible.
    const count = op === "×" ? String(a).length : columns;
    for (let offset = 0; offset < count; offset++) {
      const i = columns - 1 - offset, place = places[offset] || `10^${offset} place`;
      if (op === "−") {
        const changes: string[] = [];
        if (modified[i] < bottom[i]) {
          let lender = i - 1; while (lender >= 0 && modified[lender] === 0) lender--;
          modified[lender]--;
          changes.push(`${places[columns - 1 - lender]} becomes ${modified[lender]}`);
          for (let k = lender + 1; k < i; k++) { modified[k] = 9; changes.push(`${places[columns - 1 - k]} becomes 9`); }
          modified[i] += 10;
        }
        steps.push({ column: i, title: `Subtract the ${place}`, detail: `${changes.length ? `Regroup: ${changes.join(", ")}. ` : ""}${modified[i]} − ${bottom[i]} = ${modified[i] - bottom[i]}.`, top: [...modified] });
      } else {
        const value = (op === "+" ? top[i] + bottom[i] : top[i] * b) + carry;
        const detail = `${top[i]} ${op} ${op === "+" ? bottom[i] : b}${carry ? ` + ${carry} carried` : ""} = ${value}. Write ${op === "×" && offset === count - 1 ? value : value % 10}${value >= 10 && offset < count - 1 ? `; carry ${Math.floor(value / 10)} to the next place` : ""}.`;
        carry = Math.floor(value / 10); if (i > 0) carries[i - 1] = carry;
        steps.push({ column: i, title: `${op === "+" ? "Add" : "Multiply"} the ${place}`, detail, carry });
      }
    }
  } else if (op === "×") {
    String(b).split("").reverse().forEach((digit, i) => steps.push({ column: columns - 1 - i, title: `Multiply by ${Number(digit) * 10 ** i}`, detail: `${a} × ${digit} × ${10 ** i} = ${a * Number(digit) * 10 ** i}.` }));
    steps.push({ column: 0, title: "Add the partial products", detail: `The product is ${result}.` });
  }
  if (op === "÷") {
    let current = 0;
    String(a).split("").forEach((digit, index, list) => {
      current = current * 10 + Number(digit);
      if (current >= b || division.length || index === list.length - 1) {
        const q = Math.floor(current / b), product = q * b, rest = current - product;
        division.push({ index, current, digit: q, product, remainder: rest });
        steps.push({ column: index, title: `Divide ${current} by ${b}`, detail: `${q} × ${b} = ${product}; ${current} − ${product} = ${rest}.${index < list.length - 1 ? ` Bring down ${list[index + 1]}.` : ` Remainder: ${rest}.`}` });
        current = rest;
      }
    });
  }
  return { a, b, op, result, remainder, columns, top, bottom, modified, carries, steps, division, answer: `${result}${remainder ? ` R ${remainder}` : ""}` };
}

/** A tiny arithmetic parser: no eval, and ×/÷ bind before +/−. */
export function evaluateArithmetic(expression: unknown): number {
  if (/\d\s+\d/.test(String(expression))) throw new Error("Put an operation between numbers.");
  const input = String(expression).replace(/[−–]/g, "-").replace(/×/g, "*").replace(/÷/g, "/").replace(/\s/g, "");
  if (!input || input.length > 160 || /[^\d+*/().-]/.test(input)) throw new Error("Use numbers, +, −, ×, ÷ and parentheses.");
  const tokens = input.match(/\d+(?:\.\d+)?|[+*/().-]/g) || []; let index = 0;
  function atom(): number {
    if (tokens[index] === "(") { index++; const n = sum(); if (tokens[index++] !== ")") throw new Error("Close the parentheses."); return n; }
    const token = tokens[index++]; if (!/^\d+(?:\.\d+)?$/.test(token || "")) throw new Error("Enter a number after each operation."); return Number(token);
  }
  function product(): number { let n = atom(); while (tokens[index] === "*" || tokens[index] === "/") { const op = tokens[index++], b = atom(); if (op === "/" && b === 0) throw new Error("Division by zero is undefined."); n = op === "*" ? n * b : n / b; } return n; }
  function sum(): number { let n = product(); while (tokens[index] === "+" || tokens[index] === "-") { const op = tokens[index++], b = product(); n = op === "+" ? n + b : n - b; } return n; }
  const result = sum(); if (index !== tokens.length || !Number.isFinite(result)) throw new Error("Check the expression."); return Math.round(result * 1e10) / 1e10;
}

export function latticeTrace(first: unknown, second: unknown) {
  const a = whole(first, "Top factor", 999), b = whole(second, "Side factor", 999);
  const top = String(a).split("").map(Number), side = String(b).split("").map(Number);
  const cells = side.map(y => top.map(x => ({ tens: Math.floor(x * y / 10), ones: x * y % 10 })));
  const sums = Array<number>(top.length + side.length).fill(0);
  cells.forEach((row, r) => row.forEach((cell, c) => { const place = top.length - 1 - c + side.length - 1 - r; sums[place] += cell.ones; sums[place + 1] += cell.tens; }));
  let carry = 0;
  const diagonals = sums.map(sum => { const total = sum + carry, incoming = carry; carry = Math.floor(total / 10); return { sum, incoming, digit: total % 10, carry }; });
  return { a, b, top, side, cells, diagonals, result: a * b };
}

/** Generate by construction so the requested case cannot turn into another case. */
export function arithmeticCase(kind: string, random = Math.random) {
  const pick = (min: number, max: number) => min + Math.min(max - min, Math.max(0, Math.floor(random() * (max - min + 1))));
  switch (kind) {
    case "add-no-carry": { const a = pick(1, 8) * 100 + pick(0, 8) * 10 + pick(0, 8); const b = String(a).split("").map(d => pick(0, 9 - Number(d))).reduce((v, d) => v * 10 + d, 0); return { a, b }; }
    case "add-carry": return { a: pick(1, 8) * 100 + pick(5, 9) * 10 + pick(5, 9), b: pick(1, 8) * 100 + pick(5, 9) * 10 + pick(5, 9) };
    case "sub-no-borrow": { const a = pick(1, 9) * 100 + pick(0, 9) * 10 + pick(0, 9); const b = String(a).split("").map(d => pick(0, Number(d))).reduce((v, d) => v * 10 + d, 0); return { a, b }; }
    case "sub-borrow": return { a: pick(4, 9) * 100 + pick(0, 3) * 10 + pick(0, 3), b: pick(1, 3) * 100 + pick(5, 9) * 10 + pick(5, 9) };
    case "sub-zero": return { a: pick(2, 9) * 1000, b: pick(1, 9) * 10 + pick(1, 9) };
    case "multiply-carry": return { a: pick(1, 9) * 100 + pick(0, 9) * 10 + pick(5, 9), b: pick(2, 9) };
    case "multiply-zero": return { a: pick(1, 9) * 100 + pick(1, 9), b: pick(2, 9) };
    case "multiply-two": case "lattice": return { a: pick(12, 99), b: pick(12, 99) };
    case "divide-exact": { const b = pick(2, 9); return { a: b * pick(12, 99), b }; }
    case "divide-remainder": { const b = pick(2, 9); return { a: b * pick(2, 99) + pick(1, b - 1), b }; }
    case "divide-zero": { const b = pick(2, 9); return { a: b * 101, b }; }
    default: return { a: pick(100, 999), b: pick(2, 9) };
  }
}
