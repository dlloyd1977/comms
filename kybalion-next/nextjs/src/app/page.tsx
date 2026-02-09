import React from "react";
import Link from "next/link";
import StaticMainMenu from "@/components/StaticMainMenu";

export default function Home() {
  const productName = process.env.NEXT_PUBLIC_PRODUCTNAME || "Kybalion";

  const quickLinks = [
    { label: "General", href: "/kybalion/docs/general/", note: "Program overview & logistics" },
    { label: "Session 01", href: "/kybalion/docs/session-01/", note: "Overview, worksheet, slides" },
    { label: "Session 02", href: "/kybalion/docs/session-02/", note: "Materials & assignments" },
    { label: "Session 03", href: "/kybalion/docs/session-03/", note: "Materials & assignments" },
    { label: "Templates", href: "/kybalion/docs/templates/", note: "Facilitator templates" },
    { label: "Assets", href: "/kybalion/docs/assets/", note: "Logos & imagery" },
  ];

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
              <p className="text-xs uppercase tracking-[0.28em] text-slate-500">Kybalion Docs</p>
              <p className="text-lg font-semibold text-slate-900">{productName} Dashboard</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <StaticMainMenu />
          </div>
        </div>
      </nav>

      <main className="relative mx-auto max-w-6xl px-6 pb-16 pt-10">
        <section className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
          <div className="rounded-3xl border border-slate-200 bg-white/90 p-8 shadow-sm">
            <p className="text-xs uppercase tracking-[0.32em] text-slate-500">Welcome</p>
            <h1 className="mt-3 text-3xl font-semibold text-slate-900 md:text-4xl">
              A calm, organized home for the Kybalion study materials.
            </h1>
            <p className="mt-4 text-base text-slate-600">
              Use the dashboard to jump into session files, templates, and facilitator assets. Admins can manage
              uploads and keep the shared header layout aligned for every visitor.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/kybalion/docs/"
                className="rounded-full bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
              >
                Enter the Library
              </Link>
              <Link
                href="/kybalion/docs/session-01/"
                className="rounded-full border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Open Session 01
              </Link>
            </div>
          </div>

          <div className="grid gap-4">
            <div className="rounded-2xl border border-slate-200 bg-white/90 p-5 shadow-sm">
              <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Current Focus</p>
              <p className="mt-3 text-lg font-semibold text-slate-900">Session Materials</p>
              <p className="mt-2 text-sm text-slate-600">
                All sessions are organized chronologically with facilitator guides, worksheets, and slides.
              </p>
              <Link
                href="/kybalion/docs/session-12/"
                className="mt-4 inline-flex text-sm font-semibold text-slate-900 hover:text-slate-700"
              >
                Jump to Session 12 -&gt;
              </Link>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-900 p-5 text-white shadow-sm">
              <p className="text-xs uppercase tracking-[0.24em] text-slate-300">Admin</p>
              <p className="mt-3 text-lg font-semibold text-white">Upload & organize files</p>
              <p className="mt-2 text-sm text-slate-200">
                Sign in to upload documents, manage folders, and update the shared header layout.
              </p>
              <Link
                href="/auth/login"
                className="mt-4 inline-flex text-sm font-semibold text-white underline decoration-white/60 underline-offset-4"
              >
                Sign in / Create account
              </Link>
            </div>
          </div>
        </section>

        <section className="mt-8 grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white/90 p-5 shadow-sm">
            <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Library</p>
            <p className="mt-3 text-lg font-semibold text-slate-900">All sessions in one place</p>
            <p className="mt-2 text-sm text-slate-600">Browse session folders, general resources, and templates.</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white/90 p-5 shadow-sm">
            <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Shared Layout</p>
            <p className="mt-3 text-lg font-semibold text-slate-900">Consistent header experience</p>
            <p className="mt-2 text-sm text-slate-600">Admin updates apply to all visitors immediately.</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white/90 p-5 shadow-sm">
            <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Secure Access</p>
            <p className="mt-3 text-lg font-semibold text-slate-900">Supabase-authenticated access</p>
            <p className="mt-2 text-sm text-slate-600">Members sign in to view the full document library.</p>
          </div>
        </section>

        <section className="mt-8 rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Quick Links</p>
              <p className="mt-2 text-lg font-semibold text-slate-900">Jump back into the material</p>
            </div>
            <Link
              href="/kybalion/docs/"
              className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              View all docs
            </Link>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {quickLinks.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 hover:border-slate-300"
              >
                <span>
                  <span className="block font-semibold text-slate-900">{item.label}</span>
                  <span className="block text-xs text-slate-500">{item.note}</span>
                </span>
                <span className="text-slate-400">-&gt;</span>
              </Link>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
