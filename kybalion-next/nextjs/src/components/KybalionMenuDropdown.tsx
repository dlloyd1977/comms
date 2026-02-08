"use client";

import { useState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";

/* ── Link data ──────────────────────────────────────────── */

const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/kybalion/", label: "Kybalion Home" },
  { href: "/kybalion/reader.html", label: "Reader" },
  { href: "/kybalion/docs/", label: "Document Library" },
];

const SESSION_LINKS = Array.from({ length: 12 }, (_, i) => ({
  href: `/kybalion/docs/session-${String(i + 1).padStart(2, "0")}/`,
  label: `Session ${i + 1}`,
}));

const RESOURCE_LINKS = [
  { href: "/kybalion/docs/templates/", label: "Templates" },
  { href: "/kybalion/docs/assets/", label: "Assets" },
  { href: "/kybalion/docs/master-docs/", label: "Master Documents" },
];

/* ── Styles ─────────────────────────────────────────────── */

const linkClass =
  "rounded-lg px-2 py-1.5 text-sm font-semibold no-underline hover:bg-[#f1f5fb] block";
const linkStyle: React.CSSProperties = { color: "#1f1c1a" };
const headingStyle: React.CSSProperties = { color: "#888" };

/**
 * Centralised Menu dropdown for every Next.js page (homepage, hub).
 *
 * Includes:
 *  • Navigation links + contextual Sign In (when not authenticated)
 *  • Documents section with collapsible Sessions sub-menu
 *
 * Click-outside detection uses a ref-based `contains()` check
 * (avoids conflicts with React 18 event delegation).
 */
export default function KybalionMenuDropdown() {
  const [open, setOpen] = useState(false);
  const [sessionsOpen, setSessionsOpen] = useState(false);
  const [isAuthed, setIsAuthed] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  /* Auth check — dynamic import keeps the menu functional even if
     the Supabase client fails to load. */
  useEffect(() => {
    (async () => {
      try {
        const { createSPASassClient } = await import("@/lib/supabase/client");
        const supabase = await createSPASassClient();
        const {
          data: { user },
        } = await supabase.getSupabaseClient().auth.getUser();
        setIsAuthed(!!user);
      } catch {
        /* not authenticated or client unavailable */
      }
    })();
  }, []);

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
          className="absolute right-0 z-[100] mt-2 max-h-[70vh] min-w-[240px] overflow-auto rounded-xl border bg-white p-3 shadow-lg"
          style={{ top: "calc(100% + 4px)", borderColor: "#e2ddd7" }}
          role="menu"
        >
          {/* ── Navigation ──────────────────────── */}
          <div className="flex flex-col gap-1">
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
            {!isAuthed && (
              <Link
                href={`/auth/login?redirect=${encodeURIComponent(pathname)}`}
                className={linkClass}
                style={linkStyle}
                onClick={() => setOpen(false)}
              >
                Sign In
              </Link>
            )}
          </div>

          <hr className="my-2 border-t" style={{ borderColor: "#e2ddd7" }} />

          {/* ── Documents ───────────────────────── */}
          <div className="flex flex-col gap-1">
            <p className="px-2 text-[0.7rem] font-semibold uppercase tracking-[0.12em]" style={headingStyle}>
              Documents
            </p>

            {/* General */}
            <Link
              href="/kybalion/docs/general/"
              className={linkClass}
              style={linkStyle}
              onClick={() => setOpen(false)}
            >
              General
            </Link>

            {/* Sessions (collapsible) */}
            <button
              type="button"
              className="flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-left text-sm font-semibold hover:bg-[#f1f5fb]"
              style={linkStyle}
              onClick={() => setSessionsOpen((v) => !v)}
            >
              Sessions
              <span className="text-xs" style={headingStyle}>
                {sessionsOpen ? "▾" : "▸"}
              </span>
            </button>
            {sessionsOpen && (
              <div className="ml-2 flex flex-col gap-0.5 border-l pl-2" style={{ borderColor: "#e2ddd7" }}>
                {SESSION_LINKS.map(({ href, label }) => (
                  <Link
                    key={href}
                    href={href}
                    className="block rounded-lg px-2 py-1 text-sm no-underline hover:bg-[#f1f5fb]"
                    style={linkStyle}
                    onClick={() => setOpen(false)}
                  >
                    {label}
                  </Link>
                ))}
              </div>
            )}

            {/* Resources */}
            {RESOURCE_LINKS.map(({ href, label }) => (
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
