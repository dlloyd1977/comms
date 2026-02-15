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

  function closeMenu() {
    if (!menuBtn || !menuPanel) return;
    menuPanel.classList.add("is-hidden");
    menuBtn.setAttribute("aria-expanded", "false");
  }

  function initMenuToggle() {
    if (!menuBtn || !menuPanel) return;

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

    if (menuSessionsBtn && menuSessionsFlyout) {
      menuSessionsBtn.addEventListener("click", function () {
        menuSessionsFlyout.classList.toggle("is-hidden");
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
  }

  function applySignedInState(signOutHandler) {
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
  }

  async function initAuthState() {
    const { url, anonKey } = getSupabaseConfig();
    const canUseSupabase = Boolean(url && anonKey && window.supabase?.createClient);
    const supabaseClient = canUseSupabase ? window.supabase.createClient(url, anonKey) : null;

    async function syncStateFromSession(session) {
      if (session) {
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
        });
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

    await syncStateFromSession(getStorageSession());
  }

  initMenuToggle();
  initAuthState();
})();