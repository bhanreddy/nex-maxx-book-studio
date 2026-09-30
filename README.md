# NEX MAXX Book Studio

An advanced, publication-grade educational curriculum book studio and smart authoring engine built with Next.js, React 19, TypeScript, and Tailwind CSS.

## Overview

NEX MAXX Book Studio delivers a full-fidelity editorial and curriculum authoring workspace for early childhood through primary school textbooks (Classes 1–5). It features 219 pedagogical learning elements, automated multi-page chapter composition, adaptive layout solvers, vector/pixel studio tooling, and print-ready PDF export.

## Key Features

- **219 Pedagogical Learning Elements**: Covers Reading & Writing, Maths, Science, Pictures & Tables, Projects, Extra Learning, and Online Resources.
- **6-Stage Curriculum Planning**: Sequential progression through **Start → Learn → Practice → Activities → Review → Test**.
- **Dual Authoring Modes**:
  - **Easy Mode**: Enforces textbook layout constraints, preventing accidental breaks while preserving editing, palettes, and layout conversion.
  - **Design Mode**: Free placement, scaling, rotation, and micro-adjustments for creative art directing.
- **Dynamic Re-flow & Continuation**: Text wraps and flows across pages automatically without shrinking grade-targeted reading typography.
- **Smart Vector & Pixel Studio**: Non-destructive CSS filters, SVG path editing, parametric shapes, Bézier controls, and corner fillets.
- **Print & PDF Publication Pipeline**: High-precision vector scenes rendered directly to 300 DPI print-ready proofs and student workbooks (omitting teacher answer keys in student views).
- **Optional AI Authoring**: Context-aware curriculum drafting assisted by structured OpenAI models via server-side API proxy.

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **UI & Styling**: React 19, Tailwind CSS, Lucide React
- **State Management**: Zustand with Immer
- **3D & Canvas**: Three.js, React Three Fiber, Drei, Canvas Confetti
- **Validation**: Zod
- **Export & Graphics**: jsPDF

## Getting Started

### Prerequisites

- Node.js 18+ (Node 20+ recommended)
- npm or pnpm

### Installation

```bash
# Clone the repository
git clone https://github.com/bhanreddy/nex-maxx-book-studio.git
cd nex-maxx-book-studio

# Install dependencies
npm install
```

### Environment Configuration (Optional)

If enabling server-side AI curriculum authoring:

```bash
cp .env.example .env.local
```

Configure your `.env.local`:
```env
OPENAI_API_KEY=your_openai_api_key
OPENAI_CURRICULUM_MODEL=your_structured_output_model
SUPERADMIN_API_URL=https://superadminapi.nexsyrus.com/api/v1/
SCHOOLIMS_API_URL=https://simsapi.nexsyrus.com/api/v1/
```

### Running Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Validation & Testing

```bash
# TypeScript type check
npm run typecheck

# Automated test suite (96 tests)
npm test

# Production build
npm run build
```

## Documentation

For full architectural details, canonical document models, and rendering pipelines, see [docs/curriculum-engine.md](docs/curriculum-engine.md).

## License

Private / All rights reserved.
