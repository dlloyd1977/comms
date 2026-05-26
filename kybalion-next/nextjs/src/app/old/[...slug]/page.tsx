import Link from "next/link";
import { notFound } from "next/navigation";
import { getLegacyEntries, getLegacyTitle, resolveLegacyEntry } from "@/lib/legacy";
import fs from "fs";

export const dynamic = "force-static";

export function generateStaticParams() {
  return getLegacyEntries()
    .filter((entry) => entry.slug.length > 0)
    .map((entry) => ({ slug: entry.slug }));
}

export default async function LegacyPage({
  params,
}: {
  params: Promise<{ slug: string[] }>;
}) {
  const { slug } = await params;
  const entry = resolveLegacyEntry(slug);
  if (!entry) {
    notFound();
  }

  const html = fs.readFileSync(entry.filePath, "utf-8");
  const title = getLegacyTitle(html);
  const iframeSrc = `/old-static/${encodeURI(entry.relPath)}`;
  const breadcrumb = `/old/${slug.join("/")}`;

  return (
    <div className="space-y-4">
      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Legacy page</p>
        <h2 className="mt-2 text-xl font-semibold text-slate-900">{title}</h2>
        <p className="mt-2 text-sm text-slate-600">{breadcrumb}</p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link
            href={iframeSrc}
            className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Open original file
          </Link>
          <Link
            href="/old"
            className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
          >
            Back to legacy index
          </Link>
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-3 shadow-sm">
        <iframe
          title={title}
          src={iframeSrc}
          className="h-[78vh] w-full rounded-2xl border border-slate-200"
        />
      </div>
    </div>
  );
}
