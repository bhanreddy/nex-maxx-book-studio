/* eslint-disable @typescript-eslint/no-explicit-any */
// ============================================================================
// NEX MAXX BOOK STUDIO - DETERMINISTIC MATHEMATICAL ALGORITHMS
// Offline, zero-AI, 100% accurate mathematical computations for Classes 1 to 5
// ============================================================================

import { NumberingSystem } from "./types";

export interface PlaceValueColumn {
  key: string;       // e.g. "O", "T", "H", "Th", "TTh", "L", "TL", "C"
  label: string;     // e.g. "Ones", "Tens", "Hundreds"
  period: string;    // e.g. "Ones", "Thousands", "Lakhs", "Crores"
  digit: number;     // 0-9
  placeValue: number; // e.g. 50000
  power: number;     // e.g. 10000
}

/**
 * Format a number using standard Indian comma separation:
 * e.g. 872904 -> "8,72,904"
 */
export function formatIndianNumber(num: number | string): string {
  const cleanStr = String(num).replace(/[^0-9]/g, "");
  if (!cleanStr) return "0";
  if (cleanStr.length <= 3) return cleanStr;
  const lastThree = cleanStr.slice(-3);
  const remaining = cleanStr.slice(0, -3);
  const formattedRemaining = remaining.replace(/\B(?=(\d{2})+(?!\d))/g, ",");
  return `${formattedRemaining},${lastThree}`;
}

/**
 * Format a number using International comma separation:
 * e.g. 872904 -> "872,904"
 */
export function formatInternationalNumber(num: number | string): string {
  const cleanStr = String(num).replace(/[^0-9]/g, "");
  if (!cleanStr) return "0";
  return cleanStr.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

/**
 * Parse an integer safely from user input string (handling commas and spaces)
 */
export function parseMathNumber(input: any, fallback = 0): number {
  if (typeof input === "number") return isNaN(input) ? fallback : Math.floor(input);
  if (!input) return fallback;
  const cleaned = String(input).replace(/[^0-9]/g, "");
  const val = parseInt(cleaned, 10);
  return isNaN(val) ? fallback : val;
}

/**
 * Decompose a number into Indian Place Value Columns
 */
export function getIndianPlaceValueBreakdown(num: number | string): PlaceValueColumn[] {
  const n = parseMathNumber(num, 0);
  const str = String(n);
  const len = str.length;

  // Indian hierarchy from right to left
  const specs = [
    { key: "O", label: "Ones", period: "Ones", power: 1 },
    { key: "T", label: "Tens", period: "Ones", power: 10 },
    { key: "H", label: "Hundreds", period: "Ones", power: 100 },
    { key: "Th", label: "Thousands", period: "Thousands", power: 1000 },
    { key: "TTh", label: "Ten Thousands", period: "Thousands", power: 10000 },
    { key: "L", label: "Lakhs", period: "Lakhs", power: 100000 },
    { key: "TL", label: "Ten Lakhs", period: "Lakhs", power: 1000000 },
    { key: "C", label: "Crores", period: "Crores", power: 10000000 },
    { key: "TC", label: "Ten Crores", period: "Crores", power: 100000000 },
  ];

  const columns: PlaceValueColumn[] = [];
  for (let i = 0; i < len; i++) {
    const digitChar = str[i];
    const digit = parseInt(digitChar, 10);
    const powerIndex = len - 1 - i;
    const spec = specs[powerIndex] || {
      key: `10^${powerIndex}`,
      label: `Place ${powerIndex}`,
      period: "Higher",
      power: Math.pow(10, powerIndex),
    };

    columns.push({
      key: spec.key,
      label: spec.label,
      period: spec.period,
      digit,
      placeValue: digit * spec.power,
      power: spec.power,
    });
  }

  return columns;
}

/**
 * Decompose a number into International Place Value Columns
 */
export function getInternationalPlaceValueBreakdown(num: number | string): PlaceValueColumn[] {
  const n = parseMathNumber(num, 0);
  const str = String(n);
  const len = str.length;

  const specs = [
    { key: "O", label: "Ones", period: "Ones", power: 1 },
    { key: "T", label: "Tens", period: "Ones", power: 10 },
    { key: "H", label: "Hundreds", period: "Ones", power: 100 },
    { key: "Th", label: "Thousands", period: "Thousands", power: 1000 },
    { key: "TTh", label: "Ten Thousands", period: "Thousands", power: 10000 },
    { key: "HTh", label: "Hundred Thousands", period: "Thousands", power: 100000 },
    { key: "M", label: "Millions", period: "Millions", power: 1000000 },
    { key: "TM", label: "Ten Millions", period: "Millions", power: 10000000 },
    { key: "HM", label: "Hundred Millions", period: "Millions", power: 100000000 },
  ];

  const columns: PlaceValueColumn[] = [];
  for (let i = 0; i < len; i++) {
    const digitChar = str[i];
    const digit = parseInt(digitChar, 10);
    const powerIndex = len - 1 - i;
    const spec = specs[powerIndex] || {
      key: `10^${powerIndex}`,
      label: `Place ${powerIndex}`,
      period: "Higher",
      power: Math.pow(10, powerIndex),
    };

    columns.push({
      key: spec.key,
      label: spec.label,
      period: spec.period,
      digit,
      placeValue: digit * spec.power,
      power: spec.power,
    });
  }

  return columns;
}

/**
 * Generate Expanded Form:
 * e.g. 54326 -> [
 *   { digit: 5, place: "Ten Thousands", value: 50000, valueFormatted: "50,000" },
 *   { digit: 4, place: "Thousands", value: 4000, valueFormatted: "4,000" },
 *   ...
 * ]
 */
export function getExpandedForm(num: number | string, system: NumberingSystem = "indian") {
  const breakdown = system === "indian"
    ? getIndianPlaceValueBreakdown(num)
    : getInternationalPlaceValueBreakdown(num);

  const formatter = system === "indian" ? formatIndianNumber : formatInternationalNumber;

  return breakdown
    .filter((col) => col.digit > 0)
    .map((col) => ({
      digit: col.digit,
      key: col.key,
      label: col.label,
      value: col.placeValue,
      valueFormatted: formatter(col.placeValue),
    }));
}

/**
 * Convert number to words in Indian Numbering System
 * e.g. 872904 -> "Eight lakh seventy-two thousand nine hundred four"
 */
export function numberToIndianWords(n: number | string): string {
  const num = parseMathNumber(n, 0);
  if (num === 0) return "Zero";

  const ones = [
    "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine",
    "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen",
    "Seventeen", "Eighteen", "Nineteen"
  ];
  const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

  function convertTwoDigits(val: number): string {
    if (val === 0) return "";
    if (val < 20) return ones[val];
    const t = Math.floor(val / 10);
    const o = val % 10;
    return `${tens[t]}${o ? " " + ones[o] : ""}`;
  }

  function convertThreeDigits(val: number): string {
    const h = Math.floor(val / 100);
    const rem = val % 100;
    let res = "";
    if (h > 0) res += `${ones[h]} Hundred`;
    if (rem > 0) {
      if (res) res += " and ";
      res += convertTwoDigits(rem);
    }
    return res;
  }

  const crore = Math.floor(num / 10000000);
  let remainder = num % 10000000;
  const lakh = Math.floor(remainder / 100000);
  remainder = remainder % 100000;
  const thousand = Math.floor(remainder / 1000);
  remainder = remainder % 1000;
  const hundreds = remainder;

  const parts: string[] = [];
  if (crore > 0) parts.push(`${convertTwoDigits(crore)} Crore`);
  if (lakh > 0) parts.push(`${convertTwoDigits(lakh)} Lakh`);
  if (thousand > 0) parts.push(`${convertTwoDigits(thousand)} Thousand`);
  if (hundreds > 0) parts.push(convertThreeDigits(hundreds));

  return parts.join(" ").trim();
}

/**
 * Base-10 Blocks breakdown:
 * e.g. 3,452 -> { thousands: 3, hundreds: 4, tens: 5, ones: 2 }
 */
export function getBase10Blocks(n: number | string) {
  const num = parseMathNumber(n, 0);
  const thousands = Math.min(9, Math.floor(num / 1000));
  const hundreds = Math.floor((num % 1000) / 100);
  const tens = Math.floor((num % 100) / 10);
  const ones = num % 10;
  return { thousands, hundreds, tens, ones };
}

/**
 * Abacus Bead Breakdown for given number of rods
 * Rods from Left to Right: [ "TTh", "Th", "H", "T", "O" ] or configurable
 */
export function getAbacusRods(n: number | string, rodKeys: string[] = ["TTh", "Th", "H", "T", "O"]) {
  const num = parseMathNumber(n, 0);
  const str = String(num);
  const len = str.length;

  const keyMap: Record<string, number> = {
    O: 0,
    T: 1,
    H: 2,
    Th: 3,
    TTh: 4,
    L: 5,
    TL: 6,
    C: 7,
  };

  return rodKeys.map((key) => {
    const power = keyMap[key] ?? 0;
    const digitIndex = len - 1 - power;
    const beadCount = (digitIndex >= 0 && digitIndex < len) ? parseInt(str[digitIndex], 10) : 0;
    return {
      key,
      beadCount: Math.min(9, Math.max(0, beadCount)),
    };
  });
}

/**
 * Column Addition Solver with carry-over row:
 * Given numbers e.g. [3482, 1759], compute digits, carries, and sum
 */
export function solveColumnAddition(numbers: number[]) {
  const cleanNums = numbers.map((n) => Math.max(0, Math.floor(n)));
  const sum = cleanNums.reduce((acc, curr) => acc + curr, 0);
  const maxDigits = Math.max(...cleanNums.map((n) => String(n).length));

  const rows: number[][] = [];
  cleanNums.forEach((n) => {
    const padded = String(n).padStart(maxDigits, "0");
    rows.push(padded.split("").map(Number));
  });

  // Calculate carries from right to left
  const carries: number[] = new Array(maxDigits).fill(0);
  let currentCarry = 0;
  for (let col = maxDigits - 1; col >= 0; col--) {
    let colSum = currentCarry;
    for (let r = 0; r < rows.length; r++) {
      colSum += rows[r][col];
    }
    currentCarry = Math.floor(colSum / 10);
    if (col > 0) carries[col - 1] = currentCarry;
  }

  // Headers for columns
  const headerKeys = ["C", "TL", "L", "TTh", "Th", "H", "T", "O"];
  const headers = headerKeys.slice(headerKeys.length - maxDigits);

  return {
    numbers: cleanNums,
    rows,
    carries,
    sum,
    sumDigits: String(sum).split("").map(Number),
    headers,
    maxDigits,
  };
}

/**
 * Column Subtraction Solver with borrowing row:
 * Given [top, bottom], compute borrowing, crossed-out digits, and difference
 */
export function solveColumnSubtraction(top: number, bottom: number) {
  const minTop = Math.max(top, bottom);
  const minBottom = Math.min(top, bottom);
  const diff = minTop - minBottom;

  const topStr = String(minTop);
  const maxDigits = topStr.length;
  const bottomStr = String(minBottom).padStart(maxDigits, "0");

  const topDigits = topStr.split("").map(Number);
  const bottomDigits = bottomStr.split("").map(Number);

  // Compute borrowing array and modified top row
  const modifiedTop = [...topDigits];
  const borrowedFrom: boolean[] = new Array(maxDigits).fill(false);

  for (let i = maxDigits - 1; i >= 0; i--) {
    if (modifiedTop[i] < bottomDigits[i]) {
      // Find lender
      let j = i - 1;
      while (j >= 0 && modifiedTop[j] === 0) j--;
      if (j >= 0) {
        borrowedFrom[j] = true;
        modifiedTop[j] -= 1;
        for (let k = j + 1; k < i; k++) {
          borrowedFrom[k] = true;
          modifiedTop[k] = 9;
        }
        modifiedTop[i] += 10;
      }
    }
  }

  const headerKeys = ["C", "TL", "L", "TTh", "Th", "H", "T", "O"];
  const headers = headerKeys.slice(headerKeys.length - maxDigits);

  return {
    top: minTop,
    bottom: minBottom,
    diff,
    topDigits,
    bottomDigits,
    modifiedTop,
    borrowedFrom,
    headers,
    maxDigits,
    diffDigits: String(diff).padStart(maxDigits, " ").split(""),
  };
}

/**
 * Long Division Solver:
 * Dividend / Divisor -> Quotient, Remainder, and step-by-step subtraction rows
 */
export function solveLongDivision(dividend: number, divisor: number) {
  const div = Math.max(1, divisor);
  const d = Math.max(0, dividend);
  const quotient = Math.floor(d / div);
  const remainder = d % div;

  const dStr = String(d);
  const steps: Array<{ current: number; multiplied: number; subResult: number }> = [];

  let current = 0;
  for (let i = 0; i < dStr.length; i++) {
    current = current * 10 + parseInt(dStr[i], 10);
    if (current >= div || steps.length > 0 || i === dStr.length - 1) {
      const qDigit = Math.floor(current / div);
      const multiplied = qDigit * div;
      const subResult = current - multiplied;
      steps.push({ current, multiplied, subResult });
      current = subResult;
    }
  }

  return {
    dividend: d,
    divisor: div,
    quotient,
    remainder,
    steps,
  };
}

/**
 * Clock angles calculator
 */
export function getClockHandAngles(hours: number, minutes: number, seconds: number = 0) {
  const h = hours % 12;
  const m = minutes % 60;
  const s = seconds % 60;

  const secondAngle = s * 6; // 360 / 60
  const minuteAngle = m * 6 + s * 0.1;
  const hourAngle = h * 30 + m * 0.5 + s * (0.5 / 60);

  return { hourAngle, minuteAngle, secondAngle };
}

/**
 * Fraction SVG Pie Slice Path Generator
 */
export function getPieSlicePath(
  cx: number,
  cy: number,
  r: number,
  startAngleDeg: number,
  endAngleDeg: number
): string {
  const startRad = ((startAngleDeg - 90) * Math.PI) / 180;
  const endRad = ((endAngleDeg - 90) * Math.PI) / 180;

  const x1 = cx + r * Math.cos(startRad);
  const y1 = cy + r * Math.sin(startRad);
  const x2 = cx + r * Math.cos(endRad);
  const y2 = cy + r * Math.sin(endRad);

  const delta = (endAngleDeg - startAngleDeg + 360) % 360;
  const largeArcFlag = delta > 180 ? 1 : 0;

  // When delta is full 360
  if (delta === 0 && startAngleDeg !== endAngleDeg) {
    return `M ${cx} ${cy - r} A ${r} ${r} 0 1 1 ${cx} ${cy + r} A ${r} ${r} 0 1 1 ${cx} ${cy - r} Z`;
  }

  return `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArcFlag} 1 ${x2} ${y2} Z`;
}

/**
 * Indian Rupee Currency Breakdown
 */
export function getIndianCurrencyBreakdown(amount: number) {
  let rem = Math.max(0, Math.floor(amount));
  const denominations = [500, 200, 100, 50, 20, 10, 5, 2, 1];
  const breakdown: Array<{ denom: number; count: number; type: "note" | "coin" }> = [];

  denominations.forEach((d) => {
    const count = Math.floor(rem / d);
    if (count > 0) {
      breakdown.push({
        denom: d,
        count,
        type: d >= 10 ? "note" : "coin",
      });
      rem %= d;
    }
  });

  return breakdown;
}

/**
 * Tally Marks representation for an integer:
 * Returns count of completed 'gates' (groups of 5) and leftover vertical lines (1-4)
 */
export function getTallyMarks(val: number) {
  const n = Math.max(0, Math.floor(val));
  const fullFives = Math.floor(n / 5);
  const remainder = n % 5;
  return { fullFives, remainder, total: n };
}

/**
 * Local Deterministic Question Generator ("Generate Similar")
 * Zero AI dependency, fast & reliable for Class 1-5 textbook creation.
 */
export function generateSimilarQuestion(topic: string, rules: any = {}): Record<string, any> {
  const digits = rules.digitCount || 3;
  const min = rules.min ?? Math.pow(10, digits - 1);
  const max = rules.max ?? (Math.pow(10, digits) - 1);

  const randInt = (low: number, high: number) =>
    Math.floor(Math.random() * (high - low + 1)) + low;

  switch (topic) {
    case "place-value":
    case "numbers": {
      const generated = randInt(min, max);
      return { number: generated };
    }

    case "addition": {
      const a = randInt(min, max);
      const b = randInt(min, max);
      return { num1: a, num2: b, sum: a + b };
    }

    case "subtraction": {
      const a = randInt(min, max);
      const b = randInt(min, a);
      return { num1: a, num2: b, diff: a - b };
    }

    case "multiplication": {
      const a = randInt(2, 12);
      const b = randInt(2, 12);
      return { rows: a, cols: b, product: a * b };
    }

    case "division": {
      const divisor = randInt(2, 9);
      const quotient = randInt(2, 20);
      const remainder = randInt(0, divisor - 1);
      const dividend = divisor * quotient + remainder;
      return { dividend, divisor, quotient, remainder };
    }

    case "fractions": {
      const denominator = randInt(2, 12);
      const numerator = randInt(1, denominator - 1);
      return { numerator, denominator };
    }

    case "time": {
      const h = randInt(1, 12);
      const m = [0, 15, 30, 45, 10, 20, 25, 35, 50, 55][randInt(0, 9)];
      return { hours: h, minutes: m };
    }

    case "money": {
      const total = randInt(10, 500);
      return { amount: total };
    }

    default:
      return { number: randInt(min, max) };
  }
}
