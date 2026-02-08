import Link from "next/link";
import KybalionMenuDropdown from "@/components/KybalionMenuDropdown";

export default function KybalionHubPage() {
  return (
    <div
      className="min-h-screen text-[#1f1c1a]"
      style={{ background: "#f6f4f1", fontFamily: "'Atkinson Hyperlegible', 'Iowan Old Style', Garamond, Palatino, serif" }}
    >
      {/* ── Sticky nav ──────────────────────────── */}
      <nav
        className="sticky top-0 z-50 border-b"
        style={{
          background: "linear-gradient(140deg, #f8f5f1 0%, #ebe5dd 100%)",
          borderColor: "#e2ddd7",
        }}
      >
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-4">
          <div>
            <p className="text-xs uppercase tracking-[0.12em]" style={{ color: "#5b5450" }}>
              Annotated Facilitator Edition
            </p>
            <p
              className="text-xl font-semibold"
              style={{ fontFamily: "'Cormorant Garamond', 'Times New Roman', serif", color: "#1f1c1a" }}
            >
              The Kybalion
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <KybalionMenuDropdown />
          </div>
        </div>
      </nav>

      {/* ── Hero ────────────────────────────────── */}
      <main className="mx-auto max-w-6xl px-6 pb-16 pt-10">
        <section className="grid gap-8 lg:grid-cols-[1.3fr_1fr]">
          {/* Hero card */}
          <div
            className="rounded-3xl border p-8"
            style={{ background: "#ffffff", borderColor: "#e2ddd7", boxShadow: "0 12px 30px rgba(20,20,20,0.08)" }}
          >
            <p className="text-xs uppercase tracking-[0.18em]" style={{ color: "#5b5450" }}>
              Universal Laws &amp; Principles
            </p>
            <h1
              className="mt-3 text-4xl font-semibold md:text-5xl"
              style={{ fontFamily: "'Cormorant Garamond', 'Times New Roman', serif", color: "#1f1c1a" }}
            >
              The Kybalion
            </h1>
            <p className="mt-4 max-w-lg text-base leading-relaxed" style={{ color: "#5b5450" }}>
              An annotated, stanza-based edition built for study and discussion. Read online,
              save highlights, tag passages, and take notes — all from the facilitator reader.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                href="/kybalion/reader.html"
                className="rounded-full px-6 py-3 text-sm font-semibold"
                style={{ background: "#2f5f8f", color: "#ffffff", border: "1px solid #2f5f8f" }}
              >
                Open the Reader
              </Link>
              <Link
                href="/kybalion/invite2"
                className="rounded-full border px-5 py-3 text-sm font-semibold"
                style={{ background: "#fff", color: "#2f5f8f", borderColor: "#2f5f8f" }}
              >
                View Kick-off Invite
              </Link>
              <Link
                href="/kybalion/docs/"
                className="rounded-full border px-5 py-3 text-sm font-semibold"
                style={{ background: "#fff", color: "#2f5f8f", borderColor: "#2f5f8f" }}
              >
                Session Documents
              </Link>
            </div>
          </div>

          {/* Highlights card */}
          <div
            className="rounded-3xl border p-7"
            style={{ background: "#ffffff", borderColor: "#e2ddd7", boxShadow: "0 12px 30px rgba(20,20,20,0.08)" }}
          >
            <p className="text-xs uppercase tracking-[0.18em]" style={{ color: "#5b5450" }}>
              How It Works
            </p>
            <ul className="mt-5 space-y-4 text-sm leading-relaxed" style={{ color: "#1f1c1a" }}>
              <li className="flex items-start gap-3">
                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold" style={{ background: "#dfe7ef", color: "#234a70" }}>1</span>
                <span>Meet once or twice a month for discussion and reflection on each chapter.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold" style={{ background: "#dfe7ef", color: "#234a70" }}>2</span>
                <span>Sessions focus on practical, everyday applications of the seven Hermetic principles.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold" style={{ background: "#dfe7ef", color: "#234a70" }}>3</span>
                <span>Use the Reader to highlight text, tag stanzas, write annotations, and save personal notes.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold" style={{ background: "#dfe7ef", color: "#234a70" }}>4</span>
                <span>Worksheets, slides, and templates are available in the document library.</span>
              </li>
            </ul>
          </div>
        </section>

        {/* ── Three-card grid ───────────────────── */}
        <section className="mt-10 grid gap-5 md:grid-cols-3">
          {/* Reader card */}
          <div
            className="rounded-2xl border p-6"
            style={{ background: "#ffffff", borderColor: "#e2ddd7", boxShadow: "0 12px 30px rgba(20,20,20,0.08)" }}
          >
            <p className="text-xs uppercase tracking-[0.18em]" style={{ color: "#5b5450" }}>
              Reader
            </p>
            <p className="mt-3 text-lg font-semibold" style={{ color: "#1f1c1a" }}>
              Annotated facilitator edition
            </p>
            <p className="mt-2 text-sm" style={{ color: "#5b5450" }}>
              Full text with TOC, notes, highlights, tags, and search. Standard or stanza view.
            </p>
            <Link
              href="/kybalion/reader.html"
              className="mt-5 inline-flex rounded-full px-5 py-2 text-sm font-semibold"
              style={{ background: "#2f5f8f", color: "#ffffff", border: "1px solid #2f5f8f" }}
            >
              Open Reader
            </Link>
          </div>

          {/* Invites card */}
          <div
            className="rounded-2xl border p-6"
            style={{ background: "#ffffff", borderColor: "#e2ddd7", boxShadow: "0 12px 30px rgba(20,20,20,0.08)" }}
          >
            <p className="text-xs uppercase tracking-[0.18em]" style={{ color: "#5b5450" }}>
              Invites
            </p>
            <p className="mt-3 text-lg font-semibold" style={{ color: "#1f1c1a" }}>
              Two formats available
            </p>
            <p className="mt-2 text-sm" style={{ color: "#5b5450" }}>
              Quick invite or detailed kick-off meeting information.
            </p>
            <div className="mt-5 flex gap-3">
              <Link
                href="/kybalion/invite1"
                className="inline-flex rounded-full border px-4 py-2 text-sm font-semibold"
                style={{ background: "#fff", color: "#2f5f8f", borderColor: "#2f5f8f" }}
              >
                Quick Invite
              </Link>
              <Link
                href="/kybalion/invite2"
                className="inline-flex rounded-full border px-4 py-2 text-sm font-semibold"
                style={{ background: "#fff", color: "#2f5f8f", borderColor: "#2f5f8f" }}
              >
                Full Invite
              </Link>
            </div>
          </div>

          {/* Docs card */}
          <div
            className="rounded-2xl border p-6"
            style={{ background: "#ffffff", borderColor: "#e2ddd7", boxShadow: "0 12px 30px rgba(20,20,20,0.08)" }}
          >
            <p className="text-xs uppercase tracking-[0.18em]" style={{ color: "#5b5450" }}>
              Documents
            </p>
            <p className="mt-3 text-lg font-semibold" style={{ color: "#1f1c1a" }}>
              Session materials
            </p>
            <p className="mt-2 text-sm" style={{ color: "#5b5450" }}>
              Download worksheets, slides, and templates for each session.
            </p>
            <Link
              href="/kybalion/docs/"
              className="mt-5 inline-flex rounded-full border px-5 py-2 text-sm font-semibold"
              style={{ background: "#fff", color: "#2f5f8f", borderColor: "#2f5f8f" }}
            >
              Browse Docs
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
