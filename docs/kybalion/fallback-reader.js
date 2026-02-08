/**
 * fallback-reader.js — Non-module fallback handlers for reader.html.
 * Ensures menu toggle and auth buttons work even if the ES module
 * (reader.js) fails to load (e.g., CDN unreachable, iframe restrictions).
 *
 * When reader.js loads successfully, it sets window.__readerModuleLoaded = true,
 * and these handlers silently defer to the module's handlers.
 */
(function () {
  "use strict";
  window.__readerModuleLoaded = false;

  // ── Menu toggle ──
  var menuBtn = document.getElementById("menuBtn");
  var menuPanel = document.getElementById("menuPanel");
  var menuSessionsBtn = document.getElementById("menuSessionsBtn");
  var menuSessionsFlyout = document.getElementById("menuSessionsFlyout");

  if (menuBtn && menuPanel) {
    menuBtn.addEventListener("click", function (e) {
      if (window.__readerModuleLoaded) return;
      e.stopPropagation();
      var isOpen = !menuPanel.classList.contains("is-hidden");
      menuPanel.classList.toggle("is-hidden", isOpen);
      menuBtn.setAttribute("aria-expanded", String(!isOpen));
    });
    menuPanel.addEventListener("click", function (e) {
      if (window.__readerModuleLoaded) return;
      e.stopPropagation();
    });
    document.addEventListener("click", function () {
      if (window.__readerModuleLoaded) return;
      menuPanel.classList.add("is-hidden");
      menuBtn.setAttribute("aria-expanded", "false");
      if (menuSessionsFlyout) menuSessionsFlyout.classList.add("is-hidden");
    });
    document.addEventListener("keydown", function (e) {
      if (window.__readerModuleLoaded) return;
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
      if (window.__readerModuleLoaded) return;
      e.stopPropagation();
      menuSessionsFlyout.classList.toggle("is-hidden");
    });
  }

  // ── Auth button (opens notes modal with auth panel) ──
  var authBtn = document.getElementById("authOpenBtn");
  var notesModal = document.getElementById("notesModal");
  var authPanel = document.getElementById("authPanel");
  var notesContent = document.getElementById("notesContent");

  if (authBtn) {
    authBtn.addEventListener("click", function (e) {
      if (window.__readerModuleLoaded) return;
      e.preventDefault();
      // Open notes modal and show auth panel
      if (notesModal) {
        notesModal.classList.remove("is-hidden");
        notesModal.setAttribute("aria-hidden", "false");
      }
      if (notesContent) notesContent.classList.add("is-hidden");
      if (authPanel) authPanel.classList.remove("is-hidden");
    });
  }

  // ── Close notes modal ──
  var closeNotesBtn = document.getElementById("closeNotesBtn");
  if (closeNotesBtn) {
    closeNotesBtn.addEventListener("click", function () {
      if (window.__readerModuleLoaded) return;
      if (notesModal) {
        notesModal.classList.add("is-hidden");
        notesModal.setAttribute("aria-hidden", "true");
      }
    });
  }

  console.log("[fallback-reader.js] Non-module UI handlers registered");
})();
