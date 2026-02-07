import Link from "next/link";
import { DOC_SECTIONS } from "@/lib/docs/sections";

type DocsSectionGridProps = {
  heading: string;
};

export default function DocsSectionGrid({ heading }: DocsSectionGridProps) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Sections</p>
      <h2 className="mt-2 text-xl font-semibold text-slate-900">{heading}</h2>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {DOC_SECTIONS.map((section) => (
          <Link
            key={section.key}
            href={`/kybalion/docs/${section.key}/`}
            className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 hover:border-slate-300"
          >
            <span className="block font-semibold text-slate-900">{section.title}</span>
            <span className="block text-xs text-slate-500">{section.description}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
