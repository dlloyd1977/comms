import Link from "next/link";
import { getLegacyEntries } from "@/lib/legacy";

export default function OldIndexPage() {
  const entries = getLegacyEntries()
    .filter((entry) => entry.slug.length > 0)
    .sort((a, b) => a.relPath.localeCompare(b.relPath));

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-2xl font-semibold text-slate-900">Legacy page index</h2>
        <p className="mt-2 text-sm text-slate-600">
          These are the previous comms pages, wrapped in the new template for reference.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {entries.map((entry) => {
          const href = `/old/${entry.slug.join("/")}`;
          return (
            <Link
              key={entry.relPath}
              href={href}
              className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 hover:border-slate-300"
            >
              <span className="block font-semibold text-slate-900">{href}</span>
              <span className="block text-xs text-slate-500">{entry.relPath}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
