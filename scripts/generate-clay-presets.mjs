import fs from "fs";
import path from "path";

const targetDir = "public/assets/picture-presets";
if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

// Helper to create an SVG wrapper with standard clay lighting filters
function claySvg(innerContent, viewBox = "0 0 512 512") {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" width="100%" height="100%">
  <defs>
    <!-- Soft Clay Drop Shadow -->
    <filter id="clayShadow" x="-20%" y="-20%" width="150%" height="150%">
      <feDropShadow dx="0" dy="12" stdDeviation="14" flood-color="#0f172a" flood-opacity="0.18" />
      <feDropShadow dx="0" dy="4" stdDeviation="6" flood-color="#0f172a" flood-opacity="0.12" />
    </filter>
    <filter id="deepShadow" x="-30%" y="-30%" width="160%" height="160%">
      <feDropShadow dx="0" dy="18" stdDeviation="20" flood-color="#1e1b4b" flood-opacity="0.22" />
    </filter>

    <!-- Clay Gradients -->
    <linearGradient id="clayRed" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stopColor="#ff7675" />
      <stop offset="100%" stopColor="#d63031" />
    </linearGradient>
    <linearGradient id="clayCoral" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stopColor="#ff9f43" />
      <stop offset="100%" stopColor="#ee5253" />
    </linearGradient>
    <linearGradient id="clayYellow" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stopColor="#ffeaa7" />
      <stop offset="60%" stopColor="#fdcb6e" />
      <stop offset="100%" stopColor="#e17055" />
    </linearGradient>
    <linearGradient id="clayGreen" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stopColor="#55efc4" />
      <stop offset="100%" stopColor="#00b894" />
    </linearGradient>
    <linearGradient id="clayTeal" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stopColor="#81ecec" />
      <stop offset="100%" stopColor="#00cec9" />
    </linearGradient>
    <linearGradient id="clayBlue" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stopColor="#74b9ff" />
      <stop offset="100%" stopColor="#0984e3" />
    </linearGradient>
    <linearGradient id="clayIndigo" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stopColor="#a29bfe" />
      <stop offset="100%" stopColor="#6c5ce7" />
    </linearGradient>
    <linearGradient id="clayPink" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stopColor="#fd79a8" />
      <stop offset="100%" stopColor="#e84393" />
    </linearGradient>
    <linearGradient id="clayPurple" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stopColor="#d980fa" />
      <stop offset="100%" stopColor="#9980fa" />
    </linearGradient>
    <linearGradient id="clayWhite" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stopColor="#ffffff" />
      <stop offset="100%" stopColor="#dfe6e9" />
    </linearGradient>
    <linearGradient id="clayWood" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stopColor="#e0b88f" />
      <stop offset="100%" stopColor="#b37d4e" />
    </linearGradient>
    <linearGradient id="clayGold" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stopColor="#fff275" />
      <stop offset="50%" stopColor="#fbc531" />
      <stop offset="100%" stopColor="#e1b12c" />
    </linearGradient>
    <linearGradient id="claySilver" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stopColor="#f5f6fa" />
      <stop offset="60%" stopColor="#dcdde1" />
      <stop offset="100%" stopColor="#718093" />
    </linearGradient>
    <linearGradient id="clayDark" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stopColor="#636e72" />
      <stop offset="100%" stopColor="#2d3436" />
    </linearGradient>
    <linearGradient id="clayGlass" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stopColor="#ffffff" stopOpacity="0.8" />
      <stop offset="100%" stopColor="#81ecec" stopOpacity="0.3" />
    </linearGradient>

    <!-- Glossy Specular Highlight -->
    <linearGradient id="gloss" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stopColor="#ffffff" stopOpacity="0.65" />
      <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
    </linearGradient>
  </defs>

  <!-- Ground Ambient Shadow -->
  <ellipse cx="256" cy="460" rx="170" ry="24" fill="#0f172a" opacity="0.12" />

  ${innerContent}
</svg>`;
}

// Define the 42 images
const CLAY_IMAGES = [
  // 1. Abacus
  {
    id: "clay-abacus",
    name: "3D Clay Abacus",
    tags: "abacus counting beads arithmetic math tool",
    svg: `
      <g filter="url(#clayShadow)">
        <!-- Wooden Frame -->
        <rect x="96" y="110" width="320" height="280" rx="24" fill="url(#clayWood)" stroke="#8c5828" stroke-width="4" />
        <rect x="124" y="138" width="264" height="224" rx="14" fill="#f8fafc" />
        <!-- Separator Bar -->
        <rect x="96" y="200" width="320" height="20" rx="6" fill="url(#clayWood)" />
        <!-- Metal Rods -->
        <line x1="160" y1="138" x2="160" y2="362" stroke="url(#claySilver)" stroke-width="6" stroke-linecap="round" />
        <line x1="224" y1="138" x2="224" y2="362" stroke="url(#claySilver)" stroke-width="6" stroke-linecap="round" />
        <line x1="288" y1="138" x2="288" y2="362" stroke="url(#claySilver)" stroke-width="6" stroke-linecap="round" />
        <line x1="352" y1="138" x2="352" y2="362" stroke="url(#claySilver)" stroke-width="6" stroke-linecap="round" />
        <!-- Upper Beads -->
        <ellipse cx="160" cy="170" rx="22" ry="15" fill="url(#clayRed)" />
        <ellipse cx="224" cy="170" rx="22" ry="15" fill="url(#clayYellow)" />
        <ellipse cx="288" cy="170" rx="22" ry="15" fill="url(#clayGreen)" />
        <ellipse cx="352" cy="170" rx="22" ry="15" fill="url(#clayBlue)" />
        <!-- Lower Beads -->
        <ellipse cx="160" cy="245" rx="22" ry="15" fill="url(#clayRed)" />
        <ellipse cx="160" cy="280" rx="22" ry="15" fill="url(#clayRed)" />
        <ellipse cx="224" cy="245" rx="22" ry="15" fill="url(#clayYellow)" />
        <ellipse cx="288" cy="300" rx="22" ry="15" fill="url(#clayGreen)" />
        <ellipse cx="288" cy="335" rx="22" ry="15" fill="url(#clayGreen)" />
        <ellipse cx="352" cy="245" rx="22" ry="15" fill="url(#clayBlue)" />
        <ellipse cx="352" cy="280" rx="22" ry="15" fill="url(#clayBlue)" />
        <ellipse cx="352" cy="315" rx="22" ry="15" fill="url(#clayBlue)" />
        <!-- Gloss highlight -->
        <ellipse cx="154" cy="165" rx="10" ry="5" fill="#ffffff" opacity="0.6" />
        <ellipse cx="218" cy="165" rx="10" ry="5" fill="#ffffff" opacity="0.6" />
        <ellipse cx="282" cy="165" rx="10" ry="5" fill="#ffffff" opacity="0.6" />
        <ellipse cx="346" cy="165" rx="10" ry="5" fill="#ffffff" opacity="0.6" />
      </g>
    `
  },

  // 2. Protractor
  {
    id: "clay-protractor",
    name: "3D Clay Protractor",
    tags: "protractor angle degree geometry measurement math",
    svg: `
      <g filter="url(#clayShadow)">
        <!-- Protractor Body -->
        <path d="M 76 340 A 180 180 0 0 1 436 340 Z" fill="url(#clayTeal)" stroke="#00a896" stroke-width="6" />
        <!-- Inner cutout -->
        <path d="M 176 340 A 80 80 0 0 1 336 340 Z" fill="#ffffff" />
        <!-- Degree Ticks -->
        <line x1="256" y1="160" x2="256" y2="185" stroke="#ffffff" stroke-width="4" stroke-linecap="round" />
        <line x1="128" y1="340" x2="152" y2="340" stroke="#ffffff" stroke-width="4" stroke-linecap="round" />
        <line x1="384" y1="340" x2="360" y2="340" stroke="#ffffff" stroke-width="4" stroke-linecap="round" />
        <line x1="166" y1="250" x2="185" y2="262" stroke="#ffffff" stroke-width="4" stroke-linecap="round" />
        <line x1="346" y1="250" x2="327" y2="262" stroke="#ffffff" stroke-width="4" stroke-linecap="round" />
        <!-- Center Origin Dot -->
        <circle cx="256" cy="340" r="10" fill="#0984e3" />
        <circle cx="256" cy="340" r="4" fill="#ffffff" />
        <!-- Angle Arc -->
        <path d="M 216 340 A 40 40 0 0 1 296 340" fill="none" stroke="#fdcb6e" stroke-width="4" stroke-dasharray="4,4" />
        <!-- Gloss Reflection -->
        <path d="M 110 320 A 150 150 0 0 1 402 320" fill="none" stroke="#ffffff" stroke-width="6" opacity="0.45" stroke-linecap="round" />
      </g>
    `
  },

  // 3. Compass Divider
  {
    id: "clay-compass-divider",
    name: "3D Clay Compass Tool",
    tags: "compass divider circles geometry technical drawing math",
    svg: `
      <g filter="url(#clayShadow)">
        <!-- Top Joint Wheel -->
        <circle cx="256" cy="110" r="28" fill="url(#claySilver)" />
        <circle cx="256" cy="110" r="14" fill="#636e72" />
        <!-- Top Handle -->
        <rect x="246" y="60" width="20" height="40" rx="8" fill="url(#clayCoral)" />
        <!-- Left Leg (Steel Needle) -->
        <path d="M 242 124 L 140 370 L 146 376 L 254 130 Z" fill="url(#claySilver)" />
        <polygon points="140,370 128,400 146,376" fill="#2d3436" />
        <!-- Right Leg (with Pencil Clamp) -->
        <path d="M 270 124 L 372 370 L 366 376 L 258 130 Z" fill="url(#claySilver)" />
        <!-- Clay Pencil Attached -->
        <rect x="350" y="310" width="34" height="85" rx="6" fill="url(#clayYellow)" transform="rotate(22 367 352)" />
        <polygon points="388,382 396,410 374,394" fill="#ffeaa7" />
        <polygon points="392,398 396,410 382,404" fill="#2d3436" />
        <!-- Pencil Clamp Screw -->
        <rect x="345" y="325" width="24" height="12" rx="4" fill="url(#clayCoral)" />
        <!-- Angle Adjustment Arc -->
        <path d="M 210 240 Q 256 260 302 240" fill="none" stroke="url(#clayCoral)" stroke-width="8" stroke-linecap="round" />
        <!-- Gloss -->
        <circle cx="250" cy="104" r="8" fill="#ffffff" opacity="0.7" />
      </g>
    `
  },

  // 4. Geometry Ruler
  {
    id: "clay-geometry-ruler",
    name: "3D Clay Math Ruler",
    tags: "ruler measurement centimeters inches geometry length",
    svg: `
      <g filter="url(#clayShadow)">
        <!-- Ruler Body (angled diagonally for 3D aesthetic) -->
        <rect x="66" y="210" width="380" height="96" rx="18" fill="url(#clayYellow)" transform="rotate(-15 256 256)" stroke="#e17055" stroke-width="4" />
        <g transform="rotate(-15 256 256)">
          <!-- Ruler Measurement Lines -->
          ${Array.from({ length: 16 }).map((_, i) => {
            const x = 90 + i * 22;
            const isMajor = i % 2 === 0;
            const h = isMajor ? 26 : 14;
            return `<line x1="${x}" y1="214" x2="${x}" y2="${214 + h}" stroke="#2d3436" stroke-width="3" stroke-linecap="round" />
            ${isMajor ? `<text x="${x}" y="258" font-size="14" font-weight="bold" font-family="sans-serif" fill="#2d3436" text-anchor="middle">${i}</text>` : ""}`;
          }).join("\n")}
          <!-- CM label -->
          <text x="76" y="285" font-size="12" font-weight="bold" font-family="sans-serif" fill="#d63031">cm</text>
          <!-- Shiny clay bevel reflection -->
          <rect x="80" y="214" width="352" height="6" rx="3" fill="#ffffff" opacity="0.6" />
        </g>
      </g>
    `
  },

  // 5. Set Square
  {
    id: "clay-set-square",
    name: "3D Clay Set Square",
    tags: "set square triangle 90 degree geometry angle ruler",
    svg: `
      <g filter="url(#clayShadow)">
        <!-- Triangle Body -->
        <polygon points="110,390 410,390 110,90" fill="url(#clayGreen)" stroke="#00a896" stroke-width="6" stroke-linejoin="round" />
        <!-- Inner Triangular Cutout -->
        <polygon points="160,350 330,350 160,180" fill="#f8fafc" stroke="#55efc4" stroke-width="4" stroke-linejoin="round" />
        <!-- Angle marker (90 deg) -->
        <rect x="114" y="364" width="22" height="22" fill="none" stroke="#2d3436" stroke-width="3" />
        <!-- Ticks on bottom -->
        ${Array.from({ length: 11 }).map((_, i) => `<line x1="${160 + i * 22}" y1="386" x2="${160 + i * 22}" y2="${374 - (i % 2 === 0 ? 8 : 0)}" stroke="#ffffff" stroke-width="3" stroke-linecap="round" />`).join("\n")}
        <!-- Specular Highlight -->
        <line x1="120" y1="110" x2="390" y2="380" stroke="#ffffff" stroke-width="6" opacity="0.5" stroke-linecap="round" />
      </g>
    `
  },

  // 6. Calculator
  {
    id: "clay-calculator",
    name: "3D Clay Calculator",
    tags: "calculator calculation arithmetic numbers math keypad",
    svg: `
      <g filter="url(#clayShadow)">
        <!-- Calculator Chassis -->
        <rect x="120" y="70" width="272" height="372" rx="36" fill="url(#clayPurple)" stroke="#6c5ce7" stroke-width="5" />
        <!-- Screen Bezel -->
        <rect x="150" y="105" width="212" height="74" rx="16" fill="url(#clayDark)" />
        <rect x="156" y="111" width="200" height="62" rx="12" fill="#55efc4" />
        <!-- Displayed Number -->
        <text x="340" y="152" font-size="28" font-weight="bold" font-family="monospace" fill="#2d3436" text-anchor="end">1,234.5</text>
        <!-- Clay Keypad Buttons -->
        ${[
          ["7", "8", "9", "÷"],
          ["4", "5", "6", "×"],
          ["1", "2", "3", "−"],
          ["C", "0", "=", "+"]
        ].map((row, r) => row.map((char, c) => {
          const bx = 152 + c * 54;
          const by = 205 + r * 54;
          const isOp = ["÷", "×", "−", "+", "="].includes(char);
          const isClear = char === "C";
          const grad = isClear ? "url(#clayRed)" : isOp ? "url(#clayCoral)" : "url(#clayWhite)";
          const txtColor = isClear || isOp ? "#ffffff" : "#2d3436";
          return `
            <g>
              <rect x="${bx}" y="${by}" width="44" height="44" rx="14" fill="${grad}" filter="url(#clayShadow)" />
              <rect x="${bx + 4}" y="${by + 4}" width="36" height="8" rx="4" fill="#ffffff" opacity="0.4" />
              <text x="${bx + 22}" y="${by + 28}" font-size="18" font-weight="bold" font-family="sans-serif" fill="${txtColor}" text-anchor="middle">${char}</text>
            </g>
          `;
        }).join("")).join("")}
      </g>
    `
  },

  // 7. Plus Minus
  {
    id: "clay-plus-minus",
    name: "3D Clay Plus & Minus",
    tags: "plus minus addition subtraction symbols operators math",
    svg: `
      <g filter="url(#clayShadow)">
        <!-- Plus Sign (Puffy 3D Clay) -->
        <g transform="translate(60, 80)">
          <!-- Vertical bar -->
          <rect x="90" y="30" width="46" height="150" rx="23" fill="url(#clayCoral)" />
          <!-- Horizontal bar -->
          <rect x="38" y="82" width="150" height="46" rx="23" fill="url(#clayCoral)" />
          <!-- Highlights -->
          <ellipse cx="113" cy="50" rx="14" ry="8" fill="#ffffff" opacity="0.6" />
          <ellipse cx="60" cy="105" rx="8" ry="14" fill="#ffffff" opacity="0.6" />
        </g>
        <!-- Minus Sign -->
        <g transform="translate(230, 250)">
          <rect x="30" y="60" width="160" height="46" rx="23" fill="url(#clayIndigo)" />
          <!-- Highlight -->
          <rect x="44" y="68" width="132" height="12" rx="6" fill="#ffffff" opacity="0.5" />
        </g>
      </g>
    `
  },

  // 8. Multiply Divide
  {
    id: "clay-multiply-divide",
    name: "3D Clay Multiply & Divide",
    tags: "multiplication division times by math symbols operators",
    svg: `
      <g filter="url(#clayShadow)">
        <!-- Multiply Cross (Angled) -->
        <g transform="translate(140, 150) rotate(45)">
          <rect x="-22" y="-70" width="44" height="140" rx="22" fill="url(#clayYellow)" />
          <rect x="-70" y="-22" width="140" height="44" rx="22" fill="url(#clayYellow)" />
          <circle cx="-6" cy="-45" r="10" fill="#ffffff" opacity="0.6" />
        </g>
        <!-- Divide Symbol -->
        <g transform="translate(300, 230)">
          <!-- Top Dot -->
          <circle cx="70" cy="20" r="22" fill="url(#clayBlue)" />
          <circle cx="64" cy="14" r="8" fill="#ffffff" opacity="0.6" />
          <!-- Middle Bar -->
          <rect x="10" y="60" width="120" height="34" rx="17" fill="url(#clayBlue)" />
          <rect x="22" y="66" width="96" height="8" rx="4" fill="#ffffff" opacity="0.5" />
          <!-- Bottom Dot -->
          <circle cx="70" cy="134" r="22" fill="url(#clayBlue)" />
          <circle cx="64" cy="128" r="8" fill="#ffffff" opacity="0.6" />
        </g>
      </g>
    `
  },

  // 9. Equals Badge
  {
    id: "clay-equals-badge",
    name: "3D Clay Equals Badge",
    tags: "equals sign equality balance badge math result",
    svg: `
      <g filter="url(#clayShadow)">
        <!-- Circular Badge Shield -->
        <circle cx="256" cy="256" r="160" fill="url(#clayPink)" stroke="#d980fa" stroke-width="8" />
        <!-- Inner Ring -->
        <circle cx="256" cy="256" r="132" fill="#ffffff" opacity="0.2" />
        <!-- Top Bar -->
        <rect x="170" y="200" width="172" height="40" rx="20" fill="url(#clayYellow)" />
        <rect x="180" y="206" width="152" height="10" rx="5" fill="#ffffff" opacity="0.7" />
        <!-- Bottom Bar -->
        <rect x="170" y="272" width="172" height="40" rx="20" fill="url(#clayYellow)" />
        <rect x="180" y="278" width="152" height="10" rx="5" fill="#ffffff" opacity="0.7" />
        <!-- Sparkle Doodles -->
        <polygon points="120,150 126,164 140,170 126,176 120,190 114,176 100,170 114,164" fill="#ffeaa7" />
        <polygon points="380,320 384,332 396,336 384,340 380,352 376,340 364,336 376,332" fill="#ffeaa7" />
        <!-- Big Specular Highlight -->
        <ellipse cx="210" cy="150" rx="60" ry="24" fill="#ffffff" opacity="0.4" transform="rotate(-30 210 150)" />
      </g>
    `
  },

  // 10. Fraction Pie
  {
    id: "clay-fraction-pie",
    name: "3D Clay Fraction Pie",
    tags: "fraction pie chart quarters halves math parts of whole",
    svg: `
      <g filter="url(#clayShadow)">
        <!-- 3/4 Base Pie in Mint Green -->
        <path d="M 256 256 L 256 106 A 150 150 0 1 1 106 256 Z" fill="url(#clayGreen)" stroke="#00b894" stroke-width="4" />
        <!-- 1/4 Lifted Pie Slice in Coral/Orange -->
        <g transform="translate(-16, -16)">
          <path d="M 256 256 L 106 256 A 150 150 0 0 1 256 106 Z" fill="url(#clayCoral)" stroke="#d63031" stroke-width="4" filter="url(#clayShadow)" />
          <!-- Fraction text on lifted slice -->
          <text x="195" y="205" font-size="28" font-weight="bold" font-family="sans-serif" fill="#ffffff" text-anchor="middle">¼</text>
        </g>
        <!-- Fraction text on main body -->
        <text x="310" y="320" font-size="34" font-weight="bold" font-family="sans-serif" fill="#ffffff" text-anchor="middle">¾</text>
        <!-- Gloss curves -->
        <path d="M 270 120 A 136 136 0 0 1 392 242" fill="none" stroke="#ffffff" stroke-width="8" opacity="0.45" stroke-linecap="round" />
      </g>
    `
  },

  // 11. Fraction Bars
  {
    id: "clay-fraction-bars",
    name: "3D Clay Fraction Bars",
    tags: "fraction bars blocks parts fractions visual model",
    svg: `
      <g filter="url(#clayShadow)">
        <!-- Bar 1: Whole (1) -->
        <g transform="translate(66, 110)">
          <rect x="0" y="0" width="380" height="56" rx="14" fill="url(#clayPurple)" />
          <rect x="6" y="6" width="368" height="12" rx="6" fill="#ffffff" opacity="0.45" />
          <text x="190" y="37" font-size="22" font-weight="bold" font-family="sans-serif" fill="#ffffff" text-anchor="middle">1 (Whole)</text>
        </g>
        <!-- Bar 2: Halves (1/2 + 1/2) -->
        <g transform="translate(66, 180)">
          <rect x="0" y="0" width="186" height="56" rx="14" fill="url(#clayBlue)" />
          <text x="93" y="37" font-size="22" font-weight="bold" font-family="sans-serif" fill="#ffffff" text-anchor="middle">½</text>
          <rect x="194" y="0" width="186" height="56" rx="14" fill="url(#clayBlue)" />
          <text x="287" y="37" font-size="22" font-weight="bold" font-family="sans-serif" fill="#ffffff" text-anchor="middle">½</text>
        </g>
        <!-- Bar 3: Thirds (1/3 + 1/3 + 1/3) -->
        <g transform="translate(66, 250)">
          <rect x="0" y="0" width="122" height="56" rx="14" fill="url(#clayTeal)" />
          <text x="61" y="37" font-size="20" font-weight="bold" font-family="sans-serif" fill="#ffffff" text-anchor="middle">⅓</text>
          <rect x="129" y="0" width="122" height="56" rx="14" fill="url(#clayTeal)" />
          <text x="190" y="37" font-size="20" font-weight="bold" font-family="sans-serif" fill="#ffffff" text-anchor="middle">⅓</text>
          <rect x="258" y="0" width="122" height="56" rx="14" fill="url(#clayTeal)" />
          <text x="319" y="37" font-size="20" font-weight="bold" font-family="sans-serif" fill="#ffffff" text-anchor="middle">⅓</text>
        </g>
        <!-- Bar 4: Quarters (1/4 x 4) -->
        <g transform="translate(66, 320)">
          ${[0, 1, 2, 3].map(i => `
            <rect x="${i * 97}" y="0" width="89" height="56" rx="14" fill="url(#clayCoral)" />
            <text x="${i * 97 + 44}" y="37" font-size="19" font-weight="bold" font-family="sans-serif" fill="#ffffff" text-anchor="middle">¼</text>
          `).join("")}
        </g>
      </g>
    `
  },

  // 12. 3D Cube
  {
    id: "clay-3d-cube",
    name: "3D Clay Cube Prism",
    tags: "cube 3d shapes solid geometry volume vertices faces",
    svg: `
      <g filter="url(#clayShadow)" transform="translate(256, 256)">
        <!-- Top Face -->
        <polygon points="0,-140 120,-70 0,0 -120,-70" fill="url(#clayYellow)" stroke="#fdcb6e" stroke-width="4" stroke-linejoin="round" />
        <!-- Left Face -->
        <polygon points="-120,-70 0,0 0,140 -120,70" fill="url(#clayCoral)" stroke="#e17055" stroke-width="4" stroke-linejoin="round" />
        <!-- Right Face -->
        <polygon points="0,0 120,-70 120,70 0,140" fill="url(#clayRed)" stroke="#d63031" stroke-width="4" stroke-linejoin="round" />
        <!-- Vertex Spheres -->
        <circle cx="0" cy="-140" r="12" fill="#ffffff" />
        <circle cx="120" cy="-70" r="12" fill="#ffffff" />
        <circle cx="-120" cy="-70" r="12" fill="#ffffff" />
        <circle cx="0" cy="0" r="14" fill="#ffffff" />
        <circle cx="-120" cy="70" r="12" fill="#ffffff" />
        <circle cx="120" cy="70" r="12" fill="#ffffff" />
        <circle cx="0" cy="140" r="12" fill="#ffffff" />
        <!-- Shimmer highlights -->
        <line x1="-80" y1="-80" x2="-20" y2="-45" stroke="#ffffff" stroke-width="6" opacity="0.6" stroke-linecap="round" />
      </g>
    `
  },

  // 13. Sphere and Cylinder
  {
    id: "clay-3d-sphere-cylinder",
    name: "3D Clay Sphere & Cylinder",
    tags: "sphere cylinder 3d shapes geometry solid surface area",
    svg: `
      <g filter="url(#clayShadow)">
        <!-- Cylinder (Left) -->
        <g transform="translate(130, 260)">
          <!-- Body -->
          <rect x="-60" y="-70" width="120" height="140" fill="url(#clayIndigo)" />
          <!-- Bottom Cap -->
          <ellipse cx="0" cy="70" rx="60" ry="24" fill="#6c5ce7" />
          <!-- Top Cap -->
          <ellipse cx="0" cy="-70" rx="60" ry="24" fill="url(#clayIndigo)" stroke="#a29bfe" stroke-width="4" />
          <ellipse cx="-16" cy="-76" rx="30" ry="10" fill="#ffffff" opacity="0.5" />
        </g>
        <!-- Sphere (Right) -->
        <g transform="translate(330, 270)">
          <circle cx="0" cy="0" r="80" fill="url(#clayPink)" />
          <!-- 3D Spherical Specular Glow -->
          <circle cx="-28" cy="-28" r="26" fill="#ffffff" opacity="0.65" />
          <ellipse cx="-20" cy="-20" rx="46" ry="34" fill="#ffffff" opacity="0.25" />
        </g>
      </g>
    `
  },

  // 14. Cone and Pyramid
  {
    id: "clay-3d-cone-pyramid",
    name: "3D Clay Cone & Pyramid",
    tags: "cone pyramid solid geometry 3d shapes volume vertices",
    svg: `
      <g filter="url(#clayShadow)">
        <!-- Cone (Left) -->
        <g transform="translate(150, 250)">
          <path d="M 0 -120 L -70 90 A 70 24 0 0 0 70 90 Z" fill="url(#clayTeal)" />
          <ellipse cx="0" cy="90" rx="70" ry="24" fill="#00cec9" stroke="#55efc4" stroke-width="4" />
          <!-- Highlight down side -->
          <line x1="0" y1="-110" x2="-40" y2="80" stroke="#ffffff" stroke-width="6" opacity="0.5" stroke-linecap="round" />
        </g>
        <!-- Pyramid (Right) -->
        <g transform="translate(340, 250)">
          <!-- Left side -->
          <polygon points="0,-120 -80,80 10,100" fill="url(#clayYellow)" />
          <!-- Right side -->
          <polygon points="0,-120 10,100 80,70" fill="url(#clayCoral)" />
          <!-- Vertex Cap -->
          <circle cx="0" cy="-120" r="10" fill="#ffffff" />
        </g>
      </g>
    `
  },

  // 15. Blackboard Math
  {
    id: "clay-blackboard-math",
    name: "3D Clay Math Blackboard",
    tags: "blackboard chalkboard math formulas classroom lesson",
    svg: `
      <g filter="url(#clayShadow)">
        <!-- Wooden Easel Frame -->
        <rect x="80" y="90" width="352" height="260" rx="20" fill="url(#clayWood)" stroke="#8c5828" stroke-width="6" />
        <!-- Green Slate Surface -->
        <rect x="104" y="114" width="304" height="212" rx="10" fill="#1b4d3e" />
        <!-- Chalk Doodles -->
        <text x="140" y="165" font-size="24" font-weight="bold" font-family="'Comic Sans MS', sans-serif" fill="#ffffff">a² + b² = c²</text>
        <text x="140" y="215" font-size="22" font-weight="bold" font-family="'Comic Sans MS', sans-serif" fill="#ffeaa7">π ≈ 3.14159</text>
        <text x="140" y="265" font-size="22" font-weight="bold" font-family="'Comic Sans MS', sans-serif" fill="#74b9ff">E = mc²</text>
        <!-- Triangle Diagram on Board -->
        <polygon points="310,240 370,240 310,180" fill="none" stroke="#fd79a8" stroke-width="4" stroke-dasharray="4,4" />
        <!-- Wooden Chalk Tray -->
        <rect x="60" y="340" width="392" height="18" rx="6" fill="url(#clayWood)" />
        <!-- White and Pink Chalk Sticks -->
        <rect x="160" y="332" width="30" height="8" rx="4" fill="#ffffff" />
        <rect x="200" y="332" width="24" height="8" rx="4" fill="#fd79a8" />
        <!-- Wooden Legs -->
        <line x1="120" y1="358" x2="90" y2="440" stroke="url(#clayWood)" stroke-width="12" stroke-linecap="round" />
        <line x1="392" y1="358" x2="422" y2="440" stroke="url(#clayWood)" stroke-width="12" stroke-linecap="round" />
      </g>
    `
  },

  // 16. Gold Trophy
  {
    id: "clay-gold-trophy",
    name: "3D Clay Gold Math Trophy",
    tags: "trophy gold award achievement champion winner math medal",
    svg: `
      <g filter="url(#clayShadow)" transform="translate(256, 240)">
        <!-- Handles -->
        <path d="M -80 -60 C -140 -60 -130 30 -60 40" fill="none" stroke="url(#clayGold)" stroke-width="18" stroke-linecap="round" />
        <path d="M 80 -60 C 140 -60 130 30 60 40" fill="none" stroke="url(#clayGold)" stroke-width="18" stroke-linecap="round" />
        <!-- Cup Body -->
        <path d="M -80 -90 L 80 -90 C 80 10 50 70 0 80 C -50 70 -80 10 -80 -90 Z" fill="url(#clayGold)" stroke="#d49e08" stroke-width="5" />
        <!-- Embossed Star on Cup -->
        <polygon points="0,-35 8,-12 32,-12 12,4 19,26 0,12 -19,26 -12,4 -32,-12 -8,-12" fill="#ffffff" />
        <!-- Stem -->
        <rect x="-16" y="80" width="32" height="40" rx="8" fill="url(#clayGold)" />
        <!-- Base Pedestal -->
        <rect x="-70" y="120" width="140" height="50" rx="14" fill="url(#clayDark)" />
        <!-- Plaque -->
        <rect x="-50" y="132" width="100" height="24" rx="6" fill="url(#clayGold)" />
        <text x="0" y="149" font-size="12" font-weight="bold" font-family="sans-serif" fill="#2d3436" text-anchor="middle">MATH #1</text>
        <!-- Gloss highlight -->
        <ellipse cx="-40" cy="-60" rx="16" ry="40" fill="#ffffff" opacity="0.45" transform="rotate(-15 -40 -60)" />
      </g>
    `
  },

  // 17. 1st Place Medal
  {
    id: "clay-medal-first",
    name: "3D Clay First Place Medal",
    tags: "medal first place ribbon award math badge star",
    svg: `
      <g filter="url(#clayShadow)" transform="translate(256, 240)">
        <!-- Ribbon V -->
        <path d="M -70 -160 L -20 0 L 0 20 L -60 -160" fill="url(#clayBlue)" />
        <path d="M 70 -160 L 20 0 L 0 20 L 60 -160" fill="url(#clayRed)" />
        <path d="M -40 -160 L 0 -30 L 40 -160" fill="#ffffff" />
        <!-- Medallion Disc -->
        <circle cx="0" cy="50" r="90" fill="url(#clayGold)" stroke="#d49e08" stroke-width="6" />
        <!-- Inner Ring -->
        <circle cx="0" cy="50" r="74" fill="none" stroke="#ffffff" stroke-width="4" stroke-dasharray="8,6" />
        <!-- Number 1 -->
        <text x="0" y="78" font-size="76" font-weight="900" font-family="sans-serif" fill="#ffffff" text-anchor="middle">1</text>
        <!-- Little Laurel Leaves -->
        <ellipse cx="-45" cy="50" rx="8" ry="14" fill="#ffffff" opacity="0.7" transform="rotate(-25 -45 50)" />
        <ellipse cx="45" cy="50" rx="8" ry="14" fill="#ffffff" opacity="0.7" transform="rotate(25 45 50)" />
        <!-- Gloss reflection -->
        <ellipse cx="-30" cy="15" rx="30" ry="14" fill="#ffffff" opacity="0.5" transform="rotate(-30 -30 15)" />
      </g>
    `
  },

  // 18. Graduation Cap
  {
    id: "clay-graduation-cap",
    name: "3D Clay Graduation Cap",
    tags: "graduation cap mortarboard diploma degree education",
    svg: `
      <g filter="url(#clayShadow)" transform="translate(256, 230)">
        <!-- Skull Cap Base -->
        <ellipse cx="0" cy="30" rx="70" ry="34" fill="#4834d4" />
        <!-- Diamond Board -->
        <polygon points="0,-70 170,-20 0,30 -170,-20" fill="url(#clayIndigo)" stroke="#4834d4" stroke-width="5" />
        <!-- Center Button -->
        <circle cx="0" cy="-20" r="14" fill="url(#clayGold)" />
        <!-- Hanging Tassel -->
        <path d="M 0 -20 Q 80 -10 110 50" fill="none" stroke="url(#clayGold)" stroke-width="8" stroke-linecap="round" />
        <!-- Tassel Fringe -->
        <rect x="100" y="48" width="20" height="34" rx="6" fill="url(#clayGold)" />
        <!-- Rolled Diploma at Bottom -->
        <g transform="translate(-80, 100) rotate(-10)">
          <rect x="0" y="0" width="160" height="36" rx="10" fill="url(#clayWhite)" stroke="#cbd5e1" stroke-width="3" />
          <!-- Red Ribbon Bow -->
          <rect x="70" y="-4" width="20" height="44" rx="4" fill="url(#clayRed)" />
        </g>
        <!-- Highlight -->
        <line x1="-120" y1="-26" x2="-20" y2="12" stroke="#ffffff" stroke-width="6" opacity="0.5" stroke-linecap="round" />
      </g>
    `
  },

  // 19. Open Book
  {
    id: "clay-open-book",
    name: "3D Clay Open Textbook",
    tags: "open book reading textbook study literature pages",
    svg: `
      <g filter="url(#clayShadow)" transform="translate(256, 260)">
        <!-- Hardcover Base -->
        <path d="M -180 50 Q -90 65 0 50 Q 90 65 180 50 L 190 64 Q 90 80 0 65 Q -90 80 -190 64 Z" fill="url(#clayBlue)" />
        <!-- Left Clay Pages Block -->
        <path d="M 0 45 Q -90 60 -176 42 L -176 -40 Q -90 -22 0 -35 Z" fill="url(#clayWhite)" stroke="#e2e8f0" stroke-width="3" />
        <!-- Right Clay Pages Block -->
        <path d="M 0 45 Q 90 60 176 42 L 176 -40 Q 90 -22 0 -35 Z" fill="url(#clayWhite)" stroke="#e2e8f0" stroke-width="3" />
        <!-- Ribbon Bookmark -->
        <path d="M 0 -35 Q 10 30 20 80 L 10 75 L 0 80 Z" fill="url(#clayRed)" />
        <!-- Doodle Text Lines on Left Page -->
        <line x1="-140" y1="-10" x2="-30" y2="-10" stroke="#94a3b8" stroke-width="4" stroke-linecap="round" />
        <line x1="-140" y1="8" x2="-40" y2="8" stroke="#94a3b8" stroke-width="4" stroke-linecap="round" />
        <line x1="-140" y1="26" x2="-60" y2="26" stroke="#94a3b8" stroke-width="4" stroke-linecap="round" />
        <!-- Math Graph on Right Page -->
        <line x1="40" y1="26" x2="140" y2="26" stroke="#64748b" stroke-width="3" stroke-linecap="round" />
        <line x1="40" y1="-15" x2="40" y2="26" stroke="#64748b" stroke-width="3" stroke-linecap="round" />
        <path d="M 40 20 Q 80 15 130 -10" fill="none" stroke="url(#clayPink)" stroke-width="4" stroke-linecap="round" />
      </g>
    `
  },

  // 20. Stack of Books
  {
    id: "clay-book-stack",
    name: "3D Clay Book Stack",
    tags: "books stack library reading education learning",
    svg: `
      <g filter="url(#clayShadow)" transform="translate(256, 260)">
        <!-- Bottom Book (Blue) -->
        <g transform="translate(0, 80)">
          <rect x="-140" y="-22" width="280" height="44" rx="10" fill="url(#clayBlue)" stroke="#0984e3" stroke-width="3" />
          <rect x="-124" y="-14" width="256" height="28" rx="6" fill="#f8fafc" />
          <rect x="-140" y="-22" width="28" height="44" rx="6" fill="url(#clayBlue)" />
        </g>
        <!-- Second Book (Orange, slightly angled) -->
        <g transform="translate(10, 26) rotate(4)">
          <rect x="-130" y="-22" width="260" height="44" rx="10" fill="url(#clayCoral)" stroke="#d63031" stroke-width="3" />
          <rect x="-114" y="-14" width="236" height="28" rx="6" fill="#f8fafc" />
          <rect x="-130" y="-22" width="26" height="44" rx="6" fill="url(#clayCoral)" />
        </g>
        <!-- Third Book (Green, tilted other way) -->
        <g transform="translate(-8, -28) rotate(-5)">
          <rect x="-120" y="-22" width="240" height="44" rx="10" fill="url(#clayGreen)" stroke="#00b894" stroke-width="3" />
          <rect x="-104" y="-14" width="216" height="28" rx="6" fill="#f8fafc" />
          <rect x="-120" y="-22" width="24" height="44" rx="6" fill="url(#clayGreen)" />
        </g>
        <!-- Top Book (Purple, small) -->
        <g transform="translate(4, -82) rotate(2)">
          <rect x="-105" y="-20" width="210" height="40" rx="10" fill="url(#clayPurple)" stroke="#6c5ce7" stroke-width="3" />
          <rect x="-92" y="-13" width="190" height="26" rx="6" fill="#f8fafc" />
          <rect x="-105" y="-20" width="22" height="40" rx="6" fill="url(#clayPurple)" />
          <!-- Apple on Top of Books -->
          <circle cx="0" cy="-40" r="22" fill="url(#clayRed)" />
          <path d="M 0 -62 Q 8 -52 0 -42" fill="none" stroke="#2d3436" stroke-width="4" stroke-linecap="round" />
          <ellipse cx="8" cy="-56" rx="8" ry="4" fill="url(#clayGreen)" transform="rotate(-30 8 -56)" />
        </g>
      </g>
    `
  },

  // 21. Backpack
  {
    id: "clay-school-backpack",
    name: "3D Clay School Backpack",
    tags: "backpack bag school student education stationary",
    svg: `
      <g filter="url(#clayShadow)" transform="translate(256, 260)">
        <!-- Top Carry Handle -->
        <path d="M -40 -110 C -40 -150 40 -150 40 -110" fill="none" stroke="url(#clayTeal)" stroke-width="16" stroke-linecap="round" />
        <!-- Main Bag Body -->
        <rect x="-110" y="-110" width="220" height="250" rx="46" fill="url(#clayTeal)" stroke="#00cec9" stroke-width="6" />
        <!-- Front Pocket -->
        <rect x="-80" y="20" width="160" height="95" rx="26" fill="url(#clayYellow)" stroke="#fdcb6e" stroke-width="4" />
        <!-- Front Pocket Zipper -->
        <line x1="-60" y1="40" x2="60" y2="40" stroke="#2d3436" stroke-width="4" stroke-dasharray="6,4" stroke-linecap="round" />
        <circle cx="0" cy="40" r="6" fill="url(#claySilver)" />
        <!-- Ruler peeking out -->
        <rect x="40" y="-150" width="24" height="90" rx="4" fill="url(#clayCoral)" transform="rotate(15 52 -105)" />
        <!-- Pencil peeking out -->
        <rect x="-60" y="-140" width="16" height="80" rx="4" fill="url(#clayPurple)" transform="rotate(-12 -52 -100)" />
        <!-- Gloss highlight -->
        <ellipse cx="-55" cy="-60" rx="25" ry="12" fill="#ffffff" opacity="0.45" transform="rotate(-40 -55 -60)" />
      </g>
    `
  },

  // 22. Alarm Clock
  {
    id: "clay-alarm-clock",
    name: "3D Clay Study Clock",
    tags: "clock timer time alarm study countdown math hours",
    svg: `
      <g filter="url(#clayShadow)" transform="translate(256, 250)">
        <!-- Twin Bells -->
        <circle cx="-90" cy="-100" r="44" fill="url(#clayGold)" stroke="#d49e08" stroke-width="4" />
        <circle cx="90" cy="-100" r="44" fill="url(#clayGold)" stroke="#d49e08" stroke-width="4" />
        <!-- Bell Hammer -->
        <line x1="0" y1="-120" x2="0" y2="-90" stroke="url(#claySilver)" stroke-width="8" stroke-linecap="round" />
        <circle cx="0" cy="-125" r="10" fill="url(#claySilver)" />
        <!-- Feet Pegs -->
        <line x1="-70" y1="110" x2="-95" y2="145" stroke="url(#claySilver)" stroke-width="12" stroke-linecap="round" />
        <line x1="70" y1="110" x2="95" y2="145" stroke="url(#claySilver)" stroke-width="12" stroke-linecap="round" />
        <!-- Main Clock Body -->
        <circle cx="0" cy="0" r="120" fill="url(#clayCoral)" stroke="#ee5253" stroke-width="8" />
        <!-- Clock Face Dial -->
        <circle cx="0" cy="0" r="95" fill="#ffffff" />
        <!-- Hour Markers (12, 3, 6, 9) -->
        <circle cx="0" cy="-75" r="5" fill="#2d3436" />
        <circle cx="75" cy="0" r="5" fill="#2d3436" />
        <circle cx="0" cy="75" r="5" fill="#2d3436" />
        <circle cx="-75" cy="0" r="5" fill="#2d3436" />
        <!-- Hands (pointing to 9:00) -->
        <line x1="0" y1="0" x2="0" y2="-60" stroke="#2d3436" stroke-width="6" stroke-linecap="round" />
        <line x1="0" y1="0" x2="-45" y2="0" stroke="url(#clayRed)" stroke-width="7" stroke-linecap="round" />
        <circle cx="0" cy="0" r="9" fill="url(#clayGold)" />
        <!-- Glass shine -->
        <path d="M -50 -50 A 70 70 0 0 1 50 -50" fill="none" stroke="#ffffff" stroke-width="8" opacity="0.6" stroke-linecap="round" />
      </g>
    `
  },

  // 23. Balance Scale
  {
    id: "clay-balance-scale",
    name: "3D Clay Balance Scale",
    tags: "balance scale weights equality equations math measurement",
    svg: `
      <g filter="url(#clayShadow)" transform="translate(256, 250)">
        <!-- Vertical Stand Pillar -->
        <rect x="-12" y="-120" width="24" height="240" rx="8" fill="url(#clayGold)" />
        <!-- Base -->
        <ellipse cx="0" cy="120" rx="90" ry="24" fill="url(#clayGold)" stroke="#d49e08" stroke-width="4" />
        <!-- Central Top Pivot Sphere -->
        <circle cx="0" cy="-120" r="18" fill="url(#clayGold)" />
        <!-- Tilting Horizontal Beam -->
        <rect x="-160" y="-128" width="320" height="16" rx="8" fill="url(#clayGold)" transform="rotate(-6 0 -120)" />
        <!-- Left Hanging Pan -->
        <g transform="translate(-140, -110)">
          <line x1="0" y1="0" x2="-45" y2="80" stroke="#636e72" stroke-width="3" />
          <line x1="0" y1="0" x2="45" y2="80" stroke="#636e72" stroke-width="3" />
          <ellipse cx="0" cy="80" rx="50" ry="16" fill="url(#clayTeal)" />
          <!-- Weight on Left -->
          <rect x="-18" y="44" width="36" height="34" rx="6" fill="url(#clayCoral)" />
          <text x="0" y="66" font-size="12" font-weight="bold" font-family="sans-serif" fill="#ffffff" text-anchor="middle">5kg</text>
        </g>
        <!-- Right Hanging Pan -->
        <g transform="translate(140, -135)">
          <line x1="0" y1="0" x2="-45" y2="80" stroke="#636e72" stroke-width="3" />
          <line x1="0" y1="0" x2="45" y2="80" stroke="#636e72" stroke-width="3" />
          <ellipse cx="0" cy="80" rx="50" ry="16" fill="url(#clayTeal)" />
          <!-- Weight on Right -->
          <rect x="-18" y="44" width="36" height="34" rx="6" fill="url(#clayPurple)" />
          <text x="0" y="66" font-size="12" font-weight="bold" font-family="sans-serif" fill="#ffffff" text-anchor="middle">5kg</text>
        </g>
      </g>
    `
  },

  // 24. Number Line
  {
    id: "clay-number-line",
    name: "3D Clay Number Line",
    tags: "number line frog hop arithmetic addition counting",
    svg: `
      <g filter="url(#clayShadow)" transform="translate(256, 260)">
        <!-- Horizontal Axis Line -->
        <rect x="-200" y="20" width="400" height="16" rx="8" fill="url(#clayBlue)" />
        <!-- Arrows on ends -->
        <polygon points="-214,28 -194,14 -194,42" fill="url(#clayBlue)" />
        <polygon points="214,28 194,14 194,42" fill="url(#clayBlue)" />
        <!-- Number Ticks & Labels -->
        ${[-4, -3, -2, -1, 0, 1, 2, 3, 4].map((num, i) => {
          const x = -160 + i * 40;
          return `
            <line x1="${x}" y1="12" x2="${x}" y2="44" stroke="#ffffff" stroke-width="4" stroke-linecap="round" />
            <text x="${x}" y="74" font-size="18" font-weight="bold" font-family="sans-serif" fill="#2d3436" text-anchor="middle">${num}</text>
          `;
        }).join("")}
        <!-- Cute Hopping Clay Frog -->
        <g transform="translate(0, -40)">
          <!-- Curved Hop Arcs -->
          <path d="M -80 50 Q -40 -10 0 50" fill="none" stroke="url(#clayCoral)" stroke-width="4" stroke-dasharray="6,4" />
          <path d="M 0 50 Q 40 -10 80 50" fill="none" stroke="url(#clayCoral)" stroke-width="4" stroke-dasharray="6,4" />
          <!-- Frog Body -->
          <ellipse cx="0" cy="0" rx="30" ry="22" fill="url(#clayGreen)" />
          <!-- Eyes -->
          <circle cx="-12" cy="-16" r="10" fill="url(#clayGreen)" />
          <circle cx="12" cy="-16" r="10" fill="url(#clayGreen)" />
          <circle cx="-12" cy="-16" r="4" fill="#2d3436" />
          <circle cx="12" cy="-16" r="4" fill="#2d3436" />
          <!-- Smile -->
          <path d="M -10 6 Q 0 14 10 6" fill="none" stroke="#2d3436" stroke-width="2.5" stroke-linecap="round" />
        </g>
      </g>
    `
  },

  // 25. Bar Chart
  {
    id: "clay-bar-chart",
    name: "3D Clay Bar Chart",
    tags: "bar chart data statistics graph growth analytics",
    svg: `
      <g filter="url(#clayShadow)" transform="translate(256, 250)">
        <!-- Axis Base Lines -->
        <line x1="-160" y1="120" x2="160" y2="120" stroke="#64748b" stroke-width="8" stroke-linecap="round" />
        <line x1="-160" y1="120" x2="-160" y2="-120" stroke="#64748b" stroke-width="8" stroke-linecap="round" />
        <!-- Bars -->
        <rect x="-130" y="30" width="50" height="90" rx="14" fill="url(#clayRed)" />
        <rect x="-60" y="-20" width="50" height="140" rx="14" fill="url(#clayYellow)" />
        <rect x="10" y="-70" width="50" height="190" rx="14" fill="url(#clayTeal)" />
        <rect x="80" y="-115" width="50" height="235" rx="14" fill="url(#clayGreen)" />
        <!-- Upward Growth Arrow -->
        <path d="M -110 10 Q 0 -60 110 -140" fill="none" stroke="#2ed573" stroke-width="8" stroke-linecap="round" />
        <polygon points="124,-148 100,-152 110,-128" fill="#2ed573" />
        <!-- Shimmers -->
        <rect x="-124" y="36" width="10" height="74" rx="5" fill="#ffffff" opacity="0.45" />
        <rect x="-54" y="-14" width="10" height="124" rx="5" fill="#ffffff" opacity="0.45" />
        <rect x="16" y="-64" width="10" height="174" rx="5" fill="#ffffff" opacity="0.45" />
        <rect x="86" y="-108" width="10" height="218" rx="5" fill="#ffffff" opacity="0.45" />
      </g>
    `
  },

  // 26. 3D Pie Chart
  {
    id: "clay-pie-chart-3d",
    name: "3D Clay Pie Chart",
    tags: "pie chart donut percentage data statistics fractions",
    svg: `
      <g filter="url(#clayShadow)" transform="translate(256, 250)">
        <!-- Cyan Slice (50%) -->
        <path d="M 0 0 L 130 0 A 130 90 0 1 1 -130 0 Z" fill="url(#clayTeal)" stroke="#00cec9" stroke-width="4" />
        <!-- Coral Slice (30%) -->
        <path d="M 0 0 L -130 0 A 130 90 0 0 1 40 -85 Z" fill="url(#clayCoral)" stroke="#ee5253" stroke-width="4" />
        <!-- Yellow Slice (20%, elevated) -->
        <g transform="translate(10, -14)">
          <path d="M 0 0 L 40 -85 A 130 90 0 0 1 130 0 Z" fill="url(#clayYellow)" stroke="#fdcb6e" stroke-width="4" filter="url(#clayShadow)" />
          <text x="65" y="-35" font-size="18" font-weight="bold" font-family="sans-serif" fill="#2d3436">20%</text>
        </g>
        <!-- Center Donut Hole -->
        <ellipse cx="0" cy="0" rx="46" ry="32" fill="#ffffff" />
        <text x="0" y="6" font-size="14" font-weight="bold" font-family="sans-serif" fill="#64748b" text-anchor="middle">DATA</text>
      </g>
    `
  },

  // 27. Venn Diagram
  {
    id: "clay-venn-diagram",
    name: "3D Clay Venn Diagram",
    tags: "venn diagram sets intersection logic math probability",
    svg: `
      <g filter="url(#clayShadow)" transform="translate(256, 250)">
        <!-- Circle A (Blue, semi-transparent) -->
        <circle cx="-60" cy="0" r="110" fill="#74b9ff" fill-opacity="0.8" stroke="#0984e3" stroke-width="6" />
        <!-- Circle B (Coral, semi-transparent) -->
        <circle cx="60" cy="0" r="110" fill="#ff7675" fill-opacity="0.8" stroke="#d63031" stroke-width="6" />
        <!-- Intersection Shading -->
        <path d="M 0 -91 A 110 110 0 0 1 0 91 A 110 110 0 0 1 0 -91" fill="#6c5ce7" fill-opacity="0.8" />
        <!-- Set Labels -->
        <text x="-95" y="10" font-size="28" font-weight="bold" font-family="sans-serif" fill="#ffffff" text-anchor="middle">A</text>
        <text x="95" y="10" font-size="28" font-weight="bold" font-family="sans-serif" fill="#ffffff" text-anchor="middle">B</text>
        <text x="0" y="8" font-size="18" font-weight="bold" font-family="sans-serif" fill="#ffffff" text-anchor="middle">A ∩ B</text>
        <!-- Gloss -->
        <ellipse cx="-100" cy="-45" rx="35" ry="16" fill="#ffffff" opacity="0.4" transform="rotate(-30 -100 -45)" />
        <ellipse cx="100" cy="-45" rx="35" ry="16" fill="#ffffff" opacity="0.4" transform="rotate(30 100 -45)" />
      </g>
    `
  },

  // 28. Lightbulb Idea
  {
    id: "clay-lightbulb-idea",
    name: "3D Clay Idea Lightbulb",
    tags: "lightbulb idea eureka innovation creative math solution",
    svg: `
      <g filter="url(#clayShadow)" transform="translate(256, 240)">
        <!-- Bulb Glass Body -->
        <path d="M 0 -130 C 70 -130 110 -80 80 0 C 65 35 45 60 45 90 L -45 90 C -45 60 -65 35 -80 0 C -110 -80 -70 -130 0 -130 Z" fill="url(#clayYellow)" stroke="#fdcb6e" stroke-width="6" />
        <!-- Screw Base -->
        <rect x="-35" y="90" width="70" height="18" rx="8" fill="url(#claySilver)" />
        <rect x="-30" y="112" width="60" height="16" rx="8" fill="url(#claySilver)" />
        <!-- Contact Point -->
        <path d="M -16 128 L 16 128 C 16 142 -16 142 -16 128 Z" fill="#2d3436" />
        <!-- Cute Filament Doodle -->
        <path d="M -22 0 Q 0 -40 0 10 Q 0 -40 22 0" fill="none" stroke="#e17055" stroke-width="7" stroke-linecap="round" stroke-linejoin="round" />
        <!-- Big Specular Gloss -->
        <ellipse cx="-40" cy="-60" rx="32" ry="16" fill="#ffffff" opacity="0.6" transform="rotate(-40 -40 -60)" />
        <!-- Sparkle Rays around Bulb -->
        <line x1="0" y1="-165" x2="0" y2="-145" stroke="#fbc531" stroke-width="8" stroke-linecap="round" />
        <line x1="-120" y1="-100" x2="-100" y2="-90" stroke="#fbc531" stroke-width="8" stroke-linecap="round" />
        <line x1="120" y1="-100" x2="100" y2="-90" stroke="#fbc531" stroke-width="8" stroke-linecap="round" />
        <line x1="-135" y1="-20" x2="-115" y2="-20" stroke="#fbc531" stroke-width="8" stroke-linecap="round" />
        <line x1="135" y1="-20" x2="115" y2="-20" stroke="#fbc531" stroke-width="8" stroke-linecap="round" />
      </g>
    `
  },

  // 29. Magnifying Glass
  {
    id: "clay-magnifying-glass",
    name: "3D Clay Magnifier",
    tags: "magnifying glass inspection search research inquiry math",
    svg: `
      <g filter="url(#clayShadow)" transform="translate(256, 250)">
        <!-- Handle (diagonally down right) -->
        <rect x="50" y="50" width="34" height="150" rx="17" fill="url(#clayCoral)" stroke="#d63031" stroke-width="4" transform="rotate(-45 67 125)" />
        <!-- Lens Rim -->
        <circle cx="-30" cy="-30" r="120" fill="none" stroke="url(#clayTeal)" stroke-width="26" />
        <!-- Glass Lens -->
        <circle cx="-30" cy="-30" r="106" fill="url(#clayGlass)" />
        <!-- Magnified Math Formula inside -->
        <text x="-30" y="-18" font-size="34" font-weight="900" font-family="'Comic Sans MS', sans-serif" fill="#2d3436" text-anchor="middle">x + y</text>
        <!-- Crescent Reflection -->
        <path d="M -105 -95 A 90 90 0 0 1 45 -95" fill="none" stroke="#ffffff" stroke-width="12" opacity="0.6" stroke-linecap="round" />
      </g>
    `
  },

  // 30. Math Dice
  {
    id: "clay-math-dice",
    name: "3D Clay Math Dice",
    tags: "dice probability probability cubes numbers random math games",
    svg: `
      <g filter="url(#clayShadow)" transform="translate(256, 250)">
        <!-- Dice 1: Red (Left) -->
        <g transform="translate(-65, 20) rotate(-12)">
          <rect x="-60" y="-60" width="120" height="120" rx="28" fill="url(#clayRed)" stroke="#d63031" stroke-width="4" />
          <!-- Pips (showing 5) -->
          <circle cx="-30" cy="-30" r="10" fill="#ffffff" />
          <circle cx="30" cy="-30" r="10" fill="#ffffff" />
          <circle cx="0" cy="0" r="10" fill="#ffffff" />
          <circle cx="-30" cy="30" r="10" fill="#ffffff" />
          <circle cx="30" cy="30" r="10" fill="#ffffff" />
          <!-- Gloss -->
          <ellipse cx="-25" cy="-45" rx="20" ry="8" fill="#ffffff" opacity="0.4" />
        </g>
        <!-- Dice 2: Blue (Right, elevated) -->
        <g transform="translate(65, -30) rotate(16)">
          <rect x="-55" y="-55" width="110" height="110" rx="26" fill="url(#clayBlue)" stroke="#0984e3" stroke-width="4" />
          <!-- Pips (showing 3) -->
          <circle cx="-25" cy="-25" r="9" fill="#ffffff" />
          <circle cx="0" cy="0" r="9" fill="#ffffff" />
          <circle cx="25" cy="25" r="9" fill="#ffffff" />
          <!-- Gloss -->
          <ellipse cx="-20" cy="-40" rx="18" ry="7" fill="#ffffff" opacity="0.4" />
        </g>
      </g>
    `
  },

  // 31. Domino Tiles
  {
    id: "clay-domino-tiles",
    name: "3D Clay Domino Tiles",
    tags: "domino tiles addition dots patterns numbers games math",
    svg: `
      <g filter="url(#clayShadow)" transform="translate(256, 250)">
        <!-- Domino Tile 1 (Left) -->
        <g transform="translate(-60, 0) rotate(-8)">
          <rect x="-50" y="-95" width="100" height="190" rx="20" fill="url(#clayWhite)" stroke="#cbd5e1" stroke-width="4" />
          <!-- Middle divider line -->
          <line x1="-40" y1="0" x2="40" y2="0" stroke="#64748b" stroke-width="4" stroke-linecap="round" />
          <!-- Top dots (4) -->
          <circle cx="-22" cy="-65" r="8" fill="#2d3436" />
          <circle cx="22" cy="-65" r="8" fill="#2d3436" />
          <circle cx="-22" cy="-25" r="8" fill="#2d3436" />
          <circle cx="22" cy="-25" r="8" fill="#2d3436" />
          <!-- Bottom dots (2) -->
          <circle cx="-20" cy="35" r="8" fill="#2d3436" />
          <circle cx="20" cy="65" r="8" fill="#2d3436" />
        </g>
        <!-- Domino Tile 2 (Right, leaning) -->
        <g transform="translate(60, 20) rotate(14)">
          <rect x="-46" y="-88" width="92" height="176" rx="18" fill="url(#clayWhite)" stroke="#cbd5e1" stroke-width="4" />
          <line x1="-36" y1="0" x2="36" y2="0" stroke="#64748b" stroke-width="4" stroke-linecap="round" />
          <!-- Top dots (3) -->
          <circle cx="-20" cy="-55" r="8" fill="#2d3436" />
          <circle cx="0" cy="-35" r="8" fill="#2d3436" />
          <circle cx="20" cy="-15" r="8" fill="#2d3436" />
          <!-- Bottom dots (5) -->
          <circle cx="-20" cy="25" r="7" fill="#2d3436" />
          <circle cx="20" cy="25" r="7" fill="#2d3436" />
          <circle cx="0" cy="45" r="7" fill="#2d3436" />
          <circle cx="-20" cy="65" r="7" fill="#2d3436" />
          <circle cx="20" cy="65" r="7" fill="#2d3436" />
        </g>
      </g>
    `
  },

  // 32. Tangram Puzzle
  {
    id: "clay-tangram-cat",
    name: "3D Clay Tangram Puzzle",
    tags: "tangram puzzle geometry shapes spatial reasoning polygons",
    svg: `
      <g filter="url(#clayShadow)" transform="translate(256, 250)">
        <!-- Tangram Cat Pieces in Colorful Clay -->
        <!-- Head Square -->
        <rect x="-35" y="-120" width="70" height="70" rx="12" fill="url(#clayYellow)" transform="rotate(45 0 -85)" />
        <!-- Left Ear Triangle -->
        <polygon points="-50,-130 -80,-90 -40,-90" fill="url(#clayCoral)" />
        <!-- Right Ear Triangle -->
        <polygon points="50,-130 80,-90 40,-90" fill="url(#clayCoral)" />
        <!-- Body Large Triangle 1 -->
        <polygon points="0,-35 -110,75 110,75" fill="url(#clayBlue)" />
        <!-- Body Large Triangle 2 -->
        <polygon points="0,-35 0,145 110,75" fill="url(#clayIndigo)" />
        <!-- Leg Medium Triangle -->
        <polygon points="-110,75 -110,145 -40,145" fill="url(#clayGreen)" />
        <!-- Tail Parallelogram -->
        <polygon points="110,75 160,25 180,60 130,110" fill="url(#clayPink)" />
      </g>
    `
  },

  // 33. Science Beaker
  {
    id: "clay-science-beaker",
    name: "3D Clay Chemistry Flask",
    tags: "beaker flask science chemistry experiment math stem volume",
    svg: `
      <g filter="url(#clayShadow)" transform="translate(256, 250)">
        <!-- Flask Neck and Body -->
        <path d="M -30 -120 L 30 -120 L 30 -50 L 120 100 A 30 30 0 0 1 95 140 L -95 140 A 30 30 0 0 1 -120 100 L -30 -50 Z" fill="url(#clayWhite)" stroke="#cbd5e1" stroke-width="5" />
        <!-- Liquid Level (Turquoise) -->
        <path d="M -85 50 Q 0 40 85 50 L 95 135 L -95 135 Z" fill="url(#clayTeal)" />
        <!-- Measurement Marks -->
        <line x1="-30" y1="80" x2="-10" y2="80" stroke="#ffffff" stroke-width="4" stroke-linecap="round" />
        <line x1="-35" y1="105" x2="-10" y2="105" stroke="#ffffff" stroke-width="4" stroke-linecap="round" />
        <!-- Bubbles -->
        <circle cx="10" cy="90" r="10" fill="#ffffff" opacity="0.6" />
        <circle cx="-25" cy="70" r="7" fill="#ffffff" opacity="0.6" />
        <circle cx="45" cy="110" r="8" fill="#ffffff" opacity="0.6" />
        <!-- Glass reflections -->
        <path d="M -80 70 L -25 -40" stroke="#ffffff" stroke-width="8" opacity="0.5" stroke-linecap="round" />
      </g>
    `
  },

  // 34. Clay Globe
  {
    id: "clay-globe",
    name: "3D Clay Earth Globe",
    tags: "globe world earth geography coordinates latitude sphere",
    svg: `
      <g filter="url(#clayShadow)" transform="translate(256, 250)">
        <!-- Meridian Arc Arm -->
        <path d="M -10 -150 C -160 -150 -160 120 0 150" fill="none" stroke="url(#clayGold)" stroke-width="16" stroke-linecap="round" />
        <!-- Stand Base -->
        <rect x="-14" y="140" width="28" height="40" rx="8" fill="url(#clayGold)" />
        <ellipse cx="0" cy="180" rx="80" ry="22" fill="url(#clayGold)" />
        <!-- Globe Sphere (Ocean Blue) -->
        <circle cx="0" cy="0" r="110" fill="url(#clayBlue)" stroke="#0984e3" stroke-width="4" />
        <!-- Green Continents -->
        <path d="M -70 -40 Q -40 -80 0 -50 Q 20 -10 -20 20 Q -60 10 -70 -40 Z" fill="url(#clayGreen)" />
        <path d="M 20 -20 Q 60 -60 80 -10 Q 70 50 30 40 Q 10 10 20 -20 Z" fill="url(#clayGreen)" />
        <path d="M -30 40 Q 0 30 20 60 Q -10 90 -40 70 Z" fill="url(#clayGreen)" />
        <!-- Latitude / Longitude lines -->
        <ellipse cx="0" cy="0" rx="110" ry="40" fill="none" stroke="#ffffff" stroke-width="3" opacity="0.4" />
        <line x1="0" y1="-110" x2="0" y2="110" stroke="#ffffff" stroke-width="3" opacity="0.4" />
        <!-- Gloss -->
        <ellipse cx="-45" cy="-50" rx="35" ry="18" fill="#ffffff" opacity="0.45" transform="rotate(-30 -45 -50)" />
      </g>
    `
  },

  // 35. Pencil & Sharpener
  {
    id: "clay-pencil-sharpener",
    name: "3D Clay Pencil & Sharpener",
    tags: "pencil sharpener writing drawing stationery tools",
    svg: `
      <g filter="url(#clayShadow)" transform="translate(256, 250)">
        <!-- Pencil (Angled) -->
        <g transform="translate(-40, -20) rotate(-35)">
          <rect x="-20" y="-120" width="40" height="200" rx="10" fill="url(#clayYellow)" stroke="#e17055" stroke-width="3" />
          <!-- Eraser -->
          <rect x="-20" y="-150" width="40" height="30" rx="8" fill="url(#clayPink)" />
          <rect x="-22" y="-125" width="44" height="14" rx="4" fill="url(#claySilver)" />
          <!-- Sharpened Cone Tip -->
          <polygon points="-20,80 20,80 0,130" fill="#ffeaa7" />
          <polygon points="-7,112 7,112 0,130" fill="#2d3436" />
        </g>
        <!-- Sharpener Block (Teal) -->
        <g transform="translate(70, 60)">
          <rect x="-45" y="-35" width="90" height="70" rx="16" fill="url(#clayTeal)" stroke="#00cec9" stroke-width="4" />
          <!-- Blade -->
          <rect x="-30" y="-20" width="60" height="16" rx="4" fill="url(#claySilver)" />
          <circle cx="0" cy="-12" r="4" fill="#2d3436" />
          <!-- Shaving Hole -->
          <circle cx="-20" cy="14" r="10" fill="#00a896" />
        </g>
      </g>
    `
  },

  // 36. Clipboard A+
  {
    id: "clay-clipboard-a-plus",
    name: "3D Clay Grade A+ Clipboard",
    tags: "clipboard test grade assessment excellence marks exam",
    svg: `
      <g filter="url(#clayShadow)" transform="translate(256, 250)">
        <!-- Clipboard Wooden Board -->
        <rect x="-120" y="-150" width="240" height="300" rx="26" fill="url(#clayWood)" stroke="#8c5828" stroke-width="5" />
        <!-- White Exam Sheet -->
        <rect x="-95" y="-115" width="190" height="245" rx="14" fill="#ffffff" />
        <!-- Metal Clamp on Top -->
        <rect x="-50" y="-165" width="100" height="34" rx="10" fill="url(#claySilver)" />
        <circle cx="0" cy="-148" r="8" fill="#636e72" />
        <!-- Blue Ruled Question Lines -->
        <line x1="-70" y1="-70" x2="30" y2="-70" stroke="#cbd5e1" stroke-width="4" stroke-linecap="round" />
        <line x1="-70" y1="-40" x2="50" y2="-40" stroke="#cbd5e1" stroke-width="4" stroke-linecap="round" />
        <line x1="-70" y1="-10" x2="60" y2="-10" stroke="#cbd5e1" stroke-width="4" stroke-linecap="round" />
        <line x1="-70" y1="20" x2="40" y2="20" stroke="#cbd5e1" stroke-width="4" stroke-linecap="round" />
        <!-- Big Red Circled A+ Stamp -->
        <circle cx="40" cy="65" r="38" fill="none" stroke="url(#clayRed)" stroke-width="6" stroke-dasharray="8,4" />
        <text x="32" y="77" font-size="38" font-weight="900" font-family="'Comic Sans MS', sans-serif" fill="url(#clayRed)" text-anchor="middle">A+</text>
      </g>
    `
  },

  // 37. Hourglass Timer
  {
    id: "clay-hourglass-timer",
    name: "3D Clay Hourglass",
    tags: "hourglass time timer sand minutes exam duration",
    svg: `
      <g filter="url(#clayShadow)" transform="translate(256, 250)">
        <!-- Top and Bottom Wooden Plates -->
        <rect x="-90" y="-140" width="180" height="24" rx="10" fill="url(#clayWood)" />
        <rect x="-90" y="116" width="180" height="24" rx="10" fill="url(#clayWood)" />
        <!-- Side Support Pillars -->
        <rect x="-80" y="-116" width="14" height="232" rx="7" fill="url(#clayWood)" />
        <rect x="66" y="-116" width="14" height="232" rx="7" fill="url(#clayWood)" />
        <!-- Glass Bulb (Curved Inward at Center) -->
        <path d="M -60 -116 L 60 -116 C 60 -30 15 -10 15 0 C 15 10 60 30 60 116 L -60 116 C -60 30 -15 10 -15 0 C -15 -10 -60 -30 -60 -116 Z" fill="url(#clayGlass)" stroke="#cbd5e1" stroke-width="4" />
        <!-- Sand in Top Bulb -->
        <path d="M -45 -110 L 45 -110 C 45 -60 10 -15 0 0 C -10 -15 -45 -60 -45 -110 Z" fill="url(#clayPink)" />
        <!-- Sand Falling Stream -->
        <line x1="0" y1="0" x2="0" y2="70" stroke="#fd79a8" stroke-width="4" stroke-linecap="round" />
        <!-- Sand Mound in Bottom Bulb -->
        <path d="M -50 110 Q 0 60 50 110 Z" fill="url(#clayPink)" />
      </g>
    `
  },

  // 38. Thermometer
  {
    id: "clay-thermometer",
    name: "3D Clay Math Thermometer",
    tags: "thermometer temperature integers negative positive measurement",
    svg: `
      <g filter="url(#clayShadow)" transform="translate(256, 250)">
        <!-- Glass Stem -->
        <rect x="-24" y="-150" width="48" height="230" rx="24" fill="url(#clayWhite)" stroke="#cbd5e1" stroke-width="4" />
        <!-- Bottom Bulb -->
        <circle cx="0" cy="90" r="46" fill="url(#clayRed)" stroke="#d63031" stroke-width="4" />
        <!-- Red Mercury Column -->
        <rect x="-10" y="-50" width="20" height="120" rx="10" fill="url(#clayRed)" />
        <!-- Tick marks & Numbers (+20, +10, 0, -10) -->
        <line x1="26" y1="-100" x2="44" y2="-100" stroke="#2d3436" stroke-width="4" stroke-linecap="round" />
        <text x="52" y="-94" font-size="16" font-weight="bold" font-family="sans-serif" fill="#2d3436">+20°</text>
        <line x1="26" y1="-50" x2="44" y2="-50" stroke="#2d3436" stroke-width="4" stroke-linecap="round" />
        <text x="52" y="-44" font-size="16" font-weight="bold" font-family="sans-serif" fill="#2d3436">+10°</text>
        <line x1="26" y1="0" x2="52" y2="0" stroke="#0984e3" stroke-width="5" stroke-linecap="round" />
        <text x="60" y="6" font-size="18" font-weight="900" font-family="sans-serif" fill="#0984e3">0°</text>
        <line x1="26" y1="50" x2="44" y2="50" stroke="#2d3436" stroke-width="4" stroke-linecap="round" />
        <text x="52" y="56" font-size="16" font-weight="bold" font-family="sans-serif" fill="#2d3436">-10°</text>
        <!-- Bulb Highlight -->
        <circle cx="-16" cy="74" r="14" fill="#ffffff" opacity="0.6" />
      </g>
    `
  },

  // 39. Money & Coins
  {
    id: "clay-money-coins",
    name: "3D Clay Currency & Coins",
    tags: "money coins rupee currency cash financial math",
    svg: `
      <g filter="url(#clayShadow)" transform="translate(256, 250)">
        <!-- Green Cash Banknote -->
        <g transform="translate(-10, -30) rotate(-10)">
          <rect x="-130" y="-70" width="260" height="140" rx="20" fill="url(#clayGreen)" stroke="#00b894" stroke-width="4" />
          <rect x="-110" y="-55" width="220" height="110" rx="14" fill="none" stroke="#ffffff" stroke-width="3" stroke-dasharray="6,4" />
          <circle cx="0" cy="0" r="32" fill="#ffffff" opacity="0.3" />
          <text x="0" y="14" font-size="44" font-weight="900" font-family="sans-serif" fill="#ffffff" text-anchor="middle">₹</text>
        </g>
        <!-- Golden Coin Stack -->
        <g transform="translate(60, 50)">
          <ellipse cx="0" cy="30" rx="55" ry="24" fill="url(#clayGold)" stroke="#d49e08" stroke-width="3" />
          <ellipse cx="0" cy="10" rx="55" ry="24" fill="url(#clayGold)" stroke="#d49e08" stroke-width="3" />
          <ellipse cx="0" cy="-10" rx="55" ry="24" fill="url(#clayGold)" stroke="#d49e08" stroke-width="3" />
          <ellipse cx="0" cy="-30" rx="55" ry="24" fill="url(#clayGold)" stroke="#d49e08" stroke-width="3" />
          <text x="0" y="-22" font-size="28" font-weight="bold" font-family="sans-serif" fill="#ffffff" text-anchor="middle">₹</text>
        </g>
      </g>
    `
  },

  // 40. Brain with Gears
  {
    id: "clay-brain-gears",
    name: "3D Clay Mental Math Brain",
    tags: "brain gears mental math thinking logic cognitive reasoning",
    svg: `
      <g filter="url(#clayShadow)" transform="translate(256, 250)">
        <!-- Brain Lobe Silhouette (Puffy Clay Pink) -->
        <path d="M -20 -110 C -90 -110 -130 -60 -130 10 C -130 80 -80 120 -20 120 L -10 120 L -10 -110 Z" fill="url(#clayPink)" stroke="#e84393" stroke-width="6" />
        <path d="M 20 -110 C 90 -110 130 -60 130 10 C 130 80 80 120 20 120 L 10 120 L 10 -110 Z" fill="url(#clayPink)" stroke="#e84393" stroke-width="6" />
        <!-- Interlocking Colorful Clay Gears Inside -->
        <g transform="translate(-40, -10)">
          <circle cx="0" cy="0" r="36" fill="url(#clayTeal)" stroke="#00cec9" stroke-width="4" />
          <circle cx="0" cy="0" r="14" fill="#ffffff" />
        </g>
        <g transform="translate(45, 20)">
          <circle cx="0" cy="0" r="46" fill="url(#clayYellow)" stroke="#fdcb6e" stroke-width="4" />
          <circle cx="0" cy="0" r="18" fill="#ffffff" />
        </g>
        <g transform="translate(30, -50)">
          <circle cx="0" cy="0" r="26" fill="url(#clayCoral)" stroke="#ee5253" stroke-width="3" />
          <circle cx="0" cy="0" r="10" fill="#ffffff" />
        </g>
        <!-- Sparkles -->
        <polygon points="-70,-60 -64,-48 -52,-42 -64,-36 -70,-24 -76,-36 -88,-42 -76,-48" fill="#ffeaa7" />
      </g>
    `
  },

  // 41. Compass Rose
  {
    id: "clay-compass-rose",
    name: "3D Clay Compass Rose",
    tags: "compass rose directions north south angles bearings navigation",
    svg: `
      <g filter="url(#clayShadow)" transform="translate(256, 250)">
        <!-- Outer Ring -->
        <circle cx="0" cy="0" r="130" fill="url(#clayDark)" stroke="#636e72" stroke-width="6" />
        <circle cx="0" cy="0" r="114" fill="#ffffff" />
        <!-- Cardinal Points (N, S, E, W) -->
        <!-- North (Red/White) -->
        <polygon points="0,-120 18,0 0,-15" fill="url(#clayRed)" />
        <polygon points="0,-120 -18,0 0,-15" fill="#dfe6e9" />
        <!-- South -->
        <polygon points="0,120 -18,0 0,15" fill="url(#clayBlue)" />
        <polygon points="0,120 18,0 0,15" fill="#dfe6e9" />
        <!-- East -->
        <polygon points="120,0 0,18 15,0" fill="url(#clayBlue)" />
        <polygon points="120,0 0,-18 15,0" fill="#dfe6e9" />
        <!-- West -->
        <polygon points="-120,0 0,-18 -15,0" fill="url(#clayBlue)" />
        <polygon points="-120,0 0,18 -15,0" fill="#dfe6e9" />
        <!-- Center Gem -->
        <circle cx="0" cy="0" r="18" fill="url(#clayGold)" />
        <!-- Direction Letters -->
        <text x="0" y="-128" font-size="22" font-weight="900" font-family="sans-serif" fill="url(#clayRed)" text-anchor="middle">N</text>
        <text x="0" y="148" font-size="18" font-weight="bold" font-family="sans-serif" fill="#2d3436" text-anchor="middle">S</text>
        <text x="142" y="7" font-size="18" font-weight="bold" font-family="sans-serif" fill="#2d3436" text-anchor="middle">E</text>
        <text x="-142" y="7" font-size="18" font-weight="bold" font-family="sans-serif" fill="#2d3436" text-anchor="middle">W</text>
      </g>
    `
  },

  // 42. Math Matrix Grid
  {
    id: "clay-math-matrix",
    name: "3D Clay Math Matrix",
    tags: "matrix array grid linear algebra numbers math table",
    svg: `
      <g filter="url(#clayShadow)" transform="translate(256, 250)">
        <!-- Left Matrix Bracket -->
        <path d="M -110 -100 L -140 -100 L -140 100 L -110 100" fill="none" stroke="url(#clayIndigo)" stroke-width="14" stroke-linecap="round" stroke-linejoin="round" />
        <!-- Right Matrix Bracket -->
        <path d="M 110 -100 L 140 -100 L 140 100 L 110 100" fill="none" stroke="url(#clayIndigo)" stroke-width="14" stroke-linecap="round" stroke-linejoin="round" />
        <!-- 4 Clay Number Tiles [2, 4; 6, 8] -->
        <g transform="translate(-60, -50)">
          <rect x="-35" y="-35" width="70" height="70" rx="18" fill="url(#clayCoral)" />
          <text x="0" y="14" font-size="40" font-weight="bold" font-family="sans-serif" fill="#ffffff" text-anchor="middle">2</text>
        </g>
        <g transform="translate(60, -50)">
          <rect x="-35" y="-35" width="70" height="70" rx="18" fill="url(#clayTeal)" />
          <text x="0" y="14" font-size="40" font-weight="bold" font-family="sans-serif" fill="#ffffff" text-anchor="middle">4</text>
        </g>
        <g transform="translate(-60, 50)">
          <rect x="-35" y="-35" width="70" height="70" rx="18" fill="url(#clayYellow)" />
          <text x="0" y="14" font-size="40" font-weight="bold" font-family="sans-serif" fill="#2d3436" text-anchor="middle">6</text>
        </g>
        <g transform="translate(60, 50)">
          <rect x="-35" y="-35" width="70" height="70" rx="18" fill="url(#clayBlue)" />
          <text x="0" y="14" font-size="40" font-weight="bold" font-family="sans-serif" fill="#ffffff" text-anchor="middle">8</text>
        </g>
      </g>
    `
  }
];

// Write all SVGs into public/assets/picture-presets/
for (const item of CLAY_IMAGES) {
  const fullSvg = claySvg(item.svg);
  const outPath = path.join(targetDir, `${item.id}.svg`);
  fs.writeFileSync(outPath, fullSvg, "utf-8");
  console.log(`Generated: ${outPath}`);
}

console.log(`Successfully generated ${CLAY_IMAGES.length} doodle clay images!`);
