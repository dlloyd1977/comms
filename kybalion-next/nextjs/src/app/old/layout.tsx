import Link from "next/link";

export default function OldLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white/90">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Legacy</p>
            <h1 className="text-lg font-semibold text-slate-900">Previous comms pages</h1>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Back to new site
            </Link>
            <Link
              href="/kybalion/docs/"
              className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
            >
              Kybalion docs
            </Link>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-10">{children}</main>
      <footer className="border-t border-slate-200 bg-white/90">
        <div className="mx-auto max-w-6xl px-6 py-6 text-sm text-slate-600">
          Legacy content is preserved for reference under /old.
        </div>
      </footer>
    </div>
  );
}
