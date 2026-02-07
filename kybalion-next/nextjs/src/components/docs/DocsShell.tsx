import Link from "next/link";
import AuthAwareButtons from "@/components/AuthAwareButtons";
import { DOC_SECTIONS } from "@/lib/docs/sections";

type DocsShellProps = {
  title: string;
  subtitle: string;
  activeKey?: string;
  children: React.ReactNode;
};

export default function DocsShell({
  title,
  subtitle,
  activeKey,
  children,
}: DocsShellProps) {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <nav className="sticky top-0 z-50 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Kybalion Docs</p>
            <p className="text-lg font-semibold text-slate-900">{title}</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/kybalion"
              className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Kybalion hub
            </Link>
            <Link
              href="/old/kybalion/docs"
              className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Legacy docs
            </Link>
            <AuthAwareButtons variant="nav" />
          </div>
        </div>
      </nav>

      <main className="mx-auto grid max-w-6xl gap-6 px-6 pb-16 pt-10 lg:grid-cols-[240px_minmax(0,1fr)]">
        <aside className="space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Sections</p>
            <p className="mt-2 text-sm text-slate-600">{subtitle}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
            <nav className="flex flex-col gap-1 text-sm">
              {DOC_SECTIONS.map((section) => {
                const isActive = activeKey === section.key;
                return (
                  <Link
                    key={section.key}
                    href={`/kybalion/docs/${section.key}/`}
                    className={`rounded-lg px-3 py-2 font-medium ${
                      isActive
                        ? "bg-slate-900 text-white"
                        : "text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    {section.title}
                  </Link>
                );
              })}
            </nav>
          </div>
        </aside>
        <section className="space-y-6">{children}</section>
      </main>
    </div>
  );
}
