import Link from "next/link";
import AuthAwareButtons from "@/components/AuthAwareButtons";

export default function KybalionHubPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-sky-50 text-slate-900">
      <div className="absolute inset-x-0 top-0 h-64 bg-[radial-gradient(circle_at_top,_rgba(14,116,144,0.12),_transparent_60%)]" />
      <div className="absolute right-10 top-16 h-40 w-40 rounded-full bg-sky-100 blur-3xl opacity-60" />

      <nav className="sticky top-0 z-50 border-b border-slate-200/60 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-900 text-sm font-semibold text-white">
              K
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.28em] text-slate-500">Kybalion</p>
              <p className="text-lg font-semibold text-slate-900">Invite + Resources</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/"
              className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:border-slate-400 hover:bg-slate-50"
            >
              New home
            </Link>
            <Link
              href="/kybalion/docs/"
              className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:border-slate-400 hover:bg-slate-50"
            >
              Document library
            </Link>
            <Link
              href="/old/kybalion"
              className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:border-slate-400 hover:bg-slate-50"
            >
              Legacy reading view
            </Link>
            <AuthAwareButtons variant="nav" />
          </div>
        </div>
      </nav>

      <main className="relative mx-auto max-w-6xl px-6 pb-16 pt-10">
        <section className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
          <div className="rounded-3xl border border-slate-200 bg-white/90 p-8 shadow-sm">
            <p className="text-xs uppercase tracking-[0.32em] text-slate-500">Annotated facilitator edition</p>
            <h1 className="mt-3 text-3xl font-semibold text-slate-900 md:text-4xl">The Kybalion</h1>
            <p className="mt-4 text-base text-slate-600">
              Universal Laws & Principles. This hub connects the invites, session materials, and the original reading
              experience.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/kybalion/invite2"
                className="rounded-full bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
              >
                View kick-off invite
              </Link>
              <Link
                href="/kybalion/quick"
                className="rounded-full border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Quick invite
              </Link>
              <Link
                href="/kybalion/docs/"
                className="rounded-full border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Session documents
              </Link>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm">
            <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Highlights</p>
            <ul className="mt-4 space-y-3 text-sm text-slate-700">
              <li>Meet once or twice a month for discussion and reflection.</li>
              <li>Sessions focus on practical, everyday applications.</li>
              <li>Notes, worksheets, and slides live in the document library.</li>
              <li>The original annotated reading view stays available in /old.</li>
            </ul>
          </div>
        </section>

        <section className="mt-8 grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white/90 p-5 shadow-sm">
            <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Invites</p>
            <p className="mt-3 text-lg font-semibold text-slate-900">Two formats available</p>
            <p className="mt-2 text-sm text-slate-600">Quick invite or full kick-off meeting details.</p>
            <Link
              href="/kybalion/invite1"
              className="mt-4 inline-flex text-sm font-semibold text-slate-900 hover:text-slate-700"
            >
              Open quick invite
            </Link>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white/90 p-5 shadow-sm">
            <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Docs</p>
            <p className="mt-3 text-lg font-semibold text-slate-900">Session materials</p>
            <p className="mt-2 text-sm text-slate-600">Download worksheets, slides, and templates.</p>
            <Link
              href="/kybalion/docs/"
              className="mt-4 inline-flex text-sm font-semibold text-slate-900 hover:text-slate-700"
            >
              Browse docs
            </Link>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white/90 p-5 shadow-sm">
            <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Legacy</p>
            <p className="mt-3 text-lg font-semibold text-slate-900">Original reading view</p>
            <p className="mt-2 text-sm text-slate-600">Annotated stanza view preserved for reference.</p>
            <Link
              href="/old/kybalion"
              className="mt-4 inline-flex text-sm font-semibold text-slate-900 hover:text-slate-700"
            >
              Open legacy
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
