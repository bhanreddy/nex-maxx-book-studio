"use client";

import React, { useState } from "react";
import { useEditorStore } from "../../editor/stores/editorStore";
import { useUiStore } from "../../editor/stores/uiStore";
import { PublisherLogo } from '../ui/PublisherLogo';
import {
  BookOpen,
  Plus,
  Search,
  Clock,
  Sparkles,
  ArrowRight,
} from "lucide-react";

interface BookDashboardProps {
  onOpenBook: (bookId: string) => void;
}

export const BookDashboard: React.FC<BookDashboardProps> = ({ onOpenBook }) => {
  const { books, selectBook, resetToDemo } = useEditorStore();
  const { setWizardOpen } = useUiStore();

  const [search, setSearch] = useState("");
  const [selectedSubject, setSelectedSubject] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");

  const filteredBooks = books.filter((b) => {
    const matchesSearch =
      b.title.toLowerCase().includes(search.toLowerCase()) ||
      b.grade.toLowerCase().includes(search.toLowerCase()) ||
      b.subject.toLowerCase().includes(search.toLowerCase());
    const matchesSubject = selectedSubject === "all" || b.subject === selectedSubject;
    const matchesStatus = selectedStatus === "all" || b.status === selectedStatus;
    return matchesSearch && matchesSubject && matchesStatus;
  });

  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-[#090d14] text-slate-900 dark:text-slate-100 flex flex-col select-none transition-colors">
      {/* Dashboard Glass Header */}
      <header className="h-16 border-b border-slate-200 dark:border-white/10 bg-white/80 dark:bg-[#0f141f]/80 backdrop-blur-xl px-8 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <PublisherLogo className="h-12 w-auto" />
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-300 font-mono font-semibold">
                BOOK STUDIO
              </span>
            </div>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 block -mt-0.5">
              Production-Grade Curriculum Authoring & Publishing Platform
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={resetToDemo}
            className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 text-xs font-medium border border-slate-200 dark:border-white/5 transition-colors"
          >
            Reset Flagship Demo
          </button>
          <button
            onClick={() => setWizardOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-emerald-500 hover:scale-105 text-white text-xs font-semibold shadow-lg shadow-indigo-900/30 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Book</span>
          </button>
        </div>
      </header>

      {/* Main Workspace Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-8 space-y-8">
        {/* Banner Section */}
        <div className="relative rounded-3xl p-8 overflow-hidden bg-gradient-to-br from-indigo-950/60 via-slate-900/80 to-[#0e1726] border border-white/10 shadow-2xl">
          <div className="relative z-10 max-w-2xl space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Commercial Offset & Digital Publishing Ready</span>
            </div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight leading-tight">
              Publish Professional Curriculums, Textbooks & Workbooks at Scale.
            </h1>
            <p className="text-sm text-slate-300 leading-relaxed">
              Design complete 100–300+ page books with structured curriculum separation, point-perfect
              print geometry (72 pt = 1 inch), interactive smart guides, 3D hardcover previews, and
              instant vector PDF preflight compilation.
            </p>
          </div>

          <div className="absolute right-8 top-1/2 -translate-y-1/2 hidden lg:flex items-center gap-6 opacity-80 pointer-events-none">
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md text-center">
              <span className="text-2xl font-bold text-white block">{books.length}</span>
              <span className="text-xs text-slate-400">Active Books</span>
            </div>
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md text-center">
              <span className="text-2xl font-bold text-emerald-400 block">300 DPI</span>
              <span className="text-xs text-slate-400">Target Print Spec</span>
            </div>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Search */}
          <div className="relative flex-1 w-full max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search books by title, subject, or grade level..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-white dark:bg-[#111827] border border-slate-200 dark:border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-800 dark:text-slate-100 outline-none focus:border-indigo-500 shadow-sm transition-colors"
            />
          </div>

          {/* Filters */}
          <div className="flex items-center gap-2 w-full md:w-auto">
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 text-xs text-slate-700 dark:text-slate-300 outline-none shadow-xs"
            >
              <option value="all">All Subjects</option>
              <option value="Science">Science</option>
              <option value="Mathematics">Mathematics</option>
              <option value="English">English</option>
              <option value="Environmental Studies">Environmental Studies</option>
              <option value="Social Studies">Social Studies</option>
            </select>

            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 text-xs text-slate-700 dark:text-slate-300 outline-none shadow-xs"
            >
              <option value="all">All Statuses</option>
              <option value="Draft">Draft</option>
              <option value="Writing">Writing</option>
              <option value="Design">Design</option>
              <option value="Approved">Approved</option>
              <option value="Published">Published</option>
            </select>
          </div>
        </div>

        {/* Books Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredBooks.map((b) => (
            <div
              key={b.id}
              onClick={() => {
                selectBook(b.id);
                onOpenBook(b.id);
              }}
              className="group bg-white dark:bg-[#111827]/90 rounded-2xl border border-slate-200 dark:border-white/10 hover:border-indigo-500/60 overflow-hidden shadow-md dark:shadow-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-xl dark:hover:shadow-indigo-950/40 cursor-pointer flex flex-col"
            >
              {/* Card Cover Art Banner */}
              <div className="relative h-44 w-full bg-slate-900 overflow-hidden">
                {b.coverImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={b.coverImage}
                    alt={b.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-tr from-indigo-950 to-slate-900 flex items-center justify-center">
                    <BookOpen className="w-12 h-12 text-slate-700" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                {/* Status Badge */}
                <div className="absolute top-3 left-3">
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold bg-black/60 backdrop-blur-md text-emerald-400 border border-emerald-500/30">
                    {b.status}
                  </span>
                </div>

                <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between text-xs text-white">
                  <span className="font-bold text-sm drop-shadow">{b.grade}</span>
                  <span className="px-2 py-0.5 rounded bg-black/50 backdrop-blur-sm text-[10px] font-mono text-slate-300">
                    {b.pages.length} Pages
                  </span>
                </div>
              </div>

              {/* Card Body */}
              <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                <div>
                  <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-1">
                    {b.title}
                  </h3>
                  {b.subtitle && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-1">{b.subtitle}</p>
                  )}
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-white/5 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                  <div className="flex items-center gap-1.5 font-mono text-[10px]">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>{b.academicYear}</span>
                  </div>

                  <div className="flex items-center gap-1 text-indigo-600 dark:text-indigo-400 font-medium group-hover:translate-x-1 transition-transform">
                    <span>Open Editor</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
};
