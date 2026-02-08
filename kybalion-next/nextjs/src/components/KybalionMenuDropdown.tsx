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
 * Centralised Main Menu dropdown for every Next.js page (homepage, hub).
 *
 * Includes:
 *  • Navigation links + Sign In / Log Out (auth-aware)
 *  • Documents section with Sessions flyout sub-menu
 *
 * Click-outside detection uses a ref-based `contains()` check.
 */
export default function KybalionMenuDropdown() {
  const [open, setOpen] = useState(false);
  const [sessionsHover, setSessionsHover] = useState(false);
  const [isAuthed, setIsAuthed] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const sessionsTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pathname = usePathname();

  /* Auth check */
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

  /* Click-outside & Escape to close */
  useEffect(() => {
    if (!open) return;
    const onOutside = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
        setSessionsHover(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        setSessionsHover(false);
      }
    };
    document.addEventListener("mousedown", onOutside);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onOutside);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  /* Delayed hover helpers to prevent flicker */
  const openSessions = () => {
    if (sessionsTimer.current) clearTimeout(sessionsTimer.current);
    setSessionsHover(true);
  };
  const closeSessions = () => {
    sessionsTimer.current = setTimeout(() => setSessionsHover(false), 200);
  };

  /* Sign-out handler */
  const handleSignOut = async () => {
    try {
      // Clear localStorage so static docs/reader pages also lose the session
      try {
        const ref = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL!).host.split('.')[0];
        const prefix = `sb-${ref}-`;
        for (let i = localStorage.length - 1; i >= 0; i--) {
          const key = localStorage.key(i);
          if (key?.startsWith(prefix)) localStorage.removeItem(key);
        }
      } catch { /* non-critical */ }
      const { createSPASassClient } = await import("@/lib/supabase/client");
      const supabase = await createSPASassClient();
      await supabase.getSupabaseClient().auth.signOut();
      setIsAuthed(false);
      setOpen(false);
      window.location.reload();
    } catch {
      setOpen(false);
    }
  };

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
        Main Menu
      </button>

      {/* ── Dropdown panel ─────────────────────── */}
      {open && (
        <div
          className="absolute right-0 z-[100] mt-2 max-h-[70vh] min-w-[240px] overflow-visible rounded-xl border bg-white p-3 shadow-lg"
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
            {/* Auth: Sign In or Log Out */}
            {isAuthed ? (
              <button
                type="button"
                className="rounded-lg px-2 py-1.5 text-left text-sm font-semibold hover:bg-[#f1f5fb]"
                style={linkStyle}
                onClick={handleSignOut}
              >
                Log Out
              </button>
            ) : (
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

            {/* Sessions — flyout sub-menu */}
            <div
              className="relative"
              onMouseEnter={openSessions}
              onMouseLeave={closeSessions}
            >
              <button
                type="button"
                className="flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-left text-sm font-semibold hover:bg-[#f1f5fb]"
                style={linkStyle}
                onClick={() => setSessionsHover((v) => !v)}
              >
                Sessions
                <span className="text-xs" style={headingStyle}>▸</span>
              </button>
              {sessionsHover && (
                <div
                  className="absolute z-[110] min-w-[160px] rounded-xl border bg-white p-2 shadow-lg"
                  style={{
                    top: 0,
                    right: "calc(100% + 6px)",
                    borderColor: "#e2ddd7",
                  }}
                  onMouseEnter={openSessions}
                  onMouseLeave={closeSessions}
                >
                  {SESSION_LINKS.map(({ href, label }) => (
                    <Link
                      key={href}
                      href={href}
                      className="block rounded-lg px-3 py-1.5 text-sm font-semibold no-underline hover:bg-[#f1f5fb]"
                      style={linkStyle}
                      onClick={() => { setOpen(false); setSessionsHover(false); }}
                    >
                      {label}
                    </Link>
                  ))}
                </div>
              )}
            </div>

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
