"use client";

import { useEffect, useState } from "react";
import { createSPAClient } from "@/lib/supabase/client";
import Link from "next/link";

/**
 * Auth-aware button for the Kybalion hub page.
 * - Checks Supabase session (cookies via @supabase/ssr)
 * - If signed in → shows "Open Reader" and syncs session to localStorage
 *   so vanilla pages (reader.html, admin.js) can find it without re-auth
 * - If not signed in → shows "Sign In" linking to login with redirect
 */
export default function KybalionAuthButton() {
  const [email, setEmail] = useState<string | null>(null);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    const supabase = createSPAClient();
    supabase.auth.getSession().then(({ data }) => {
      const session = data.session;
      setEmail(session?.user?.email ?? null);
      setChecked(true);

      // Sync cookie-based session → localStorage for vanilla pages
      if (session) {
        try {
          const ref = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL!).host.split(".")[0];
          localStorage.setItem(`sb-${ref}-auth-token`, JSON.stringify(session));
        } catch {
          // Non-critical — reader will fall back to its own auth flow
        }
      }
    });
  }, []);

  // Placeholder while checking to prevent layout shift
  if (!checked) {
    return (
      <span
        className="inline-block rounded-full px-4 py-2 text-sm font-semibold"
        style={{ background: "#2f5f8f", color: "#ffffff", border: "1px solid #2f5f8f", opacity: 0.6 }}
      >
        &hellip;
      </span>
    );
  }

  if (email) {
    return (
      <Link
        href="/kybalion/reader.html"
        className="rounded-full px-4 py-2 text-sm font-semibold"
        style={{ background: "#2f5f8f", color: "#ffffff", border: "1px solid #2f5f8f" }}
      >
        Open Reader
      </Link>
    );
  }

  return (
    <Link
      href="/auth/login?redirect=/kybalion/reader.html"
      className="rounded-full px-4 py-2 text-sm font-semibold"
      style={{ background: "#2f5f8f", color: "#ffffff", border: "1px solid #2f5f8f" }}
    >
      Sign In
    </Link>
  );
}
