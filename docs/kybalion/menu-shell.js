(function () {
  "use strict";

  const body = document.body;
  const menuBtn = document.getElementById("menuBtn");
  const menuPanel = document.getElementById("menuPanel");
  const menuSessionsBtn = document.getElementById("menuSessionsBtn");
  const menuSessionsFlyout = document.getElementById("menuSessionsFlyout");
  const menuAuthLink = document.getElementById("menuAuthLink");
  const menuChangePasswordLink = document.getElementById("menuChangePasswordLink");
  const menuSignOutLink = document.getElementById("menuSignOutLink");
  const adminMenuLinks = document.querySelectorAll(".menu-link.admin-only");
  const membersTable = body?.dataset?.membersTable || "active_members";
  const adminEmails = (body?.dataset?.adminEmails || "")
    .split(",")
    .map(function (value) {
      return value.trim().toLowerCase();
    })
    .filter(Boolean);

  function closeMenu() {
    if (!menuBtn || !menuPanel) return;
    menuPanel.classList.add("is-hidden");
    menuBtn.setAttribute("aria-expanded", "false");
    closeSessionsFlyout();
  }

  function setSessionsFlyoutOpen(open) {
    if (!menuSessionsBtn || !menuSessionsFlyout) return;
    menuSessionsFlyout.classList.toggle("is-hidden", !open);
    menuSessionsBtn.setAttribute("aria-expanded", open ? "true" : "false");
  }

  function closeSessionsFlyout(returnFocus) {
    if (!menuSessionsBtn || !menuSessionsFlyout) return false;
    const wasOpen = !menuSessionsFlyout.classList.contains("is-hidden");
    setSessionsFlyoutOpen(false);
    if (returnFocus && wasOpen) {
      menuSessionsBtn.focus();
    }
    return wasOpen;
  }

  function initSessionsFlyoutAria() {
    if (!menuSessionsBtn || !menuSessionsFlyout) return;
    menuSessionsBtn.setAttribute("aria-controls", "menuSessionsFlyout");
    menuSessionsBtn.setAttribute("aria-expanded", "false");
  }

  function initMenuToggle() {
    if (!menuBtn || !menuPanel) return;

    initSessionsFlyoutAria();

    menuBtn.addEventListener("click", function () {
      const willOpen = menuPanel.classList.contains("is-hidden");
      menuPanel.classList.toggle("is-hidden", !willOpen);
      menuBtn.setAttribute("aria-expanded", willOpen ? "true" : "false");
    });

    document.addEventListener("click", function (event) {
      if (!menuPanel.contains(event.target) && event.target !== menuBtn) {
        closeMenu();
      }
    });

    document.addEventListener("keydown", function (event) {
      if (event.key !== "Escape") return;

      if (closeSessionsFlyout(true)) {
        event.preventDefault();
        event.stopPropagation();
        return;
      }

      if (!menuPanel.classList.contains("is-hidden")) {
        closeMenu();
        menuBtn.focus();
      }
    });

    if (menuSessionsBtn && menuSessionsFlyout) {
      menuSessionsBtn.addEventListener("click", function () {
        const willOpen = menuSessionsFlyout.classList.contains("is-hidden");
        setSessionsFlyoutOpen(willOpen);
      });
    }
  }

  function getSupabaseConfig() {
    return {
      url: body?.dataset?.supabaseUrl || "",
      anonKey: body?.dataset?.supabaseAnonKey || "",
    };
  }

  function getStorageSession() {
    const key = window.__authSync?.getStorageKey?.();
    if (!key) return null;
    const raw = window.localStorage?.getItem(key);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  function getUserEmail(user) {
    return (user?.email || user?.user_metadata?.email || "").toLowerCase();
  }

  async function fetchActiveMember(supabaseClient, email) {
    if (!supabaseClient || !email) return null;
    const { data, error } = await supabaseClient
      .from(membersTable)
      .select("status, group")
      .eq("email", email)
      .maybeSingle();
    if (error) return null;
    return data?.status === "active" ? data : null;
  }

  function setAdminMenuVisibility(isAdmin) {
    adminMenuLinks.forEach(function (link) {
      link.classList.toggle("is-hidden", !isAdmin);
      link.setAttribute("aria-hidden", String(!isAdmin));
    });
  }

  function applySignedOutState() {
    if (menuAuthLink) {
      menuAuthLink.classList.remove("is-hidden");
      menuAuthLink.setAttribute("aria-hidden", "false");
      menuAuthLink.setAttribute("href", `/auth/login?redirect=${encodeURIComponent(location.pathname)}`);
    }
    if (menuChangePasswordLink) {
      menuChangePasswordLink.classList.add("is-hidden");
      menuChangePasswordLink.setAttribute("aria-hidden", "true");
    }
    if (menuSignOutLink) {
      menuSignOutLink.classList.add("is-hidden");
      menuSignOutLink.setAttribute("aria-hidden", "true");
      menuSignOutLink.onclick = null;
    }
    setAdminMenuVisibility(false);
  }

  function applySignedInState(signOutHandler, isAdmin) {
    if (menuAuthLink) {
      menuAuthLink.classList.add("is-hidden");
      menuAuthLink.setAttribute("aria-hidden", "true");
    }
    if (menuChangePasswordLink) {
      menuChangePasswordLink.classList.remove("is-hidden");
      menuChangePasswordLink.setAttribute("aria-hidden", "false");
    }
    if (menuSignOutLink) {
      menuSignOutLink.classList.remove("is-hidden");
      menuSignOutLink.setAttribute("aria-hidden", "false");
      menuSignOutLink.style.cursor = "pointer";
      menuSignOutLink.onclick = signOutHandler;
    }
    setAdminMenuVisibility(Boolean(isAdmin));
  }

  async function initAuthState() {
    const { url, anonKey } = getSupabaseConfig();
    const canUseSupabase = Boolean(url && anonKey && window.supabase?.createClient);
    const supabaseClient = canUseSupabase ? window.supabase.createClient(url, anonKey) : null;

    async function syncStateFromSession(session) {
      if (session) {
        const user = session?.user || null;
        const email = getUserEmail(user);
        const activeMember = await fetchActiveMember(supabaseClient, email);
        const isAdmin = (activeMember?.group === "admin") || adminEmails.includes(email);
        applySignedInState(async function (event) {
          event.preventDefault();
          try {
            if (supabaseClient) {
              await supabaseClient.auth.signOut();
            }
          } finally {
            window.__authSync?.clearAll?.();
            location.reload();
          }
        }, isAdmin);
      } else {
        applySignedOutState();
      }
    }

    if (supabaseClient) {
      const { data } = await supabaseClient.auth.getSession();
      await syncStateFromSession(data?.session || null);
      supabaseClient.auth.onAuthStateChange(async function (_event, session) {
        await syncStateFromSession(session || null);
      });
      return;
    }

    const localSession = getStorageSession();
    if (localSession) {
      const user = localSession?.user || null;
      const email = getUserEmail(user);
      const isAdmin = adminEmails.includes(email);
      applySignedInState(function (event) {
        event.preventDefault();
        window.__authSync?.clearAll?.();
        location.reload();
      }, isAdmin);
      return;
    }

    applySignedOutState();
  }

  initMenuToggle();
  initAuthState();
})();