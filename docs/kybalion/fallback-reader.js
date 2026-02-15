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

  function setFallbackReaderSessionsFlyoutOpen(open) {
    if (!menuSessionsBtn || !menuSessionsFlyout) return;
    menuSessionsFlyout.classList.toggle("is-hidden", !open);
    menuSessionsBtn.setAttribute("aria-expanded", String(open));
    if (open) {
      window.requestAnimationFrame(function () {
        focusFirstSessionsFlyoutItem();
      });
    }
  }

  function getSessionsFlyoutFocusableItems() {
    if (!menuSessionsFlyout) return [];
    return Array.from(menuSessionsFlyout.querySelectorAll('a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'));
  }

  function focusFirstSessionsFlyoutItem() {
    var items = getSessionsFlyoutFocusableItems();
    if (items.length) {
      items[0].focus();
    }
  }

  function focusLastSessionsFlyoutItem() {
    var items = getSessionsFlyoutFocusableItems();
    if (items.length) {
      items[items.length - 1].focus();
    }
  }

  function moveSessionsFlyoutFocus(step) {
    var items = getSessionsFlyoutFocusableItems();
    if (!items.length) {
      menuSessionsBtn.focus();
      return;
    }

    var active = document.activeElement;
    var currentIndex = items.indexOf(active);
    var startIndex = currentIndex === -1 ? 0 : currentIndex;
    var nextIndex = (startIndex + step + items.length) % items.length;
    items[nextIndex].focus();
  }

  function handleSessionsFlyoutRovingKey(event) {
    if (window.__readerModuleLoaded) return;
    if (!menuSessionsBtn || !menuSessionsFlyout) return;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      if (menuSessionsFlyout.classList.contains("is-hidden")) {
        setFallbackReaderSessionsFlyoutOpen(true);
      } else {
        moveSessionsFlyoutFocus(1);
      }
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      if (menuSessionsFlyout.classList.contains("is-hidden")) {
        setFallbackReaderSessionsFlyoutOpen(true);
        window.requestAnimationFrame(function () {
          focusLastSessionsFlyoutItem();
        });
      } else {
        moveSessionsFlyoutFocus(-1);
      }
      return;
    }

    if (menuSessionsFlyout.classList.contains("is-hidden")) return;

    if (event.key === "Home") {
      event.preventDefault();
      focusFirstSessionsFlyoutItem();
      return;
    }

    if (event.key === "End") {
      event.preventDefault();
      focusLastSessionsFlyoutItem();
    }
  }

  function handleSessionsFlyoutTabKey(event) {
    if (window.__readerModuleLoaded) return;
    if (event.key !== "Tab" || !menuSessionsBtn || !menuSessionsFlyout) return;
    if (menuSessionsFlyout.classList.contains("is-hidden")) return;

    var items = getSessionsFlyoutFocusableItems();
    if (!items.length) {
      event.preventDefault();
      menuSessionsBtn.focus();
      return;
    }

    var first = items[0];
    var last = items[items.length - 1];
    var active = document.activeElement;

    if (event.shiftKey) {
      if (active === first || active === menuSessionsBtn) {
        event.preventDefault();
        last.focus();
      }
      return;
    }

    if (active === menuSessionsBtn || active === last) {
      event.preventDefault();
      first.focus();
    }
  }

  function closeFallbackReaderSessionsFlyout(returnFocus) {
    if (!menuSessionsBtn || !menuSessionsFlyout) return false;
    var wasOpen = !menuSessionsFlyout.classList.contains("is-hidden");
    setFallbackReaderSessionsFlyoutOpen(false);
    if (returnFocus && wasOpen) {
      menuSessionsBtn.focus();
    }
    return wasOpen;
  }

  function initFallbackReaderSessionsFlyoutAria() {
    if (!menuSessionsBtn || !menuSessionsFlyout) return;
    menuSessionsBtn.setAttribute("aria-controls", "menuSessionsFlyout");
    menuSessionsBtn.setAttribute("aria-expanded", "false");
  }

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
        if (closeFallbackReaderSessionsFlyout(true)) {
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
    initFallbackReaderSessionsFlyoutAria();
    menuSessionsBtn.addEventListener("keydown", handleSessionsFlyoutTabKey);
    menuSessionsFlyout.addEventListener("keydown", handleSessionsFlyoutTabKey);
    menuSessionsBtn.addEventListener("keydown", handleSessionsFlyoutRovingKey);
    menuSessionsFlyout.addEventListener("keydown", handleSessionsFlyoutRovingKey);
    menuSessionsBtn.addEventListener("click", function (e) {
      if (window.__readerModuleLoaded) return;
      e.stopPropagation();
      var willOpen = menuSessionsFlyout.classList.contains("is-hidden");
      setFallbackReaderSessionsFlyoutOpen(willOpen);
    });
  }

  // ── Auth button ──
  var authBtn = document.getElementById("authOpenBtn");

  if (authBtn) {
    authBtn.addEventListener("click", function (e) {
      if (window.__readerModuleLoaded) return;
      e.preventDefault();
      // Prefer module's handler if available
      if (typeof window.__readerShowAuthModal === "function") {
        window.__readerShowAuthModal();
        return;
      }
      // Show real auth form that signs in via Supabase REST API
      showFallbackReaderAuth();
    });
  }

  function showFallbackReaderAuth() {
    var existing = document.getElementById("fallbackReaderAuthModal");
    if (existing) {
      existing.classList.remove("is-hidden");
      var emailInput = existing.querySelector("#fallbackReaderEmail");
      if (emailInput) emailInput.focus();
      return;
    }

    var modal = document.createElement("div");
    modal.id = "fallbackReaderAuthModal";
    modal.className = "auth-modal";
    modal.innerHTML =
      '<div class="auth-modal-backdrop"></div>' +
      '<div class="auth-modal-content panel">' +
      "<h2>Sign In / Create Account</h2>" +
      '<form id="fallbackReaderAuthForm">' +
      "<label>Email" +
      '<input type="email" id="fallbackReaderEmail" autocomplete="email" required />' +
      "</label>" +
      "<label>Password" +
      '<input type="password" id="fallbackReaderPassword" autocomplete="current-password" required />' +
      "</label>" +
      '<p class="auth-status" id="fallbackReaderStatus" style="color:#555;margin:8px 0;min-height:1.2em"></p>' +
      '<div class="auth-actions">' +
      '<button class="button secondary" type="button" id="fallbackReaderCancel">Cancel</button>' +
      '<button class="button primary" type="submit">Sign in</button>' +
      "</div>" +
      "</form>" +
      "</div>";
    document.body.appendChild(modal);

    var form = modal.querySelector("#fallbackReaderAuthForm");
    var cancelBtn = modal.querySelector("#fallbackReaderCancel");
    var backdrop = modal.querySelector(".auth-modal-backdrop");

    function closeModal() {
      modal.classList.add("is-hidden");
    }
    cancelBtn.addEventListener("click", closeModal);
    backdrop.addEventListener("click", closeModal);

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var email = modal.querySelector("#fallbackReaderEmail").value.trim();
      var password = modal.querySelector("#fallbackReaderPassword").value;
      var status = modal.querySelector("#fallbackReaderStatus");

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
            console.warn("[fallback-reader.js] Could not store session:", err);
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

    modal.querySelector("#fallbackReaderEmail").focus();
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
