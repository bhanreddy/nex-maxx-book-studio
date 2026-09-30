"use client";

import React, { useState } from "react";
import { useUiStore } from "../../editor/stores/uiStore";
import { useEditorStore } from "../../editor/stores/editorStore";
import { X, FileSpreadsheet, Plus, Trash2, CheckCircle2 } from "lucide-react";

export const DataMergeModal: React.FC = () => {
  const { dataMergeModalOpen, setDataMergeModalOpen } = useUiStore();
  const { generateDataMergePages, getActivePage } = useEditorStore();

  const [records, setRecords] = useState<Record<string, string>[]>([
    {
      "Student Name": "Aarav Sharma",
      "School Name": "Delhi Public School, R.K. Puram",
      Grade: "Grade 5-A",
      Score: "98% Mastery",
    },
    {
      "Student Name": "Diya Patel",
      "School Name": "The Heritage Academy, Ahmedabad",
      Grade: "Grade 5-B",
      Score: "96% Mastery",
    },
    {
      "Student Name": "Rohan Iyer",
      "School Name": "National Public School, Bangalore",
      Grade: "Grade 5-C",
      Score: "94% Mastery",
    },
  ]);

  const [previewIndex, setPreviewIndex] = useState(0);

  if (!dataMergeModalOpen) return null;

  const activePage = getActivePage();
  const keys = Object.keys(records[0] || {});

  const handleAddRow = () => {
    setRecords([
      ...records,
      {
        "Student Name": "New Student",
        "School Name": "International School",
        Grade: "Grade 5",
        Score: "90%",
      },
    ]);
  };

  const handleDeleteRow = (index: number) => {
    if (records.length <= 1) return;
    setRecords(records.filter((_, idx) => idx !== index));
    if (previewIndex >= records.length - 1) {
      setPreviewIndex(Math.max(0, records.length - 2));
    }
  };

  const handleGenerate = () => {
    generateDataMergePages(records);
    setDataMergeModalOpen(false);
  };

  return (
    <div
      className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 select-none"
      onClick={() => setDataMergeModalOpen(false)}
    >
      <div
        className="w-full max-w-2xl bg-[#0e131d] border border-white/10 rounded-2xl shadow-2xl p-6 overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-600/30 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-sm text-slate-100 block">
                Publishing Data Merge Studio
              </span>
              <span className="text-[11px] text-slate-400">
                Generate personalized curriculum worksheets and certificates from data records
              </span>
            </div>
          </div>
          <button
            onClick={() => setDataMergeModalOpen(false)}
            className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Info Banner */}
        <div className="my-3 p-3 rounded-xl bg-white/5 border border-white/5 text-xs text-slate-300">
          <span className="font-semibold text-emerald-400 block mb-0.5">Template Placeholders:</span>
          Use variables like{" "}
          <code className="bg-black/50 text-indigo-300 px-1 py-0.5 rounded font-mono text-[10px]">
            {"{{Student Name}}"}
          </code>
          ,{" "}
          <code className="bg-black/50 text-indigo-300 px-1 py-0.5 rounded font-mono text-[10px]">
            {"{{School Name}}"}
          </code>{" "}
          inside any text frame on Current Page ({activePage?.displayNumber}). Each record below generates an independent customized page!
        </div>

        {/* Data Records Table */}
        <div className="flex-1 overflow-x-auto overflow-y-auto max-h-[260px] border border-white/10 rounded-xl mb-3">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-black/40 text-slate-300 border-b border-white/10">
                <th className="p-2 w-8 text-center text-[10px] text-slate-500 font-mono">#</th>
                {keys.map((k) => (
                  <th key={k} className="p-2 font-semibold text-slate-200">
                    {k}
                  </th>
                ))}
                <th className="p-2 w-8 text-center"></th>
              </tr>
            </thead>
            <tbody>
              {records.map((rec, rIdx) => (
                <tr
                  key={rIdx}
                  className={`border-b border-white/5 hover:bg-white/5 ${
                    previewIndex === rIdx ? "bg-indigo-950/30" : ""
                  }`}
                  onClick={() => setPreviewIndex(rIdx)}
                >
                  <td className="p-2 text-center text-[10px] font-mono text-slate-500">{rIdx + 1}</td>
                  {keys.map((k) => (
                    <td key={k} className="p-2">
                      <input
                        type="text"
                        value={rec[k] || ""}
                        onChange={(e) => {
                          const updated = [...records];
                          updated[rIdx][k] = e.target.value;
                          setRecords(updated);
                        }}
                        className="w-full bg-transparent outline-none text-slate-200 focus:bg-black/40 px-1 py-0.5 rounded"
                      />
                    </td>
                  ))}
                  <td className="p-2 text-center">
                    {records.length > 1 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteRow(rIdx);
                        }}
                        className="p-1 hover:bg-rose-500/20 text-rose-400 rounded"
                        title="Delete Record"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between text-xs pt-3 border-t border-white/10">
          <button
            onClick={handleAddRow}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-200"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Record</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setDataMergeModalOpen(false)}
              className="px-3.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300"
            >
              Cancel
            </button>
            <button
              onClick={handleGenerate}
              className="px-4 py-1.5 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold flex items-center gap-1.5 shadow-lg shadow-emerald-900/30"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Generate {records.length} Merged Pages</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
