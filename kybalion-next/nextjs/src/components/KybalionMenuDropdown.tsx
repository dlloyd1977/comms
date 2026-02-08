"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";

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

/**
 * Reusable Menu dropdown for Next.js pages (hub, homepage).
 * Mirrors the style/structure used in the static docs pages.
 */
export default function KybalionMenuDropdown() {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const close = () => setOpen(false);
    document.addEventListener("click", close);
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("click", close);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  return (
    <div ref={wrapRef} className="relative inline-flex">
      <button
        type="button"
        className="rounded-full border px-4 py-2 text-sm font-medium"
        style={{ background: "#fff", color: "#2f5f8f", borderColor: "#2f5f8f" }}
        aria-haspopup="true"
        aria-expanded={open}
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
      >
        Menu
      </button>

      {open && (
        <div
          className="absolute right-0 z-40 mt-2 max-h-[70vh] min-w-[220px] overflow-auto rounded-xl border bg-white p-3 shadow-lg"
          style={{ top: "calc(100% + 4px)", borderColor: "#e2ddd7" }}
          role="menu"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Navigation section */}
          <div className="flex flex-col gap-1.5">
            <p className="text-[0.75rem] uppercase tracking-[0.1em]" style={{ color: "#888" }}>
              Navigation
            </p>
            {NAV_LINKS.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className="rounded-lg px-2 py-1.5 text-sm font-semibold no-underline hover:bg-[#f1f5fb]"
                style={{ color: "#1f1c1a" }}
                onClick={() => setOpen(false)}
              >
                {label}
              </Link>
            ))}
          </div>

          {/* Divider */}
          <hr className="my-2 border-t" style={{ borderColor: "#e2ddd7" }} />

          {/* Documents section */}
          <div className="flex flex-col gap-1.5">
            <p className="text-[0.75rem] uppercase tracking-[0.1em]" style={{ color: "#888" }}>
              Documents
            </p>
            {DOC_LINKS.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className="rounded-lg px-2 py-1.5 text-sm font-semibold no-underline hover:bg-[#f1f5fb]"
                style={{ color: "#1f1c1a" }}
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
