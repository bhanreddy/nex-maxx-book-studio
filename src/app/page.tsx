"use client";

import { prepareOfflineShell } from "../editor/persistence/offlineShell";
import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { useEditorStore } from "../editor/stores/editorStore";
import { PublisherLogo } from '../features/ui/PublisherLogo';

const BookDashboard = dynamic(
  () => import("../features/dashboard/BookDashboard").then((m) => m.BookDashboard),
  { ssr: false }
);
const BookEditorWorkspace = dynamic(
  () => import("../features/editor/BookEditorWorkspace").then((m) => m.BookEditorWorkspace),
  { ssr: false }
);
const BookWizardModal = dynamic(
  () => import("../features/wizard/BookWizardModal").then((m) => m.BookWizardModal),
  { ssr: false }
);

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const [currentView, setCurrentView] = useState<"dashboard" | "editor">("editor");
  const { selectBook } = useEditorStore();

  useEffect(() => {
    setMounted(true);
    if (process.env.NODE_ENV === 'production') void Promise.all([
      import('../features/dashboard/BookDashboard'), import('../features/wizard/BookWizardModal'), import('../features/editor/BookEditorWorkspace'),
    ]).then(() => prepareOfflineShell()).catch(() => {});
  }, []);

  const handleOpenBook = (bookId: string) => {
    selectBook(bookId);
    setCurrentView("editor");
  };

  const handleBackToDashboard = () => {
    setCurrentView("dashboard");
  };

  if (!mounted) {
    return (
      <main className="w-screen h-screen overflow-hidden bg-[#f4f6fa] dark:bg-[#080b11] flex items-center justify-center">
        <div className="flex items-center gap-3">
          <PublisherLogo className="w-60 h-auto" />
        </div>
      </main>
    );
  }

  return (
    <main className="w-screen h-screen overflow-hidden">
      {currentView === "dashboard" ? (
        <>
          <BookDashboard onOpenBook={handleOpenBook} />
          <BookWizardModal />
        </>
      ) : (
        <BookEditorWorkspace onBackToDashboard={handleBackToDashboard} />
      )}
    </main>
  );
}
