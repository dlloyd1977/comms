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
        menuPanel.classList.add("is-hidden");
        menuBtn.setAttribute("aria-expanded", "false");
        if (menuSessionsFlyout) menuSessionsFlyout.classList.add("is-hidden");
      }
    });
  }

  // ── Sessions flyout ──
  if (menuSessionsBtn && menuSessionsFlyout) {
    menuSessionsBtn.addEventListener("click", function (e) {
      if (window.__adminModuleLoaded) return;
      e.stopPropagation();
      menuSessionsFlyout.classList.toggle("is-hidden");
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
      // Otherwise show a "loading" notice
      showFallbackAuthNotice();
    });
  }

  function showFallbackAuthNotice() {
    var existing = document.getElementById("fallbackAuthModal");
    if (existing) {
      existing.classList.remove("is-hidden");
      return;
    }
    var modal = document.createElement("div");
    modal.id = "fallbackAuthModal";
    modal.className = "auth-modal";
    modal.innerHTML =
      '<div class="auth-modal-backdrop"></div>' +
      '<div class="auth-modal-content panel">' +
      "<h2>Sign In</h2>" +
      '<p style="color:#555;margin:12px 0">The authentication service is still loading. ' +
      "Please wait a moment and try again.</p>" +
      '<div class="auth-actions">' +
      '<button class="button secondary" type="button" id="fallbackAuthClose">Close</button>' +
      "</div></div>";
    document.body.appendChild(modal);
    modal
      .querySelector(".auth-modal-backdrop")
      .addEventListener("click", function () {
        modal.classList.add("is-hidden");
      });
    modal
      .querySelector("#fallbackAuthClose")
      .addEventListener("click", function () {
        modal.classList.add("is-hidden");
      });
  }

  console.log("[fallback.js] Non-module UI handlers registered");
})();
