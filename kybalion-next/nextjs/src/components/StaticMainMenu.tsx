"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { createSPASassClient } from "@/lib/supabase/client";

type MemberRow = {
  nickname?: string | null;
  first_name?: string | null;
  group?: string | null;
};

function pickDisplayName(nickname?: string | null, firstName?: string | null, email?: string | null) {
  const nick = (nickname || "").trim();
  const first = (firstName || "").trim();
  const mail = (email || "").trim();
  return nick || first || mail || "";
}

export default function StaticMainMenu() {
  const pathname = usePathname();

  useEffect(() => {
    const menuBtn = document.getElementById("menuBtn");
    const menuPanel = document.getElementById("menuPanel");
    const menuSessionsBtn = document.getElementById("menuSessionsBtn");
    const menuSessionsFlyout = document.getElementById("menuSessionsFlyout");
    const menuAuthLink = document.getElementById("menuAuthLink");
    const userDisplay = document.getElementById("userDisplay");
    const menuWrapper = menuBtn?.closest(".menu-wrapper") || null;
    const adminLinks = document.querySelectorAll(".menu-link.admin-only");

    if (!menuBtn || !menuPanel) return;

    const closeMenu = () => {
      menuPanel.classList.add("is-hidden");
      menuBtn.setAttribute("aria-expanded", "false");
      if (menuSessionsFlyout) menuSessionsFlyout.classList.add("is-hidden");
    };

    const toggleMenu = (event: Event) => {
      event.preventDefault();
      const isOpen = !menuPanel.classList.contains("is-hidden");
      menuPanel.classList.toggle("is-hidden", isOpen);
      menuBtn.setAttribute("aria-expanded", String(!isOpen));
      if (isOpen && menuSessionsFlyout) menuSessionsFlyout.classList.add("is-hidden");
    };

    const handleDocumentClick = (event: Event) => {
      if (!menuWrapper) return;
      const target = event.target as Node;
      if (!menuWrapper.contains(target)) {
        closeMenu();
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeMenu();
    };

    const handleSessions = (event: Event) => {
      event.preventDefault();
      if (!menuSessionsFlyout) return;
      menuSessionsFlyout.classList.toggle("is-hidden");
    };

    menuBtn.addEventListener("click", toggleMenu);
    document.addEventListener("click", handleDocumentClick);
    document.addEventListener("keydown", handleEscape);
    if (menuSessionsBtn) menuSessionsBtn.addEventListener("click", handleSessions);

    const setAuthState = async () => {
      try {
        const supabase = await createSPASassClient();
        const {
          data: { user },
        } = await supabase.getSupabaseClient().auth.getUser();

        if (user) {
          const email = user.email || "";
          let nickname: string | null = user.user_metadata?.nickname ?? null;
          let firstName: string | null = user.user_metadata?.first_name ?? null;
          let displayName = pickDisplayName(nickname, firstName, email);

          try {
            const { data: profile } = await supabase
              .getSupabaseClient()
              .from("active_members")
              .select("nickname, first_name, group")
              .eq("email", email)
              .maybeSingle<MemberRow>();
            if (profile?.nickname) nickname = profile.nickname;
            if (profile?.first_name) firstName = profile.first_name;
            displayName = pickDisplayName(nickname, firstName, email);

            const isAdmin = profile?.group === "admin";
            adminLinks.forEach((link) => {
              link.classList.toggle("is-hidden", !isAdmin);
              link.setAttribute("aria-hidden", String(!isAdmin));
            });
          } catch {
            // Ignore profile lookup errors
          }

          if (userDisplay) {
            userDisplay.textContent = displayName ? `Current User: ${displayName}` : "";
            userDisplay.classList.remove("is-hidden");
          }

          if (menuAuthLink) {
            menuAuthLink.textContent = "Log Out";
            menuAuthLink.removeAttribute("href");
            menuAuthLink.style.cursor = "pointer";
            menuAuthLink.onclick = async (e) => {
              e.preventDefault();
              try {
                const ref = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL!).host.split(".")[0];
                const prefix = `sb-${ref}-`;
                for (let i = localStorage.length - 1; i >= 0; i--) {
                  const key = localStorage.key(i);
                  if (key?.startsWith(prefix)) localStorage.removeItem(key);
                }
              } catch {
                // Non-critical
              }
              await supabase.getSupabaseClient().auth.signOut();
              window.location.reload();
            };
          }

          return;
        }
      } catch {
        // ignore
      }

      if (userDisplay) {
        userDisplay.textContent = "";
        userDisplay.classList.add("is-hidden");
      }
      adminLinks.forEach((link) => {
        link.classList.add("is-hidden");
        link.setAttribute("aria-hidden", "true");
      });
      if (menuAuthLink) {
        menuAuthLink.textContent = "Sign In";
        menuAuthLink.setAttribute("href", "/auth/login");
        menuAuthLink.style.cursor = "pointer";
        menuAuthLink.onclick = null;
      }
    };

    void setAuthState();

    return () => {
      menuBtn.removeEventListener("click", toggleMenu);
      document.removeEventListener("click", handleDocumentClick);
      document.removeEventListener("keydown", handleEscape);
      if (menuSessionsBtn) menuSessionsBtn.removeEventListener("click", handleSessions);
    };
  }, [pathname]);

  return (
    <div className="menu-wrapper" data-layout-key="menu">
      <span className="user-display is-hidden" id="userDisplay" data-layout-key="user" aria-live="polite"></span>
      <button
        className="button secondary"
        type="button"
        id="menuBtn"
        aria-haspopup="true"
        aria-expanded="false"
        aria-controls="menuPanel"
      >
        Main Menu
      </button>
      <div className="menu-panel is-hidden" id="menuPanel" role="menu" aria-label="Documents">
        <div className="menu-section">
          <p className="menu-title">Navigation</p>
          <Link className="menu-link" href="/">Home</Link>
          <Link className="menu-link" href="/kybalion/">Kybalion Home</Link>
          <Link className="menu-link" href="/kybalion/reader.html">Reader</Link>
          <Link className="menu-link" href="/kybalion/docs/">Document Library</Link>
          <Link className="menu-link" href="/auth/login" id="menuAuthLink">
            Sign In
          </Link>
        </div>
        <div className="menu-section">
          <p className="menu-title">Documents</p>
          <Link className="menu-link" href="/kybalion/docs/general/">General</Link>
          <div className="menu-sessions-wrapper">
            <button className="menu-link menu-sessions-trigger" type="button" id="menuSessionsBtn">
              Sessions <span className="menu-arrow">&#9656;</span>
            </button>
            <div className="menu-sessions-flyout is-hidden" id="menuSessionsFlyout">
              <Link className="menu-link" href="/kybalion/docs/session-01/">Session 1</Link>
              <Link className="menu-link" href="/kybalion/docs/session-02/">Session 2</Link>
              <Link className="menu-link" href="/kybalion/docs/session-03/">Session 3</Link>
              <Link className="menu-link" href="/kybalion/docs/session-04/">Session 4</Link>
              <Link className="menu-link" href="/kybalion/docs/session-05/">Session 5</Link>
              <Link className="menu-link" href="/kybalion/docs/session-06/">Session 6</Link>
              <Link className="menu-link" href="/kybalion/docs/session-07/">Session 7</Link>
              <Link className="menu-link" href="/kybalion/docs/session-08/">Session 8</Link>
              <Link className="menu-link" href="/kybalion/docs/session-09/">Session 9</Link>
              <Link className="menu-link" href="/kybalion/docs/session-10/">Session 10</Link>
              <Link className="menu-link" href="/kybalion/docs/session-11/">Session 11</Link>
              <Link className="menu-link" href="/kybalion/docs/session-12/">Session 12</Link>
            </div>
          </div>
          <Link className="menu-link" href="/kybalion/docs/templates/">Templates</Link>
          <Link className="menu-link admin-only is-hidden" href="/kybalion/docs/assets/">Assets</Link>
          <Link className="menu-link admin-only is-hidden" href="/kybalion/docs/master-docs/">Master Documents</Link>
        </div>
      </div>
    </div>
  );
}
