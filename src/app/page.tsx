"use client";

import React, { useState } from "react";
import { BookDashboard } from "../features/dashboard/BookDashboard";
import { BookEditorWorkspace } from "../features/editor/BookEditorWorkspace";
import { BookWizardModal } from "../features/wizard/BookWizardModal";
import { useEditorStore } from "../editor/stores/editorStore";

export default function Home() {
  const [currentView, setCurrentView] = useState<"dashboard" | "editor">("editor");
  const { selectBook } = useEditorStore();

  const handleOpenBook = (bookId: string) => {
    selectBook(bookId);
    setCurrentView("editor");
  };

  const handleBackToDashboard = () => {
    setCurrentView("dashboard");
  };

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
