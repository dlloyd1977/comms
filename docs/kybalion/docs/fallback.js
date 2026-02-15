/**
 * fallback.js — Non-module fallback handlers for docs pages.
 * Ensures menu toggle and auth buttons work even if the ES module
 * (admin.js) fails to load (e.g., CDN unreachable, iframe restrictions).
 *
 * When admin.js loads successfully, it sets window.__adminModuleLoaded = true,
 * and these handlers silently defer to the module's addEventListener-based handlers.
 */
(function () {
  "use strict";
  window.__adminModuleLoaded = false;

  // ── Menu toggle ──
  var menuBtn = document.getElementById("menuBtn");
  var menuPanel = document.getElementById("menuPanel");
  var menuSessionsBtn = document.getElementById("menuSessionsBtn");
  var menuSessionsFlyout = document.getElementById("menuSessionsFlyout");

  function setFallbackSessionsFlyoutOpen(open) {
    if (!menuSessionsBtn || !menuSessionsFlyout) return;
    menuSessionsFlyout.classList.toggle("is-hidden", !open);
    menuSessionsBtn.setAttribute("aria-expanded", String(open));
  }

  function closeFallbackSessionsFlyout(returnFocus) {
    if (!menuSessionsBtn || !menuSessionsFlyout) return false;
    var wasOpen = !menuSessionsFlyout.classList.contains("is-hidden");
    setFallbackSessionsFlyoutOpen(false);
    if (returnFocus && wasOpen) {
      menuSessionsBtn.focus();
    }
    return wasOpen;
  }

  function initFallbackSessionsFlyoutAria() {
    if (!menuSessionsBtn || !menuSessionsFlyout) return;
    menuSessionsBtn.setAttribute("aria-controls", "menuSessionsFlyout");
    menuSessionsBtn.setAttribute("aria-expanded", "false");
  }

  if (menuBtn && menuPanel) {
    menuBtn.addEventListener("click", function (e) {
      if (window.__adminModuleLoaded) return;
      e.stopPropagation();
      var isOpen = !menuPanel.classList.contains("is-hidden");
      menuPanel.classList.toggle("is-hidden", isOpen);
      menuBtn.setAttribute("aria-expanded", String(!isOpen));
    });
    menuPanel.addEventListener("click", function (e) {
      if (window.__adminModuleLoaded) return;
      e.stopPropagation();
    });
    document.addEventListener("click", function () {
      if (window.__adminModuleLoaded) return;
      menuPanel.classList.add("is-hidden");
      menuBtn.setAttribute("aria-expanded", "false");
      if (menuSessionsFlyout) menuSessionsFlyout.classList.add("is-hidden");
    });
    document.addEventListener("keydown", function (e) {
      if (window.__adminModuleLoaded) return;
      if (e.key === "Escape") {
        if (closeFallbackSessionsFlyout(true)) {
          e.preventDefault();
          e.stopPropagation();
          return;
        }
        menuPanel.classList.add("is-hidden");
        menuBtn.setAttribute("aria-expanded", "false");
        menuBtn.focus();
      }
    });
  }

  // ── Sessions flyout ──
  if (menuSessionsBtn && menuSessionsFlyout) {
    initFallbackSessionsFlyoutAria();
    menuSessionsBtn.addEventListener("click", function (e) {
      if (window.__adminModuleLoaded) return;
      e.stopPropagation();
      var willOpen = menuSessionsFlyout.classList.contains("is-hidden");
      setFallbackSessionsFlyoutOpen(willOpen);
    });
  }

  // ── Auth button ──
  var authBtn = document.getElementById("authOpenBtn");
  if (authBtn) {
    authBtn.addEventListener("click", function (e) {
      if (window.__adminModuleLoaded) return;
      e.preventDefault();
      // Prefer module's showAuthModal if it registered globally
      if (typeof window.__docsShowAuthModal === "function") {
        window.__docsShowAuthModal();
        return;
      }
      // Show real auth form that signs in via Supabase REST API
      showFallbackAuthForm();
    });
  }

  function showFallbackAuthForm() {
    var existing = document.getElementById("fallbackAuthModal");
    if (existing) {
      existing.classList.remove("is-hidden");
      var emailInput = existing.querySelector("#fallbackAuthEmail");
      if (emailInput) emailInput.focus();
      return;
    }

    var modal = document.createElement("div");
    modal.id = "fallbackAuthModal";
    modal.className = "auth-modal";
    modal.innerHTML =
      '<div class="auth-modal-backdrop"></div>' +
      '<div class="auth-modal-content panel">' +
      "<h2>Sign In / Create Account</h2>" +
      '<form id="fallbackAuthForm">' +
      "<label>Email" +
      '<input type="email" id="fallbackAuthEmail" autocomplete="email" required />' +
      "</label>" +
      "<label>Password" +
      '<input type="password" id="fallbackAuthPassword" autocomplete="current-password" required />' +
      "</label>" +
      '<p class="auth-status" id="fallbackAuthStatus" style="color:#555;margin:8px 0;min-height:1.2em"></p>' +
      '<div class="auth-actions">' +
      '<button class="button secondary" type="button" id="fallbackAuthCancel">Cancel</button>' +
      '<button class="button primary" type="submit">Sign in</button>' +
      "</div>" +
      "</form>" +
      "</div>";
    document.body.appendChild(modal);

    var form = modal.querySelector("#fallbackAuthForm");
    var cancelBtn = modal.querySelector("#fallbackAuthCancel");
    var backdrop = modal.querySelector(".auth-modal-backdrop");

    function closeModal() {
      modal.classList.add("is-hidden");
    }
    cancelBtn.addEventListener("click", closeModal);
    backdrop.addEventListener("click", closeModal);

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var email = modal.querySelector("#fallbackAuthEmail").value.trim();
      var password = modal.querySelector("#fallbackAuthPassword").value;
      var status = modal.querySelector("#fallbackAuthStatus");

      var supabaseUrl = document.body.dataset.supabaseUrl;
      var supabaseKey = document.body.dataset.supabaseAnonKey;

      if (!supabaseUrl || !supabaseKey) {
        status.textContent = "Auth configuration missing.";
        status.style.color = "#c00";
        return;
      }

      status.textContent = "Signing in\u2026";
      status.style.color = "#555";

      fetch(supabaseUrl + "/auth/v1/token?grant_type=password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: supabaseKey,
          Authorization: "Bearer " + supabaseKey,
        },
        body: JSON.stringify({ email: email, password: password }),
      })
        .then(function (resp) {
          return resp.json().then(function (data) {
            return { ok: resp.ok, data: data };
          });
        })
        .then(function (result) {
          if (!result.ok) {
            var msg = (result.data && result.data.error_description) || (result.data && result.data.msg) || "Sign-in failed.";
            status.textContent = msg;
            status.style.color = "#c00";
            return;
          }

          // Store session in localStorage (same key Supabase JS client uses)
          var storageKey = "sb-" + supabaseUrl.replace(/^https?:\/\//, "").split(".")[0] + "-auth-token";
          try {
            localStorage.setItem(
              storageKey,
              JSON.stringify({
                access_token: result.data.access_token,
                refresh_token: result.data.refresh_token,
                expires_at: Math.floor(Date.now() / 1000) + result.data.expires_in,
                expires_in: result.data.expires_in,
                token_type: result.data.token_type || "bearer",
                user: result.data.user,
              })
            );
          } catch (err) {
            console.warn("[fallback.js] Could not store session:", err);
          }

          // Also sync session to cookies for Next.js SSO
          if (typeof window.__authSync !== "undefined") {
            window.__authSync.syncToCookies({
              access_token: result.data.access_token,
              refresh_token: result.data.refresh_token,
              expires_at: Math.floor(Date.now() / 1000) + result.data.expires_in,
              expires_in: result.data.expires_in,
              token_type: result.data.token_type || "bearer",
              user: result.data.user,
            });
          }

          status.textContent = "Signed in! Reloading\u2026";
          status.style.color = "#080";
          form.reset();
          setTimeout(function () {
            window.location.reload();
          }, 600);
        })
        .catch(function (err) {
          status.textContent = "Network error: " + err.message;
          status.style.color = "#c00";
        });
    });

    modal.querySelector("#fallbackAuthEmail").focus();
  }

  console.log("[fallback.js] Non-module UI handlers registered");
})();
