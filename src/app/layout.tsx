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
    <html lang="en" className="dark">
      <body className="antialiased bg-[#090d14] text-slate-100">{children}</body>
    </html>
  );
}
