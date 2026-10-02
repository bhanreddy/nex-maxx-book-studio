import type { Metadata } from "next";
import "./globals.css";
import "../../public/fonts/local-fonts.css";

export const metadata: Metadata = {
  title: "NEX MAXX Book Studio — AI Textbook & Workbook Design Platform",
  description:
    "Production-grade publishing system for textbooks, workbooks, activity books, and teacher guides with 3D preview and commercial print preflight.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="light" data-theme="light" suppressHydrationWarning>
      <body className="antialiased bg-[#f4f6fa] text-slate-800 transition-colors duration-150">{children}</body>
    </html>
  );
}

