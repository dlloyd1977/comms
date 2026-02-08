"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";

/* ── Link data (matches reader.html / docs pages exactly) ── */

const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/kybalion/", label: "Kybalion Home" },
  { href: "/kybalion/reader.html", label: "Reader" },
  { href: "/kybalion/docs/", label: "Document Library" },
];

const DOC_LINKS = [
  { href: "/kybalion/docs/general/", label: "General" },
  { href: "/kybalion/docs/session-01/", label: "Session 1" },
  { href: "/kybalion/docs/session-02/", label: "Session 2" },
  { href: "/kybalion/docs/session-03/", label: "Session 3" },
  { href: "/kybalion/docs/session-04/", label: "Session 4" },
  { href: "/kybalion/docs/session-05/", label: "Session 5" },
  { href: "/kybalion/docs/session-06/", label: "Session 6" },
  { href: "/kybalion/docs/session-07/", label: "Session 7" },
  { href: "/kybalion/docs/session-08/", label: "Session 8" },
  { href: "/kybalion/docs/session-09/", label: "Session 9" },
  { href: "/kybalion/docs/session-10/", label: "Session 10" },
  { href: "/kybalion/docs/session-11/", label: "Session 11" },
  { href: "/kybalion/docs/session-12/", label: "Session 12" },
  { href: "/kybalion/docs/templates/", label: "Templates" },
];

/* ── Styles ─────────────────────────────────────────────── */

const linkClass =
  "rounded-lg px-2 py-1.5 text-sm font-semibold no-underline hover:bg-[#f1f5fb] block";
const linkStyle: React.CSSProperties = { color: "#1f1c1a" };
const headingStyle: React.CSSProperties = { color: "#888" };

/**
 * Centralised Menu dropdown for Next.js pages (homepage, hub).
 * Mirrors the exact structure used in reader.html and docs pages:
 *   NAVIGATION — Home, Kybalion Home, Reader, Document Library
 *   DOCUMENTS  — General, Sessions 1-12, Templates
 */
export default function KybalionMenuDropdown() {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  /* Click-outside & Escape to close (only active while open). */
  useEffect(() => {
    if (!open) return;
    const onOutside = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onOutside);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onOutside);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={wrapRef} className="relative inline-flex">
      {/* ── Trigger ────────────────────────────── */}
      <button
        type="button"
        className="rounded-full border px-4 py-2 text-sm font-medium"
        style={{ background: "#fff", color: "#2f5f8f", borderColor: "#2f5f8f" }}
        aria-haspopup="true"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        Menu
      </button>

      {/* ── Dropdown panel ─────────────────────── */}
      {open && (
        <div
          className="absolute right-0 z-[100] mt-2 max-h-[70vh] min-w-[220px] overflow-auto rounded-xl border bg-white p-3 shadow-lg"
          style={{ top: "calc(100% + 4px)", borderColor: "#e2ddd7" }}
          role="menu"
        >
          {/* ── Navigation ──────────────────────── */}
          <div className="flex flex-col gap-1.5">
            <p className="px-2 text-[0.7rem] font-semibold uppercase tracking-[0.12em]" style={headingStyle}>
              Navigation
            </p>
            {NAV_LINKS.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className={linkClass}
                style={linkStyle}
                onClick={() => setOpen(false)}
              >
                {label}
              </Link>
            ))}
          </div>

          <hr className="my-2 border-t" style={{ borderColor: "#e2ddd7" }} />

          {/* ── Documents ───────────────────────── */}
          <div className="flex flex-col gap-1.5">
            <p className="px-2 text-[0.7rem] font-semibold uppercase tracking-[0.12em]" style={headingStyle}>
              Documents
            </p>
            {DOC_LINKS.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className={linkClass}
                style={linkStyle}
                onClick={() => setOpen(false)}
              >
                {label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
