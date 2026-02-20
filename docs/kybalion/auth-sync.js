/**
 * auth-sync.js v3.10.0 — Bidirectional session sync between localStorage and cookies.
 *
 * The Kybalion site uses two Supabase client types:
 *   1. @supabase/ssr (Next.js pages) — stores sessions in cookies
 *   2. @supabase/supabase-js (static docs/reader) — stores sessions in localStorage
 *
 * This utility ensures that when a user signs in on ANY page, the session
 * propagates to BOTH storage mechanisms, giving true single sign-on.
 *
 * Cookie format matches @supabase/ssr defaults:
 *   - Key: sb-<ref>-auth-token (or .0, .1, ... if >3180 chars per chunk)
 *   - Value: JSON string (not base64-encoded)
 *   - Options: path=/; SameSite=Lax; max-age=34560000 (400 days)
 *
 * Usage (non-module, loaded via <script> tag):
 *   window.__authSync.syncToCookies(sessionObj)   — after sign-in
 *   window.__authSync.syncToLocalStorage(sessionObj) — after sign-in
 *   window.__authSync.clearCookies()   — on sign-out
 *   window.__authSync.clearLocalStorage() — on sign-out
 *   window.__authSync.clearAll()       — on sign-out (both stores)
 *   window.__authSync.getRef()         — returns the Supabase project ref
 *   window.__authSync.getStorageKey()  — returns "sb-<ref>-auth-token"
 */
(function () {
  "use strict";

  var MAX_CHUNK_SIZE = 3180;
  var COOKIE_MAX_AGE = 400 * 24 * 60 * 60; // 34560000 seconds (400 days)
  var INACTIVITY_TIMEOUT_MS = 6 * 60 * 60 * 1000; // 6 hours
  var INACTIVITY_CHECK_INTERVAL_MS = 60 * 1000; // 1 minute
  var ACTIVITY_WRITE_DEBOUNCE_MS = 30 * 1000; // 30 seconds
  var lastActivityWriteAt = 0;
  var inactivityIntervalId = null;
  var activityListenersBound = false;
  var forcedLogoutInProgress = false;

  /**
   * Extract the Supabase project ref from the page's data attributes.
   */
  function getRef() {
    var url = document.body?.dataset?.supabaseUrl || "";
    if (!url) return "";
    try {
      return new URL(url).host.split(".")[0];
    } catch {
      return "";
    }
  }

  /**
   * Get the standard storage key: sb-<ref>-auth-token
   */
  function getStorageKey() {
    var ref = getRef();
    return ref ? "sb-" + ref + "-auth-token" : "";
  }

  /**
   * Get the localStorage key used to track last user activity.
   */
  function getLastActiveKey() {
    var storageKey = getStorageKey();
    return storageKey ? storageKey + "-last-active-at" : "";
  }

  function safeGetLocalStorage(key) {
    if (!key) return null;
    try {
      return window.localStorage?.getItem(key) || null;
    } catch {
      return null;
    }
  }

  function safeSetLocalStorage(key, value) {
    if (!key) return;
    try {
      window.localStorage?.setItem(key, value);
    } catch {
      // Ignore quota/private-mode failures.
    }
  }

  function safeRemoveLocalStorage(key) {
    if (!key) return;
    try {
      window.localStorage?.removeItem(key);
    } catch {
      // Ignore failures.
    }
  }

  // ── Cookie helpers ─────────────────────────────────────────

  /**
   * Set a single cookie with the @supabase/ssr default options.
   */
  function setCookie(name, value, maxAge) {
    var age = typeof maxAge === "number" ? maxAge : COOKIE_MAX_AGE;
    document.cookie =
      encodeURIComponent(name) +
      "=" +
      encodeURIComponent(value) +
      "; path=/; max-age=" +
      age +
      "; SameSite=Lax";
  }

  /**
   * Delete a cookie by setting max-age=0.
   */
  function deleteCookie(name) {
    setCookie(name, "", 0);
  }

  /**
   * Get all cookies as a { name: value } map.
   */
  function getAllCookies() {
    var result = {};
    var pairs = document.cookie.split(";");
    for (var i = 0; i < pairs.length; i++) {
      var pair = pairs[i].trim();
      var eqIdx = pair.indexOf("=");
      if (eqIdx < 0) continue;
      var name = decodeURIComponent(pair.substring(0, eqIdx));
      var value = decodeURIComponent(pair.substring(eqIdx + 1));
      result[name] = value;
    }
    return result;
  }

  function hasSessionInCookies() {
    var key = getStorageKey();
    if (!key) return false;
    var cookies = getAllCookies();
    if (Object.prototype.hasOwnProperty.call(cookies, key)) {
      return true;
    }
    for (var i = 0; i < 20; i++) {
      if (Object.prototype.hasOwnProperty.call(cookies, key + "." + i)) {
        return true;
      }
    }
    return false;
  }

  function hasSessionInLocalStorage() {
    var key = getStorageKey();
    if (!key) return false;
    return Boolean(safeGetLocalStorage(key));
  }

  function hasAnySession() {
    return hasSessionInLocalStorage() || hasSessionInCookies();
  }

  function getLastActiveAt() {
    var value = safeGetLocalStorage(getLastActiveKey());
    if (!value) return null;
    var timestamp = Number(value);
    return Number.isFinite(timestamp) ? timestamp : null;
  }

  function touchLastActive(forceWrite) {
    if (!hasAnySession()) return;
    var now = Date.now();
    if (!forceWrite && now - lastActivityWriteAt < ACTIVITY_WRITE_DEBOUNCE_MS) {
      return;
    }
    lastActivityWriteAt = now;
    safeSetLocalStorage(getLastActiveKey(), String(now));
  }

  async function forceLogoutForInactivity() {
    if (forcedLogoutInProgress) return;
    forcedLogoutInProgress = true;
    console.warn("[auth-sync] Inactivity timeout reached (6h). Signing out.");

    var url = document.body?.dataset?.supabaseUrl || "";
    var anonKey = document.body?.dataset?.supabaseAnonKey || "";
    if (url && anonKey && window.supabase?.createClient) {
      try {
        var client = window.supabase.createClient(url, anonKey);
        await client.auth.signOut({ scope: "global" });
      } catch (e) {
        console.warn("[auth-sync] Global signOut failed during inactivity logout:", e);
      }
    }

    clearAll();
    window.location.reload();
  }

  function checkInactivity() {
    if (!hasAnySession()) {
      forcedLogoutInProgress = false;
      return;
    }

    var lastActiveAt = getLastActiveAt();
    if (!lastActiveAt) {
      touchLastActive(true);
      return;
    }

    var elapsed = Date.now() - lastActiveAt;
    if (elapsed >= INACTIVITY_TIMEOUT_MS) {
      void forceLogoutForInactivity();
    }
  }

  function bindActivityListeners() {
    if (activityListenersBound) return;
    activityListenersBound = true;

    var events = ["click", "keydown", "pointerdown", "touchstart", "scroll"];
    var handler = function () {
      touchLastActive(false);
    };

    for (var i = 0; i < events.length; i++) {
      document.addEventListener(events[i], handler, { passive: true });
    }

    document.addEventListener("visibilitychange", function () {
      if (!document.hidden) {
        touchLastActive(true);
        checkInactivity();
      }
    });

    window.addEventListener("focus", function () {
      touchLastActive(true);
      checkInactivity();
    });
  }

  function initInactivityEnforcement() {
    bindActivityListeners();

    if (hasAnySession() && !getLastActiveAt()) {
      touchLastActive(true);
    }

    checkInactivity();

    if (inactivityIntervalId) {
      window.clearInterval(inactivityIntervalId);
    }
    inactivityIntervalId = window.setInterval(checkInactivity, INACTIVITY_CHECK_INTERVAL_MS);
  }

  // ── Chunking (matches @supabase/ssr chunker.js) ────────────

  /**
   * Split a value into cookie-safe chunks of <=MAX_CHUNK_SIZE encoded chars.
   * Returns an array of { name, value } objects.
   */
  function createChunks(key, value) {
    var encoded = encodeURIComponent(value);
    if (encoded.length <= MAX_CHUNK_SIZE) {
      return [{ name: key, value: value }];
    }
    var chunks = [];
    while (encoded.length > 0) {
      var head = encoded.slice(0, MAX_CHUNK_SIZE);
      // Don't split in the middle of a %XX escape
      var lastPct = head.lastIndexOf("%");
      if (lastPct > MAX_CHUNK_SIZE - 3) {
        head = head.slice(0, lastPct);
      }
      // Verify we can decode this chunk cleanly
      var decoded = "";
      while (head.length > 0) {
        try {
          decoded = decodeURIComponent(head);
          break;
        } catch (e) {
          if (head.length > 3 && head.charAt(head.length - 3) === "%") {
            head = head.slice(0, head.length - 3);
          } else {
            throw e;
          }
        }
      }
      chunks.push(decoded);
      encoded = encoded.slice(head.length);
    }
    return chunks.map(function (val, i) {
      return { name: key + "." + i, value: val };
    });
  }

  /**
   * Delete all cookie chunks for a given key (key, key.0, key.1, ...).
   */
  function deleteChunks(key) {
    var cookies = getAllCookies();
    // Delete the non-chunked version
    if (key in cookies) {
      deleteCookie(key);
    }
    // Delete numbered chunks
    for (var i = 0; i < 20; i++) {
      var chunkName = key + "." + i;
      if (chunkName in cookies) {
        deleteCookie(chunkName);
      } else {
        break;
      }
    }
  }

  // ── Public API ─────────────────────────────────────────────

  /**
   * Write a session object to cookies (matching @supabase/ssr format).
   * Call this after successful sign-in on docs/reader pages.
   *
   * @param {object} session — the Supabase session object (or full auth token object)
   */
  function syncToCookies(session) {
    var key = getStorageKey();
    if (!key || !session) return;

    var value = typeof session === "string" ? session : JSON.stringify(session);

    // First, clear any existing chunks for this key
    deleteChunks(key);

    // Write new chunks
    var chunks = createChunks(key, value);
    for (var i = 0; i < chunks.length; i++) {
      setCookie(chunks[i].name, chunks[i].value);
    }

    touchLastActive(true);

    console.log("[auth-sync] Session synced to cookies (" + chunks.length + " chunk(s))");
  }

  /**
   * Write a session object to localStorage (matching vanilla @supabase/supabase-js format).
   * Call this after successful sign-in on Next.js pages.
   *
   * @param {object} session — the Supabase session object
   */
  function syncToLocalStorage(session) {
    var key = getStorageKey();
    if (!key || !session) return;

    try {
      var value = typeof session === "string" ? session : JSON.stringify(session);
      localStorage.setItem(key, value);
      touchLastActive(true);
      console.log("[auth-sync] Session synced to localStorage");
    } catch (e) {
      console.warn("[auth-sync] Could not write to localStorage:", e);
    }
  }

  /**
   * Clear all auth cookies (key + all chunks).
   */
  function clearCookies() {
    var key = getStorageKey();
    if (!key) return;
    deleteChunks(key);
    console.log("[auth-sync] Auth cookies cleared");
  }

  /**
   * Clear all auth entries from localStorage and sessionStorage.
   */
  function clearLocalStorage() {
    var ref = getRef();
    if (!ref) return;
    var prefix = "sb-" + ref + "-";

    function removeFrom(store) {
      if (!store) return;
      var keys = [];
      for (var i = 0; i < store.length; i++) {
        var k = store.key(i);
        if (k && k.indexOf(prefix) === 0) keys.push(k);
      }
      for (var j = 0; j < keys.length; j++) {
        store.removeItem(keys[j]);
      }
    }

    removeFrom(window.localStorage);
    removeFrom(window.sessionStorage);
    console.log("[auth-sync] Auth localStorage/sessionStorage cleared");
  }

  /**
   * Clear auth from BOTH cookies and localStorage.
   * Call this on sign-out from any context.
   */
  function clearAll() {
    clearCookies();
    clearLocalStorage();
    safeRemoveLocalStorage(getLastActiveKey());
    forcedLogoutInProgress = false;
  }

  // ── Read session from cookies (reassemble chunks) ───────────

  /**
   * Read the session JSON from cookies, reassembling chunked values.
   * Returns the parsed session object, or null if no session cookie exists.
   */
  function readSessionFromCookies() {
    var key = getStorageKey();
    if (!key) return null;

    var cookies = getAllCookies();

    // Try non-chunked key first
    if (Object.prototype.hasOwnProperty.call(cookies, key)) {
      try {
        return JSON.parse(cookies[key]);
      } catch {
        return null;
      }
    }

    // Try chunked keys: key.0, key.1, ...
    var parts = [];
    for (var i = 0; i < 20; i++) {
      var chunkName = key + "." + i;
      if (!Object.prototype.hasOwnProperty.call(cookies, chunkName)) break;
      parts.push(cookies[chunkName]);
    }
    if (parts.length === 0) return null;

    try {
      return JSON.parse(parts.join(""));
    } catch {
      return null;
    }
  }

  // ── Auto-sync on page load ────────────────────────────────

  /**
   * Automatically sync sessions between cookies and localStorage on page load.
   * - If cookies have a session but localStorage doesn't → sync to localStorage
   *   (covers: user signed in on Next.js page, navigated to static page)
   * - If localStorage has a session but cookies don't → sync to cookies
   *   (covers: user signed in on static/reader page, navigated to Next.js page)
   */
  function autoSyncOnInit() {
    var hasCookies = hasSessionInCookies();
    var hasLocal = hasSessionInLocalStorage();

    if (hasCookies && !hasLocal) {
      // Cookie → localStorage: user signed in on Next.js, visiting static page
      var session = readSessionFromCookies();
      if (session) {
        syncToLocalStorage(session);
        console.log("[auth-sync] Auto-synced session from cookies → localStorage");
      }
    } else if (hasLocal && !hasCookies) {
      // localStorage → cookies: user signed in on static page, visiting Next.js
      var key = getStorageKey();
      var raw = safeGetLocalStorage(key);
      if (raw) {
        try {
          var sessionObj = JSON.parse(raw);
          syncToCookies(sessionObj);
          console.log("[auth-sync] Auto-synced session from localStorage → cookies");
        } catch {
          // Corrupted localStorage entry; skip
        }
      }
    }
  }

  // Expose as a global
  window.__authSync = {
    syncToCookies: syncToCookies,
    syncToLocalStorage: syncToLocalStorage,
    readSessionFromCookies: readSessionFromCookies,
    clearCookies: clearCookies,
    clearLocalStorage: clearLocalStorage,
    clearAll: clearAll,
    getRef: getRef,
    getStorageKey: getStorageKey,
    hasSessionInCookies: hasSessionInCookies,
    hasSessionInLocalStorage: hasSessionInLocalStorage,
    hasAnySession: hasAnySession,
    touchLastActive: touchLastActive,
    getLastActiveAt: getLastActiveAt,
    inactivityTimeoutMs: INACTIVITY_TIMEOUT_MS,
  };

  autoSyncOnInit();
  initInactivityEnforcement();

  console.log("[auth-sync] Bidirectional auth sync loaded (v3.10.0)");
})();
