import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#090d14] text-slate-100 flex flex-col items-center justify-center p-6 text-center">
      <h2 className="text-3xl font-bold mb-2">Page Not Found</h2>
      <p className="text-sm text-slate-400 mb-6">The requested publication page could not be located.</p>
      <Link
        href="/"
        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold"
      >
        Return to Studio
      </Link>
    </div>
  );
}
