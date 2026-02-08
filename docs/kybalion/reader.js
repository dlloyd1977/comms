import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Signal to fallback-reader.js that the module loaded successfully
window.__readerModuleLoaded = true;
console.log("[reader.js] Module loaded");

const DATA_URL = "data/kybalion.json";
const APP_VERSION = "3.2.0";
const STORAGE_KEY = "kybalion.tags";
const NOTES_KEY = "kybalion.notes";
const NOTES_GUEST_KEY = "kybalion.notes.guest";
const PREFS_KEY = "kybalion.preferences";
const LAYOUT_KEY = "kybalion.layout.controls";
const LAYOUT_POS_KEY = "kybalion.layout.positions";
function getAdminEmails() {
  return (document.body?.dataset.adminEmails || "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

const contentEl = document.getElementById("content");
const tocListEl = document.getElementById("tocList");
const standardTocListEl = document.getElementById("standardTocList");
const searchInput = document.getElementById("searchInput");
const tagFilter = document.getElementById("tagFilter");
const togglePages = document.getElementById("togglePages");
const toggleRefs = document.getElementById("toggleRefs");
const searchBtn = document.getElementById("searchBtn");
const viewModeStandardBtn = document.getElementById("viewModeStandardBtn");
const viewModeStanzaBtn = document.getElementById("viewModeStanzaBtn");

const layoutEditBtn = document.getElementById("layoutEditBtn");
const layoutResetBtn = document.getElementById("layoutResetBtn");
const saveNoteBtn = document.getElementById("saveNoteBtn");
const toggleNotesBtn = document.getElementById("toggleNotesBtn");
const notesModal = document.getElementById("notesModal");
const closeNotesBtn = document.getElementById("closeNotesBtn");
const copyNotesBtn = document.getElementById("copyNotesBtn");
const notesList = document.getElementById("notesList");
const appVersionEl = document.getElementById("appVersion");
const authOpenBtn = document.getElementById("authOpenBtn");
const authFlow = document.getElementById("authFlow");
const authChoiceSignInBtn = document.getElementById("authChoiceSignInBtn");
const authChoiceSignUpBtn = document.getElementById("authChoiceSignUpBtn");
const authChoiceGuestBtn = document.getElementById("authChoiceGuestBtn");
const authChoiceCloseBtn = document.getElementById("authChoiceCloseBtn");
const authEmail = document.getElementById("authEmail");
const authPassword = document.getElementById("authPassword");
const authSignUpEmail = document.getElementById("authSignUpEmail");
const authSignUpPassword = document.getElementById("authSignUpPassword");
const authSignUpFirstName = document.getElementById("authSignUpFirstName");
const authSignUpLastName = document.getElementById("authSignUpLastName");
const authSignInBtn = document.getElementById("authSignInBtn");
const authSignUpBtn = document.getElementById("authSignUpBtn");
const authSignOutBtn = document.getElementById("authSignOutBtn");
const authGuestBtn = document.getElementById("authGuestBtn");
const authBackFromSignInBtn = document.getElementById("authBackFromSignInBtn");
const authBackFromSignUpBtn = document.getElementById("authBackFromSignUpBtn");
const authBackFromGuestBtn = document.getElementById("authBackFromGuestBtn");
const authResetPasswordBtn = document.getElementById("authResetPasswordBtn");
const authResetEmail = document.getElementById("authResetEmail");
const authSendResetBtn = document.getElementById("authSendResetBtn");
const authBackFromResetBtn = document.getElementById("authBackFromResetBtn");
const authNewPassword = document.getElementById("authNewPassword");
const authSetNewPasswordBtn = document.getElementById("authSetNewPasswordBtn");
const authBackFromNewPasswordBtn = document.getElementById("authBackFromNewPasswordBtn");
const authConfirmBtn = document.getElementById("authConfirmBtn");
const authConfirmMessage = document.getElementById("authConfirmMessage");
const authStatus = document.getElementById("authStatus");
const authWarning = document.getElementById("authWarning");
const notesContent = document.getElementById("notesContent");
const authPanel = document.getElementById("authPanel");
const notesTitle = document.getElementById("notesTitle");
const userDisplay = document.getElementById("userDisplay");
const headerSignOutBtn = document.getElementById("headerSignOutBtn");
const headerProfileBtn = document.getElementById("headerProfileBtn");
const annotationModal = document.getElementById("annotationModal");
const annotationInput = document.getElementById("annotationInput");
const annotationCloseBtn = document.getElementById("annotationCloseBtn");
const annotationRef = document.getElementById("annotationRef");
const annotationStatus = document.getElementById("annotationStatus");
const annotationCount = document.getElementById("annotationCount");
const typographyView = document.getElementById("typographyView");
const standardView = document.getElementById("standardView");
const standardContent = document.getElementById("standardContent");
const standardSaveHighlightBtn = document.getElementById("standardSaveHighlightBtn");
const menuBtn = document.getElementById("menuBtn");
const menuPanel = document.getElementById("menuPanel");
const adminMenuLinks = document.querySelectorAll(".menu-link.admin-only");
const docsMenuLinks = document.querySelectorAll(".menu-link");
const menuWrapper = menuBtn?.closest(".menu-wrapper") || null;
const menuAuthLink = document.getElementById("menuAuthLink");
const menuSessionsBtn = document.getElementById("menuSessionsBtn");
const menuSessionsFlyout = document.getElementById("menuSessionsFlyout");
const membersTable = document.body?.dataset?.membersTable || "active_members";
const standardAddTagBtn = document.getElementById("standardAddTagBtn");
const standardAnnotateBtn = document.getElementById("standardAnnotateBtn");
const standardViewNotesBtn = document.getElementById("standardViewNotesBtn");
const standardTools = document.getElementById("standardTools");
const notesActions = document.querySelector(".notes-actions");
const togglePagesWrap = togglePages?.closest?.(".toggle") || null;
const toggleRefsWrap = toggleRefs?.closest?.(".toggle") || null;

let defaultLayoutOrder = [];
let defaultLayoutPositions = null;
let dragItem = null;
let dragState = null;
let layoutPositions = {};
let layoutResizeObserver = null;

const preferences = loadPreferences();

const state = {
  data: null,
  tags: loadTags(),
  notes: loadNotes(),
  query: preferences.query || "",
  tag: preferences.tag || "",
  showPages: preferences.showPages ?? true,
  showRefs: preferences.showRefs ?? true,
  viewMode: preferences.viewMode || "standard",
  auth: {
    client: null,
    user: null,
    ready: false,
    mode: "local",
    url: "",
    broadcastChannel: null,
  },
  access: {
    activeMember: false,
  },
  annotation: {
    ref: "",
    id: "",
    timer: null,
  },
};

if (appVersionEl) {
  appVersionEl.textContent = APP_VERSION;
}

function updateStickyOffsets() {
  const header = document.querySelector(".page-header");
  if (!header) return;
  const rect = header.getBoundingClientRect();
  const base = Math.ceil(rect.height);
  const offset = Math.max(120, base + 12);
  document.documentElement.style.setProperty("--header-offset", `${offset}px`);
}

function getUserEmail(user) {
  return (
    user?.email ||
    user?.user_metadata?.email ||
    user?.identities?.[0]?.identity_data?.email ||
    ""
  ).toLowerCase();
}

function isAdminUser(user) {
  const email = getUserEmail(user);
  if (!email) return false;
  return getAdminEmails().includes(email);
}

function updateLayoutAdminUI() {
  const isAdmin = isAdminUser(state.auth.user);
  [layoutEditBtn, layoutResetBtn].forEach((btn) => {
    if (!btn) return;
    btn.classList.toggle("is-hidden", !isAdmin);
    btn.setAttribute("aria-hidden", String(!isAdmin));
  });
  if (!isAdmin) {
    setLayoutEditing(false);
  }
}

function updateMenuAdminUI() {
  const isAdmin = isAdminUser(state.auth.user);
  adminMenuLinks.forEach((link) => {
    link.classList.toggle("is-hidden", !isAdmin);
    link.setAttribute("aria-hidden", String(!isAdmin));
  });
}

function updateDocsMenuAccess() {
  const isGuest = state.auth.mode === "guest";
  const canView = state.access.activeMember || isAdminUser(state.auth.user);

  // For guests: show menu but gray out (disable) all links
  if (isGuest) {
    docsMenuLinks.forEach((link) => {
      if (link.classList.contains("admin-only")) {
        link.classList.add("is-hidden");
        link.setAttribute("aria-hidden", "true");
      } else {
        link.classList.remove("is-hidden");
        link.setAttribute("aria-hidden", "false");
        link.classList.add("is-disabled");
        link.setAttribute("aria-disabled", "true");
        link.setAttribute("tabindex", "-1");
      }
    });
    if (menuWrapper) {
      menuWrapper.classList.remove("is-hidden");
    }
    return;
  }

  // Non-guest: restore normal link state
  docsMenuLinks.forEach((link) => {
    if (!link.classList.contains("admin-only")) {
      link.classList.toggle("is-hidden", !canView);
      link.setAttribute("aria-hidden", String(!canView));
      link.classList.remove("is-disabled");
      link.removeAttribute("aria-disabled");
      link.removeAttribute("tabindex");
    }
  });
  if (menuWrapper) {
    menuWrapper.classList.toggle("is-hidden", !canView);
  }
  if (!canView) {
    setMenuOpen(false);
  }
}

async function refreshMemberAccess() {
  if (!state.auth.client || !state.auth.user) {
    state.access.activeMember = false;
    updateDocsMenuAccess();
    return;
  }
  const email = getUserEmail(state.auth.user);
  if (!email) {
    state.access.activeMember = false;
    updateDocsMenuAccess();
    return;
  }
  const { data, error } = await state.auth.client
    .from(membersTable)
    .select("active")
    .eq("email", email)
    .maybeSingle();
  state.access.activeMember = Boolean(data?.active) && !error;
  updateDocsMenuAccess();
}

function setMenuOpen(open) {
  if (!menuBtn || !menuPanel) return;
  menuPanel.classList.toggle("is-hidden", !open);
  menuBtn.setAttribute("aria-expanded", String(open));
}

function getLayoutContainer() {
  return document.querySelector(".controls");
}

function getLayoutItems() {
  const container = getLayoutContainer();
  if (!container) return [];
  return Array.from(container.querySelectorAll(":scope > [data-layout-key]"));
}

function getLayoutPositionsFromDom() {
  const container = getLayoutContainer();
  if (!container) return {};
  const containerRect = container.getBoundingClientRect();
  const positions = {};

  getLayoutItems().forEach((item) => {
    const key = item.dataset.layoutKey;
    if (!key) return;
    const rect = item.getBoundingClientRect();
    positions[key] = {
      left: Math.max(0, Math.round(rect.left - containerRect.left)),
      top: Math.round(rect.top - containerRect.top),
      width: Math.max(80, Math.round(rect.width)),
      height: Math.max(40, Math.round(rect.height)),
    };
  });

  return positions;
}

function loadLayoutPositions() {
  try {
    const raw = localStorage.getItem(LAYOUT_POS_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

// Admin layout persistence to Supabase
const ADMIN_LAYOUT_TABLE = "kybalion_layout";

async function saveAdminLayout() {
  if (!state.auth.client || !isAdminUser(state.auth.user)) return;
  
  const positions = getLayoutPositionsFromDom();
  const order = getLayoutItems().map((el) => el.dataset.layoutKey).filter(Boolean);
  
  const layoutData = {
    id: 1,
    positions: positions,
    order: order,
    updated_at: new Date().toISOString(),
    updated_by: getUserEmail(state.auth.user),
  };

  const { error } = await state.auth.client
    .from(ADMIN_LAYOUT_TABLE)
    .upsert(layoutData, { onConflict: "id" });

  if (error) {
    console.error("Failed to save admin layout:", error.message);
  } else {
    console.log("Admin layout saved to database");
  }
}

async function loadAdminLayout() {
  if (!state.auth.client) return null;
  
  const { data, error } = await state.auth.client
    .from(ADMIN_LAYOUT_TABLE)
    .select("positions, order")
    .eq("id", 1)
    .maybeSingle();

  if (error) {
    console.log("No admin layout found or error:", error.message);
    return null;
  }
  
  return data;
}

async function applyAdminLayoutFromDatabase() {
  const adminLayout = await loadAdminLayout();
  if (adminLayout) {
    console.log("Loading admin layout from database");
    if (adminLayout.order?.length) {
      applyLayoutOrder(adminLayout.order);
      localStorage.setItem(LAYOUT_KEY, JSON.stringify(adminLayout.order));
    }
    if (adminLayout.positions && Object.keys(adminLayout.positions).length) {
      layoutPositions = adminLayout.positions;
      applyLayoutPositions(adminLayout.positions);
      localStorage.setItem(LAYOUT_POS_KEY, JSON.stringify(adminLayout.positions));
    }
  } else {
    console.log("No admin layout in database, using localStorage");
  }
}

function saveLayoutPositions() {
  const positions = getLayoutPositionsFromDom();
  layoutPositions = positions;
  localStorage.setItem(LAYOUT_POS_KEY, JSON.stringify(positions));
  updateLayoutContainerHeight();
  
  // If admin, also save to Supabase
  if (isAdminUser(state.auth.user)) {
    saveAdminLayout();
  }
}

function applyLayoutPositions(positions) {
  if (!document.body) return;
  const container = getLayoutContainer();
  if (!container) return;

  document.body.classList.add("layout-freeform");

  getLayoutItems().forEach((item) => {
    const key = item.dataset.layoutKey;
    if (!key) return;
    const pos = positions[key] || defaultLayoutPositions?.[key];
    if (!pos) return;
    item.style.left = `${pos.left}px`;
    item.style.top = `${pos.top}px`;
    item.style.width = `${pos.width}px`;
    item.style.height = `${pos.height}px`;
  });

  updateLayoutContainerHeight();
}

function clearLayoutPositions() {
  layoutPositions = {};
  localStorage.removeItem(LAYOUT_POS_KEY);
  document.body?.classList.remove("layout-freeform");
  const container = getLayoutContainer();
  if (container) {
    container.style.minHeight = "";
  }
  getLayoutItems().forEach((item) => {
    item.style.removeProperty("left");
    item.style.removeProperty("top");
    item.style.removeProperty("width");
    item.style.removeProperty("height");
  });
}

function updateLayoutContainerHeight() {
  const container = getLayoutContainer();
  if (!container) return;
  let maxBottom = 0;
  getLayoutItems().forEach((item) => {
    const top = parseFloat(item.style.top || "0");
    const height = parseFloat(item.style.height || `${item.getBoundingClientRect().height}`);
    maxBottom = Math.max(maxBottom, top + height);
  });
  if (maxBottom > 0) {
    container.style.minHeight = `${Math.ceil(maxBottom + 12)}px`;
  }
}

function applyLayoutOrder(order) {
  const container = getLayoutContainer();
  if (!container || !Array.isArray(order) || !order.length) return;
  const items = getLayoutItems();
  const byKey = new Map(items.map((el) => [el.dataset.layoutKey, el]));

  order.forEach((key) => {
    const el = byKey.get(key);
    if (el) container.appendChild(el);
  });

  items.forEach((el) => {
    if (!order.includes(el.dataset.layoutKey)) {
      container.appendChild(el);
    }
  });
}

function loadLayoutOrder() {
  try {
    const raw = localStorage.getItem(LAYOUT_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveLayoutOrder() {
  const order = getLayoutItems().map((el) => el.dataset.layoutKey).filter(Boolean);
  localStorage.setItem(LAYOUT_KEY, JSON.stringify(order));
  
  // If admin, also save to Supabase
  if (isAdminUser(state.auth.user)) {
    saveAdminLayout();
  }
}

function setLayoutEditing(enabled) {
  if (!document.body) return;
  if (enabled && !isAdminUser(state.auth.user)) {
    return;
  }
  document.body.classList.toggle("layout-editing", enabled);
  if (layoutEditBtn) {
    layoutEditBtn.classList.toggle("is-active", enabled);
    layoutEditBtn.textContent = enabled ? "Exit layout edit" : "Edit layout";
  }
  if (enabled) {
    if (!Object.keys(layoutPositions).length) {
      layoutPositions = getLayoutPositionsFromDom();
      applyLayoutPositions(layoutPositions);
      saveLayoutPositions();
    }
    document.body.classList.add("layout-freeform");
    if (!layoutResizeObserver && "ResizeObserver" in window) {
      layoutResizeObserver = new ResizeObserver(() => saveLayoutPositions());
      getLayoutItems().forEach((item) => layoutResizeObserver.observe(item));
    }
  } else if (layoutResizeObserver) {
    layoutResizeObserver.disconnect();
    layoutResizeObserver = null;
    saveLayoutPositions();
  }
}

function handleLayoutPointerDown(event) {
  if (!document.body?.classList.contains("layout-editing")) return;
  const item = event.currentTarget;
  if (!item) return;
  const rect = item.getBoundingClientRect();
  const isResizeCorner =
    event.clientX > rect.right - 16 && event.clientY > rect.bottom - 16;
  if (isResizeCorner) return;

  const container = getLayoutContainer();
  if (!container) return;
  const containerRect = container.getBoundingClientRect();
  const pageHeader = container.closest(".page-header") || container;
  const headerRect = pageHeader.getBoundingClientRect();
  const startLeft = parseFloat(item.style.left || "0");
  const startTop = parseFloat(item.style.top || "0");

  dragItem = item;
  dragState = {
    startX: event.clientX,
    startY: event.clientY,
    startLeft,
    startTop,
    maxLeft: Math.max(0, containerRect.width - rect.width),
    minTop: Math.round(headerRect.top - containerRect.top),
  };

  item.classList.add("is-dragging");
  item.setPointerCapture(event.pointerId);
}

function handleLayoutPointerMove(event) {
  if (!document.body?.classList.contains("layout-editing")) return;
  if (!dragItem || !dragState) return;
  const deltaX = event.clientX - dragState.startX;
  const deltaY = event.clientY - dragState.startY;
  const nextLeft = Math.min(Math.max(0, dragState.startLeft + deltaX), dragState.maxLeft);
  const nextTop = Math.max(dragState.minTop, dragState.startTop + deltaY);
  dragItem.style.left = `${Math.round(nextLeft)}px`;
  dragItem.style.top = `${Math.round(nextTop)}px`;
  updateLayoutContainerHeight();
}

function handleLayoutPointerUp(event) {
  if (!document.body?.classList.contains("layout-editing")) return;
  if (!dragItem) return;
  dragItem.classList.remove("is-dragging");
  dragItem.releasePointerCapture?.(event.pointerId);
  dragItem = null;
  dragState = null;
  saveLayoutPositions();
}

function setDisabledState(container, disabled) {
  if (!container) return;
  container.classList.toggle("is-disabled", disabled);
  container.setAttribute("aria-disabled", String(disabled));

  const applyDisabled = (element) => {
    if (!element) return;
    if (element.matches?.("button, input, select, textarea")) {
      element.disabled = disabled;
    } else if (element.matches?.("a")) {
      element.setAttribute("tabindex", disabled ? "-1" : "0");
    }
  };

  applyDisabled(container);
  container
    .querySelectorAll("button, input, select, textarea, a")
    .forEach((el) => applyDisabled(el));
}

function getScopedKey(baseKey, userId) {
  if (userId) return `${baseKey}.${userId}`;
  return baseKey;
}

function getStorageUserId() {
  return state?.auth?.user?.id || null;
}

function loadTags(userId = null) {
  try {
    const key = getScopedKey(STORAGE_KEY, userId);
    return JSON.parse(localStorage.getItem(key) || "{}") || {};
  } catch {
    return {};
  }
}

function saveTags(tags, userId = null) {
  const scopedUserId = userId ?? getStorageUserId();
  const key = getScopedKey(STORAGE_KEY, scopedUserId);
  localStorage.setItem(key, JSON.stringify(tags));
}

function loadNotes(userId = null) {
  try {
    const key = getScopedKey(NOTES_KEY, userId);
    return JSON.parse(localStorage.getItem(key) || "[]") || [];
  } catch {
    return [];
  }
}

function saveNotes(notes, userId = null) {
  const scopedUserId = userId ?? getStorageUserId();
  const key = getScopedKey(NOTES_KEY, scopedUserId);
  localStorage.setItem(key, JSON.stringify(notes));
}

function loadGuestMode() {
  return localStorage.getItem(NOTES_GUEST_KEY) === "true";
}

function saveGuestMode(value) {
  localStorage.setItem(NOTES_GUEST_KEY, value ? "true" : "false");
}

function loadPreferences(userId = null) {
  try {
    const key = getScopedKey(PREFS_KEY, userId);
    return JSON.parse(localStorage.getItem(key) || "{}") || {};
  } catch {
    return {};
  }
}

function savePreferencesLocal() {
  const userId = getStorageUserId();
  const payload = {
    query: state.query,
    tag: state.tag,
    showPages: state.showPages,
    showRefs: state.showRefs,
    viewMode: state.viewMode,
  };
  const key = getScopedKey(PREFS_KEY, userId);
  localStorage.setItem(key, JSON.stringify(payload));
  void syncPreferencesToCloud();
}

function updateViewModeUI(mode) {
  state.viewMode = mode === "standard" ? "standard" : "typography";
  const isStandard = state.viewMode === "standard";
  if (document.body) {
    document.body.dataset.viewMode = state.viewMode;
  }
  if (viewModeStandardBtn) {
    viewModeStandardBtn.classList.toggle("is-active", isStandard);
    viewModeStandardBtn.setAttribute("aria-selected", String(isStandard));
  }
  if (viewModeStanzaBtn) {
    viewModeStanzaBtn.classList.toggle("is-active", !isStandard);
    viewModeStanzaBtn.setAttribute("aria-selected", String(!isStandard));
  }
  if (typographyView && standardView) {
    const showStandard = state.viewMode === "standard";
    typographyView.classList.toggle("is-hidden", showStandard);
    typographyView.setAttribute("aria-hidden", String(showStandard));
    standardView.classList.toggle("is-hidden", !showStandard);
    standardView.setAttribute("aria-hidden", String(!showStandard));
  }

  setDisabledState(togglePagesWrap, isStandard);
  setDisabledState(toggleRefsWrap, isStandard);
  setDisabledState(notesActions, isStandard);
  setDisabledState(standardTools, false);


}

function setViewMode(mode) {
  updateViewModeUI(mode);
  savePreferencesLocal();
}

function applyLocalStateForUser(userId) {
  const prefs = loadPreferences(userId);
  state.tags = loadTags(userId);
  state.notes = loadNotes(userId);

  state.query = typeof prefs.query === "string" ? prefs.query : "";
  state.tag = typeof prefs.tag === "string" ? prefs.tag : "";
  state.showPages = typeof prefs.showPages === "boolean" ? prefs.showPages : true;
  state.showRefs = typeof prefs.showRefs === "boolean" ? prefs.showRefs : true;
  state.viewMode = typeof prefs.viewMode === "string" ? prefs.viewMode : "standard";

  if (searchInput) searchInput.value = state.query;
  if (tagFilter) tagFilter.value = state.tag;
  if (togglePages) togglePages.checked = state.showPages;
  if (toggleRefs) toggleRefs.checked = state.showRefs;

  updateViewModeUI(state.viewMode);
  render();
  applyFilters();
}

function stanzaId(chapterNumber, stanzaIndex) {
  return `c${chapterNumber}-s${stanzaIndex}`;
}

function normalize(text) {
  return text.toLowerCase();
}

function stanzaMatchesFilters(stanza) {
  const query = state.query.trim();
  if (query) {
    const haystack = `${stanza.ref} ${stanza.text}`.toLowerCase();
    if (!haystack.includes(query)) {
      return false;
    }
  }

  if (state.tag) {
    const id = stanzaId(stanza.chapterNumber, stanza.index);
    const tags = state.tags[id] || [];
    return tags.includes(state.tag);
  }

  return true;
}


function rebuildTagFilter() {
  const tags = new Set();
  Object.values(state.tags).forEach((list) => {
    list.forEach((tag) => tags.add(tag));
  });

  const current = state.tag;
  tagFilter.innerHTML = "<option value=\"\">All tags</option>";

  Array.from(tags)
    .sort((a, b) => a.localeCompare(b))
    .forEach((tag) => {
      const option = document.createElement("option");
      option.value = tag;
      option.textContent = tag;
      tagFilter.appendChild(option);
    });

  tagFilter.value = current;
}

function render() {
  if (!state.data) return;
  contentEl.innerHTML = "";
  tocListEl.innerHTML = "";
  if (standardTocListEl) {
    standardTocListEl.innerHTML = "";
  }

  state.data.chapters.forEach((chapter) => {
    const chapterId = `chapter-${chapter.number}`;
    const standardChapterId = `standard-chapter-${chapter.number}`;

    const chapterButton = document.createElement("button");
    chapterButton.type = "button";
    chapterButton.textContent = chapter.title;
    chapterButton.dataset.chapterId = chapterId;
    chapterButton.addEventListener("click", () => {
      document.getElementById(chapterId)?.scrollIntoView({ behavior: "smooth" });
    });
    tocListEl.appendChild(chapterButton);

    if (standardTocListEl) {
      const standardButton = document.createElement("button");
      standardButton.type = "button";
      standardButton.textContent = chapter.title;
      standardButton.dataset.chapterId = standardChapterId;
      standardButton.addEventListener("click", () => {
        document.getElementById(standardChapterId)?.scrollIntoView({ behavior: "smooth" });
      });
      standardTocListEl.appendChild(standardButton);
    }

    const chapterEl = document.createElement("article");
    chapterEl.className = "chapter";
    chapterEl.id = chapterId;

    const heading = document.createElement("h2");
    heading.textContent = chapter.title;

    const meta = document.createElement("div");
    meta.className = "chapter-meta";

    const back = document.createElement("a");
    back.className = "toc-back";
    back.href = "#toc";
    back.textContent = "Back to TOC";

    const count = document.createElement("span");
    count.textContent = `${chapter.stanzas.length} stanzas`;

    meta.append(back, count);
    chapterEl.append(heading, meta);

    chapter.stanzas.forEach((stanza, index) => {
      const stanzaIndex = index + 1;
      const stanzaEl = document.createElement("section");
      stanzaEl.className = "stanza";
      stanzaEl.dataset.stanzaRef = stanza.ref;
      stanzaEl.id = stanza.ref.replace(":", "-");

      stanza.chapterNumber = chapter.number;
      stanza.index = stanzaIndex;

      if (!stanzaMatchesFilters(stanza)) {
        stanzaEl.style.display = "none";
      }

      const header = document.createElement("div");
      header.className = "stanza-header";

      const ref = document.createElement("span");
      ref.className = "stanza-ref";
      ref.textContent = stanza.ref;
      ref.style.display = state.showRefs ? "inline" : "none";

      const page = document.createElement("span");
      page.className = "page-number";
      if (stanza.page) {
        page.textContent = `p. ${stanza.page}`;
        page.style.display = state.showPages ? "inline" : "none";
      } else {
        page.style.display = "none";
      }

      header.append(ref, page);

      const text = document.createElement("p");
      text.className = "stanza-text";
      text.textContent = stanza.text;

      const id = stanzaId(chapter.number, stanzaIndex);
      const tagsWrap = createTagsWrap(id, stanza.ref);

      stanzaEl.append(header, text, tagsWrap);
      chapterEl.appendChild(stanzaEl);
    });

    contentEl.appendChild(chapterEl);
  });

  applyHighlights();
  applySearchHighlights();
  renderNotes();
  renderStandardView();
}

function getSelectedStanzaRef() {
  const selection = window.getSelection();
  if (!selection || selection.isCollapsed) return null;
  const range = selection.getRangeAt(0);
  const stanzaEl = range.startContainer?.parentElement?.closest?.(".stanza");
  if (!stanzaEl || !stanzaEl.contains(range.endContainer)) {
    return null;
  }
  return stanzaEl.dataset.stanzaRef || null;
}

function editTagsForRef(ref) {
  const stanza = findStanzaByRef(ref);
  if (!stanza) return;
  const id = stanzaId(stanza.chapterNumber, stanza.index);
  const currentTags = (state.tags[id] || []).join(", ");
  const next = window.prompt("Enter tags (comma-separated):", currentTags);
  if (next === null) return;
  const cleaned = next
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
  state.tags[id] = cleaned;
  saveTags(state.tags);
  rebuildTagFilter();
  render();
}

function createTagsWrap(id, ref) {
  const tagsWrap = document.createElement("div");
  tagsWrap.className = "stanza-tags";

  const tags = state.tags[id] || [];
  tags.forEach((tag) => {
    const tagEl = document.createElement("span");
    tagEl.className = "tag";
    tagEl.textContent = tag;
    tagsWrap.appendChild(tagEl);
  });

  const tagButton = document.createElement("button");
  tagButton.type = "button";
  tagButton.className = "tag-button";
  tagButton.textContent = tags.length ? "Edit tags" : "Add tag";
  tagButton.addEventListener("click", () => editTagsForRef(ref));
  tagsWrap.appendChild(tagButton);

  const annotateButton = document.createElement("button");
  annotateButton.type = "button";
  annotateButton.className = "tag-button";
  annotateButton.textContent = "Annotate";
  annotateButton.addEventListener("click", () => {
    openAnnotationModal(ref);
  });
  tagsWrap.appendChild(annotateButton);

  return tagsWrap;
}

function renderStandardView() {
  if (!state.data || !standardContent) return;
  standardContent.innerHTML = "";

  state.data.chapters.forEach((chapter) => {
    const chapterEl = document.createElement("article");
    chapterEl.className = "standard-chapter";
    chapterEl.id = `standard-chapter-${chapter.number}`;

    const title = document.createElement("h2");
    title.className = "standard-chapter-title";
    title.textContent = chapter.title;
    chapterEl.appendChild(title);

    chapter.stanzas.forEach((stanza, index) => {
      const stanzaIndex = index + 1;
      const stanzaEl = document.createElement("section");
      stanzaEl.className = "stanza standard-stanza";
      stanzaEl.dataset.stanzaRef = stanza.ref;
      stanzaEl.id = `standard-${stanza.ref.replace(":", "-")}`;

      stanza.chapterNumber = chapter.number;
      stanza.index = stanzaIndex;

      if (!stanzaMatchesFilters(stanza)) {
        stanzaEl.style.display = "none";
      }

      const text = document.createElement("p");
      text.className = "stanza-text";
      text.textContent = stanza.text;

      stanzaEl.append(text);
      chapterEl.appendChild(stanzaEl);
    });

    standardContent.appendChild(chapterEl);
  });
}

function escapeRegExp(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function clearSearchHighlights() {
  document.querySelectorAll(".search-highlight").forEach((mark) => {
    const text = document.createTextNode(mark.textContent || "");
    mark.replaceWith(text);
  });
}

function applySearchHighlights() {
  clearSearchHighlights();
  const query = state.query.trim();
  if (!query) return;
  const keywords = query.split(/\s+/).filter(Boolean);
  if (!keywords.length) return;
  const pattern = keywords.map((word) => escapeRegExp(word)).join("|");
  const regex = new RegExp(pattern, "gi");

  document.querySelectorAll(".stanza").forEach((stanzaEl) => {
    if (stanzaEl.style.display === "none") return;
    const textEl = stanzaEl.querySelector(".stanza-text");
    if (!textEl) return;

    const walker = document.createTreeWalker(
      textEl,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode: (node) => {
          if (!node.nodeValue || !node.nodeValue.trim()) {
            return NodeFilter.FILTER_REJECT;
          }
          if (node.parentElement?.closest(".highlight")) {
            return NodeFilter.FILTER_REJECT;
          }
          if (node.parentElement?.closest(".search-highlight")) {
            return NodeFilter.FILTER_REJECT;
          }
          return NodeFilter.FILTER_ACCEPT;
        },
      },
      false
    );

    const textNodes = [];
    while (walker.nextNode()) {
      textNodes.push(walker.currentNode);
    }

    textNodes.forEach((node) => {
      const text = node.nodeValue || "";
      regex.lastIndex = 0;
      if (!regex.test(text)) return;
      regex.lastIndex = 0;
      const fragment = document.createDocumentFragment();
      let lastIndex = 0;
      let match;
      while ((match = regex.exec(text)) !== null) {
        const start = match.index;
        if (start > lastIndex) {
          fragment.appendChild(document.createTextNode(text.slice(lastIndex, start)));
        }
        const span = document.createElement("span");
        span.className = "search-highlight";
        span.textContent = match[0];
        fragment.appendChild(span);
        lastIndex = start + match[0].length;
      }
      if (lastIndex < text.length) {
        fragment.appendChild(document.createTextNode(text.slice(lastIndex)));
      }
      node.replaceWith(fragment);
    });
  });
}

function applyHighlights() {
  if (!state.notes.length) return;
  state.notes.forEach((note) => {
    const stanzaEls = document.querySelectorAll(
      `[data-stanza-ref="${note.ref}"] .stanza-text`
    );
    stanzaEls.forEach((stanzaEl) => {
      if (stanzaEl.querySelector(`[data-note-id="${note.id}"]`)) return;
      const text = stanzaEl.textContent || "";
      const index = text.indexOf(note.text);
      if (index === -1) return;
      const before = text.slice(0, index);
      const after = text.slice(index + note.text.length);
      stanzaEl.innerHTML = "";
      if (before) {
        stanzaEl.appendChild(document.createTextNode(before));
      }
      const mark = document.createElement("span");
      mark.className = "highlight";
      mark.dataset.noteId = note.id;
      mark.textContent = note.text;
      stanzaEl.appendChild(mark);
      if (after) {
        stanzaEl.appendChild(document.createTextNode(after));
      }
    });
  });
}

function removeHighlight(noteId) {
  if (!noteId) return;
  document.querySelectorAll(`[data-note-id="${noteId}"]`).forEach((mark) => {
    const text = document.createTextNode(mark.textContent || "");
    mark.replaceWith(text);
  });
}

function renderNotes() {
  notesList.innerHTML = "";
  if (!state.notes.length) {
    const empty = document.createElement("p");
    empty.className = "note-text";
    empty.textContent = "No notes saved yet.";
    notesList.appendChild(empty);
    return;
  }

  state.notes.forEach((note) => {
    const card = document.createElement("div");
    card.className = "note-card";

    const noteLabel = note.label || "Notes";

    const link = document.createElement("a");
    link.href = `#${note.ref.replace(':', '-')}`;
    link.textContent = `${noteLabel} · ${note.ref}`;
    link.addEventListener("click", (event) => {
      event.preventDefault();
      const stanzaEl = document.querySelector(`[data-stanza-ref="${note.ref}"]`);
      stanzaEl?.scrollIntoView({ behavior: "smooth" });
    });

    const noteActions = document.createElement("div");
    noteActions.className = "note-actions";

    const deleteBtn = document.createElement("button");
    deleteBtn.type = "button";
    deleteBtn.className = "note-delete";
    deleteBtn.textContent = "Delete";
    deleteBtn.addEventListener("click", () => {
      removeHighlight(note.id);
      const nextNotes = state.notes.filter((entry) => entry.id !== note.id);
      setNotes(nextNotes);
      syncNotesToCloud();
    });

    const copyBtn = document.createElement("button");
    copyBtn.type = "button";
    copyBtn.className = "note-copy";
    copyBtn.textContent = "Copy";
    copyBtn.addEventListener("click", async () => {
      const payload = `${noteLabel} · ${note.ref}\n${note.text}`;
      try {
        await navigator.clipboard.writeText(payload);
        copyBtn.textContent = "Copied";
        setTimeout(() => {
          copyBtn.textContent = "Copy";
        }, 1200);
      } catch {
        window.alert("Unable to copy note. Please try again.");
      }
    });

    noteActions.append(deleteBtn, copyBtn);

    const text = document.createElement("p");
    text.className = "note-text";
    text.textContent = note.text;

    card.append(link, text, noteActions);
    notesList.appendChild(card);
  });
}

function setNotes(nextNotes) {
  state.notes = nextNotes;
  saveNotes(state.notes);
  renderNotes();
  applyHighlights();
}

function getSupabaseConfig() {
  const url = document.body?.dataset?.supabaseUrl || "";
  const anonKey = document.body?.dataset?.supabaseAnonKey || "";
  return { url, anonKey };
}

function clearAuthStorage(url) {
  if (!url) return;
  let ref = "";
  try {
    const host = new URL(url).host;
    ref = host.split(".")[0];
  } catch {
    ref = "";
  }

  const prefixes = ref ? [`sb-${ref}-`] : ["sb-"];
  const removeFrom = (store) => {
    if (!store) return;
    const keys = [];
    for (let i = 0; i < store.length; i += 1) {
      const key = store.key(i);
      if (!key) continue;
      if (prefixes.some((prefix) => key.startsWith(prefix))) {
        keys.push(key);
      }
    }
    keys.forEach((key) => store.removeItem(key));
  };

  removeFrom(window.localStorage);
  removeFrom(window.sessionStorage);
}

/**
 * Initialize BroadcastChannel for cross-tab session sync.
 * Falls back to storage events for older browsers.
 */
function initAuthBroadcast() {
  // BroadcastChannel for same-origin cross-tab communication
  if (typeof BroadcastChannel !== "undefined") {
    state.auth.broadcastChannel = new BroadcastChannel("kybalion_auth");
    state.auth.broadcastChannel.onmessage = (event) => {
      if (event.data?.type === "LOGOUT") {
        handleRemoteLogout();
      }
      if (event.data?.type === "LOGIN") {
        handleRemoteLogin();
      }
    };
  }

  // Fallback: listen for localStorage changes (cross-tab)
  window.addEventListener("storage", (event) => {
    if (event.key === "kybalion.logout_at" && event.newValue) {
      handleRemoteLogout();
    }
    if (event.key === "kybalion.login_at" && event.newValue) {
      handleRemoteLogin();
    }
  });

  // Re-check auth state when user returns to this tab
  document.addEventListener("visibilitychange", async () => {
    if (document.visibilityState === "visible" && state.auth.client && state.auth.ready) {
      const { data } = await state.auth.client.auth.getSession();
      const newUser = data.session?.user || null;
      const wasLoggedIn = !!state.auth.user;
      const nowLoggedIn = !!newUser;

      // Session changed while tab was hidden
      if (wasLoggedIn !== nowLoggedIn || state.auth.user?.id !== newUser?.id) {
        state.auth.user = newUser;
        if (!newUser) {
          state.auth.mode = loadGuestMode() ? "guest" : "local";
        } else {
          state.auth.mode = "authenticated";
        }
        updateAuthUI();
      }
    }
  });
}

/**
 * Broadcast logout event to other tabs.
 */
function broadcastLogout() {
  // BroadcastChannel (preferred)
  if (state.auth.broadcastChannel) {
    state.auth.broadcastChannel.postMessage({ type: "LOGOUT" });
  }
  // Storage event fallback
  localStorage.setItem("kybalion.logout_at", Date.now().toString());
}

/**
 * Broadcast login event to other tabs.
 */
function broadcastLogin() {
  if (state.auth.broadcastChannel) {
    state.auth.broadcastChannel.postMessage({ type: "LOGIN" });
  }
  localStorage.setItem("kybalion.login_at", Date.now().toString());
}

/**
 * Handle logout triggered from another tab.
 */
function handleRemoteLogout() {
  state.auth.user = null;
  state.auth.mode = loadGuestMode() ? "guest" : "local";
  clearAuthStorage(state.auth.url);
  applyLocalStateForUser(null);
  updateAuthUI();
}

/**
 * Handle login triggered from another tab - re-check session.
 */
async function handleRemoteLogin() {
  if (!state.auth.client || !state.auth.ready) return;
  const { data } = await state.auth.client.auth.getSession();
  const newUser = data.session?.user || null;
  if (newUser && newUser.id !== state.auth.user?.id) {
    state.auth.user = newUser;
    state.auth.mode = "authenticated";
    applyLocalStateForUser(newUser.id);
    await loadNotesFromCloud();
    await loadPreferencesFromCloud();
    updateAuthUI();
  }
}

function isPasswordRecoveryLink() {
  const hash = window.location.hash || "";
  return hash.includes("type=recovery");
}

function updateAuthUI() {
  if (!authStatus || !authWarning || !authSignOutBtn || !authGuestBtn) return;
  const { client, user, ready, mode } = state.auth;

  updateUserDisplay(user);
  updateStickyOffsets();
  updateLayoutAdminUI();
  updateMenuAdminUI();
  void refreshMemberAccess();

  if (!ready || !client) {
    setAuthConfirmMessage("Sync not configured. Notes are local only.");
    setAuthStep("confirm");
    setNotesVisibility(true);
    authWarning.style.display = "none";
    authSignOutBtn.style.display = "none";
    return;
  }

  if (user) {
    setAuthConfirmMessage(`Signed in as ${user.email || "user"}. Notes sync is active.`);
    setAuthStep("confirm");
    setNotesVisibility(true);
    authWarning.style.display = "none";
    authSignOutBtn.style.display = "inline-flex";
    return;
  }

  if (mode === "guest") {
    setAuthConfirmMessage("Guest mode enabled. Notes stay on this device only.");
    setAuthStep("confirm");
    setNotesVisibility(true);
    authWarning.style.display = "block";
    authSignOutBtn.style.display = "none";
    return;
  }

  setAuthStep("choice");
  setNotesVisibility(false);
  authWarning.style.display = "none";
  authSignOutBtn.style.display = "none";
}

function updateUserDisplay(user) {
  if (!userDisplay || !authOpenBtn) return;
  if (user) {
    const label = user.email || "Signed in";
    userDisplay.textContent = label;
    userDisplay.classList.remove("is-hidden");
    authOpenBtn.classList.add("is-hidden");
    authOpenBtn.setAttribute("aria-hidden", "true");
    if (headerSignOutBtn) {
      headerSignOutBtn.classList.remove("is-hidden");
    }
    if (headerProfileBtn) {
      headerProfileBtn.classList.remove("is-hidden");
    }
    // Menu auth link: show Log Out
    if (menuAuthLink) {
      menuAuthLink.textContent = "Log Out";
      menuAuthLink.removeAttribute("href");
      menuAuthLink.style.cursor = "pointer";
      menuAuthLink.onclick = async (e) => {
        e.preventDefault();
        await supabase.auth.signOut();
      };
    }
    return;
  }
  userDisplay.textContent = "";
  userDisplay.classList.add("is-hidden");
  authOpenBtn.classList.remove("is-hidden");
  authOpenBtn.setAttribute("aria-hidden", "false");
  if (headerSignOutBtn) {
    headerSignOutBtn.classList.add("is-hidden");
  }
  if (headerProfileBtn) {
    headerProfileBtn.classList.add("is-hidden");
  }
  // Menu auth link: show Sign In
  if (menuAuthLink) {
    menuAuthLink.textContent = "Sign In";
    menuAuthLink.removeAttribute("href");
    menuAuthLink.style.cursor = "pointer";
    menuAuthLink.onclick = (e) => {
      e.preventDefault();
      // Close menu panel first
      menuPanel?.classList.add("is-hidden");
      // Open notes modal with auth panel visible
      setNotesModalOpen(true);
      setNotesVisibility(false);
      setAuthPanelVisible(true);
      authEmail?.focus();
    };
  }
}

function setAuthStatus(message, type = "info") {
  if (!authStatus) return;
  authStatus.textContent = message;
  authStatus.classList.remove("is-info", "is-success", "is-error");
  authStatus.classList.add(`is-${type}`);
}

function setAuthConfirmMessage(message) {
  if (authConfirmMessage) {
    authConfirmMessage.textContent = message;
  }
  setAuthStatus(message, "info");
}

function setNotesVisibility(show) {
  if (!notesContent) return;
  notesContent.classList.toggle("is-active", show);
}

function setAuthPanelVisible(show) {
  if (!authPanel) return;
  authPanel.classList.toggle("is-hidden", !show);
  if (notesModal) {
    notesModal.classList.toggle("auth-only", show);
  }
  if (notesTitle) {
    notesTitle.textContent = show ? "Account" : "Notes";
  }
}

function setAuthStep(step) {
  if (!authFlow) return;
  authFlow.querySelectorAll(".auth-step").forEach((node) => {
    const isMatch = node.dataset.step === step;
    node.classList.toggle("is-active", isMatch);
  });
}

async function initializeSupabase() {
  const { url, anonKey } = getSupabaseConfig();
  if (!url || !anonKey) {
    state.auth.ready = false;
    updateAuthUI();
    return;
  }

  state.auth.url = url;
  if (isPasswordRecoveryLink()) {
    clearAuthStorage(url);
  }

  state.auth.client = createClient(url, anonKey);
  state.auth.ready = true;
  initAuthBroadcast();

  const { data } = await state.auth.client.auth.getSession();
  state.auth.user = data.session?.user || null;
  state.auth.mode = loadGuestMode() ? "guest" : "local";
  applyLocalStateForUser(state.auth.user?.id || null);
  updateAuthUI();

  state.auth.client.auth.onAuthStateChange((event, session) => {
    const previousUserId = state.auth.user?.id || null;
    state.auth.user = session?.user || null;
    const nextUserId = state.auth.user?.id || null;
    if (previousUserId !== nextUserId) {
      applyLocalStateForUser(nextUserId);
    }
    if (state.auth.user) {
      saveGuestMode(false);
      state.auth.mode = "authenticated";
      void loadNotesFromCloud();
      void loadPreferencesFromCloud();
    }
    if (event === "PASSWORD_RECOVERY") {
      setAuthPanelVisible(true);
      setNotesVisibility(false);
      setAuthStep("reset-password");
    }
    if (event === "SIGNED_OUT") {
      clearAuthStorage(state.auth.url);
    }
    updateAuthUI();
  });

  if (state.auth.user) {
    state.auth.mode = "authenticated";
    await loadNotesFromCloud();
    await loadPreferencesFromCloud();
  }

  // Load admin layout from database (for all users)
  await applyAdminLayoutFromDatabase();
}

async function loadPreferencesFromCloud() {
  if (!state.auth.client || !state.auth.user) return;
  const prefs = state.auth.user.user_metadata?.preferences;
  if (!prefs) return;

  if (typeof prefs.showPages === "boolean") {
    state.showPages = prefs.showPages;
    if (togglePages) togglePages.checked = state.showPages;
  }
  if (typeof prefs.showRefs === "boolean") {
    state.showRefs = prefs.showRefs;
    if (toggleRefs) toggleRefs.checked = state.showRefs;
  }
  if (typeof prefs.tag === "string") {
    state.tag = prefs.tag;
    if (tagFilter) tagFilter.value = state.tag;
  }
  if (typeof prefs.query === "string") {
    state.query = prefs.query;
    if (searchInput) searchInput.value = state.query;
  }
  if (typeof prefs.viewMode === "string") {
    state.viewMode = prefs.viewMode;
  }
  savePreferencesLocal();
  applyFilters();
  setViewMode(state.viewMode);
}

async function syncPreferencesToCloud() {
  if (!state.auth.client || !state.auth.user) return;
  const nextPrefs = {
    query: state.query,
    tag: state.tag,
    showPages: state.showPages,
    showRefs: state.showRefs,
    viewMode: state.viewMode,
  };
  const { data, error } = await state.auth.client.auth.updateUser({
    data: { preferences: nextPrefs },
  });
  if (error) {
    setAuthStatus("Unable to sync preferences. Verify profile permissions.", "error");
    return;
  }
  if (data?.user) {
    state.auth.user = data.user;
  }
}

async function loadNotesFromCloud() {
  if (!state.auth.client || !state.auth.user) return;
  const { data, error } = await state.auth.client
    .from("notes")
    .select("id, ref, text, label")
    .eq("user_id", state.auth.user.id)
    .order("id", { ascending: true });

  if (error) {
    setAuthStatus("Unable to load cloud notes. Verify the notes table and RLS policies.", "error");
    return;
  }

  const remoteNotes = Array.isArray(data) ? data : [];
  if (!remoteNotes.length && state.notes.length) {
    await syncNotesToCloud();
    return;
  }

  const merged = new Map();
  state.notes.forEach((note) => merged.set(note.id, note));
  remoteNotes.forEach((note) => merged.set(note.id, note));
  setNotes(Array.from(merged.values()));
}

async function syncNotesToCloud() {
  if (!state.auth.client || !state.auth.user) return;
  const payload = state.notes.map((note) => ({
    id: note.id,
    user_id: state.auth.user.id,
    ref: note.ref,
    text: note.text,
    label: note.label || "Notes",
  }));
  if (!payload.length) return;
  const { error } = await state.auth.client.from("notes").upsert(payload, { onConflict: "id" });
  if (error) {
    setAuthStatus("Unable to sync notes. Verify the notes table and RLS policies.", "error");
  }
}

async function handleSignIn() {
  if (!state.auth.client) return;
  const email = authEmail?.value?.trim();
  const password = authPassword?.value || "";
  if (!email || !password) {
    setAuthStatus("Enter both email and password.", "error");
    return;
  }
  setAuthStatus("Signing in...", "info");
  const { error } = await state.auth.client.auth.signInWithPassword({ email, password });
  if (error) {
    let message = error.message;
    if (message.toLowerCase().includes("invalid login credentials")) {
      message = "Invalid credentials. Confirm your email first or reset your password.";
    } else if (message.toLowerCase().includes("email not confirmed")) {
      message = "Email not confirmed. Check your inbox for the confirmation link.";
    }
    setAuthStatus(message, "error");
    return;
  }
  broadcastLogin();
  setNotesModalOpen(false);
  setAuthPanelVisible(false);
}

async function handleSetNewPassword() {
  if (!state.auth.client) return;
  const nextPassword = authNewPassword?.value || "";
  if (!nextPassword) {
    setAuthStatus("Enter a new password.", "error");
    return;
  }
  setAuthStatus("Updating password...", "info");
  const { error } = await state.auth.client.auth.updateUser({ password: nextPassword });
  if (error) {
    setAuthStatus(error.message, "error");
    return;
  }
  clearAuthStorage(state.auth.url);
  await state.auth.client.auth.signOut({ scope: "global" });
  window.history.replaceState({}, document.title, window.location.pathname + window.location.search);
  setAuthConfirmMessage("Password updated. Please sign in again.");
  setAuthStep("signin");
}

async function handleResetPassword() {
  if (!state.auth.client) return;
  const email = authResetEmail?.value?.trim();
  if (!email) {
    setAuthStatus("Enter your email address.", "error");
    return;
  }
  setAuthStatus("Sending reset link...", "info");
  const { error } = await state.auth.client.auth.resetPasswordForEmail(email, {
    redirectTo: window.location.origin + window.location.pathname,
  });
  if (error) {
    setAuthStatus(error.message, "error");
    return;
  }
  setAuthConfirmMessage("Password reset link sent. Check your email.");
  setAuthStep("confirm");
  setNotesVisibility(false);
}

async function handleSignUp() {
  if (!state.auth.client) return;
  const firstName = authSignUpFirstName?.value?.trim();
  const lastName = authSignUpLastName?.value?.trim();
  const email = authSignUpEmail?.value?.trim();
  const password = authSignUpPassword?.value || "";
  if (!firstName || !lastName) {
    setAuthStatus("First name and last name are required.", "error");
    return;
  }
  if (!email || !password) {
    setAuthStatus("Enter both email and password.", "error");
    return;
  }
  const { data, error } = await state.auth.client.auth.signUp({
    email,
    password,
    options: {
      data: { first_name: firstName, last_name: lastName },
      emailRedirectTo: "https://comms.davidelloyd.com/kybalion/"
    }
  });
  if (error) {
    setAuthStatus(error.message, "error");
    return;
  }
  if (data.session) {
    setNotesModalOpen(false);
    setAuthPanelVisible(false);
  } else {
    setAuthConfirmMessage("Account created. Check your email to confirm, then sign in.");
    setAuthStep("confirm");
    setNotesVisibility(false);
  }
}

async function handleSignOut() {
  if (!state.auth.client) return;
  await state.auth.client.auth.signOut({ scope: "global" });
  state.auth.user = null;
  state.auth.mode = "local";
  clearAuthStorage(state.auth.url);
  broadcastLogout();
  applyLocalStateForUser(null);
  updateAuthUI();
  setAuthConfirmMessage("Signed out. Notes are local only.");
}

async function handleHeaderSignOut() {
  if (!state.auth.client) return;
  savePreferencesLocal();
  await syncNotesToCloud();
  await syncPreferencesToCloud();
  await handleSignOut();
}

function handleGuestMode() {
  saveGuestMode(true);
  state.auth.mode = "guest";
  updateAuthUI();
  setAuthConfirmMessage("Guest mode enabled. Notes stay on this device only.");
  setAuthStep("confirm");
  setNotesVisibility(true);
}

function setNotesModalOpen(open) {
  if (!notesModal) return;
  notesModal.classList.toggle("active", open);
  notesModal.setAttribute("aria-hidden", String(!open));
  if (!toggleNotesBtn) return;
  toggleNotesBtn.textContent = open ? "Hide Notes" : "View Notes";
  toggleNotesBtn.setAttribute("aria-expanded", String(open));
  toggleNotesBtn.setAttribute("aria-controls", "notesModal");
}

function toggleNotesPanel() {
  if (!notesModal) return;
  const isOpen = notesModal.classList.contains("active");
  if (!isOpen) {
    setAuthPanelVisible(false);
    setNotesVisibility(true);
  }
  setNotesModalOpen(!isOpen);
}

async function copyNotesToClipboard() {
  if (!copyNotesBtn) return;
  if (!state.notes.length) {
    window.alert("No notes to copy yet.");
    return;
  }
  const text = state.notes
    .map((note) => `${note.label || "Notes"} · ${note.ref}\n${note.text}`)
    .join("\n\n");
  try {
    await navigator.clipboard.writeText(text);
    copyNotesBtn.textContent = "Copied!";
    setTimeout(() => {
      copyNotesBtn.textContent = "Copy All Notes";
    }, 1500);
  } catch {
    window.alert("Unable to copy notes. Please try again.");
  }
}

function saveSelectionAsNote() {
  const selection = window.getSelection();
  if (!selection || selection.isCollapsed) return;
  const range = selection.getRangeAt(0);
  const stanzaEl = range.startContainer?.parentElement?.closest?.(".stanza");
  if (!stanzaEl || !stanzaEl.contains(range.endContainer)) {
    window.alert("Please select text within a single stanza.");
    return;
  }

  const selectedText = selection.toString().trim();
  if (!selectedText) return;

  const noteId = `note-${Date.now()}`;
  const ref = stanzaEl.dataset.stanzaRef || "";

  const highlight = document.createElement("span");
  highlight.className = "highlight";
  highlight.dataset.noteId = noteId;
  highlight.textContent = selectedText;

  try {
    range.deleteContents();
    range.insertNode(highlight);
  } catch {
    window.alert("Unable to highlight that selection. Please try a shorter selection.");
    return;
  }

  const nextNotes = [...state.notes, { id: noteId, ref, text: selectedText, label: "Highlight" }];
  setNotes(nextNotes);
  syncNotesToCloud();
  selection.removeAllRanges();
}

function addAnnotationNote(ref) {
  return;
}

function openAnnotationModal(ref) {
  if (!annotationModal || !annotationInput || !annotationRef) return;
  const existing = state.notes.find(
    (note) => note.ref === ref && note.label === "Annotation"
  );
  state.annotation.ref = ref;
  state.annotation.id = existing?.id || "";
  annotationInput.value = existing?.text || "";
  annotationRef.textContent = ref ? `Stanza ${ref}` : "Stanza";
  updateAnnotationCount();
  setAnnotationStatus("Saved.");
  annotationModal.classList.add("active");
  annotationModal.setAttribute("aria-hidden", "false");
  annotationInput.focus();
}

function closeAnnotationModal() {
  if (!annotationModal) return;
  annotationModal.classList.remove("active");
  annotationModal.setAttribute("aria-hidden", "true");
  state.annotation.ref = "";
  state.annotation.id = "";
  if (state.annotation.timer) {
    clearTimeout(state.annotation.timer);
    state.annotation.timer = null;
  }
}

function setAnnotationStatus(message) {
  if (annotationStatus) {
    annotationStatus.textContent = message;
  }
}

function updateAnnotationCount() {
  if (!annotationInput || !annotationCount) return;
  const length = annotationInput.value.length;
  annotationCount.textContent = `${length} / 500`;
}

function saveAnnotation() {
  const ref = state.annotation.ref;
  if (!ref || !annotationInput) return;
  const trimmed = annotationInput.value.trim();
  if (!trimmed) {
    if (state.annotation.id) {
      const nextNotes = state.notes.filter((entry) => entry.id !== state.annotation.id);
      setNotes(nextNotes);
      syncNotesToCloud();
      state.annotation.id = "";
    }
    setAnnotationStatus("Saved.");
    return;
  }

  if (trimmed.length > 500) {
    setAnnotationStatus("Keep annotations to 500 characters.");
    return;
  }

  if (state.annotation.id) {
    const nextNotes = state.notes.map((entry) =>
      entry.id === state.annotation.id
        ? { ...entry, text: trimmed, label: "Annotation" }
        : entry
    );
    setNotes(nextNotes);
  } else {
    const noteId = `note-${Date.now()}`;
    const nextNotes = [...state.notes, { id: noteId, ref, text: trimmed, label: "Annotation" }];
    state.annotation.id = noteId;
    setNotes(nextNotes);
  }
  syncNotesToCloud();
  setAnnotationStatus("Saved.");
}

function scheduleAnnotationSave() {
  if (state.annotation.timer) {
    clearTimeout(state.annotation.timer);
  }
  setAnnotationStatus("Saving...");
  state.annotation.timer = setTimeout(() => {
    saveAnnotation();
    state.annotation.timer = null;
  }, 500);
}

function applyFilters() {
  if (!state.data) return;
  document.querySelectorAll(".stanza").forEach((stanzaEl) => {
    const ref = stanzaEl.dataset.stanzaRef || "";
    const stanza = findStanzaByRef(ref);
    if (!stanza) return;
    stanzaEl.style.display = stanzaMatchesFilters(stanza) ? "block" : "none";
  });
  document.querySelectorAll(".chapter").forEach((chapterEl) => {
    const hasVisibleStanza = Array.from(
      chapterEl.querySelectorAll(".stanza")
    ).some((stanzaEl) => stanzaEl.style.display !== "none");
    chapterEl.style.display = hasVisibleStanza ? "block" : "none";
  });
  document.querySelectorAll(".standard-chapter").forEach((chapterEl) => {
    const hasVisibleStanza = Array.from(
      chapterEl.querySelectorAll(".stanza")
    ).some((stanzaEl) => stanzaEl.style.display !== "none");
    chapterEl.style.display = hasVisibleStanza ? "block" : "none";
  });
  document.querySelectorAll(".toc-list button").forEach((tocButton) => {
    const chapterId = tocButton.dataset.chapterId;
    if (!chapterId) return;
    const chapterEl = document.getElementById(chapterId);
    if (!chapterEl) return;
    tocButton.style.display = chapterEl.style.display === "none" ? "none" : "block";
  });
  applySearchHighlights();
}

function runSearch() {
  state.query = normalize(searchInput?.value || "");
  applyFilters();
  savePreferencesLocal();
}

function findStanzaByRef(ref) {
  if (!state.data) return null;
  for (const chapter of state.data.chapters) {
    const stanza = chapter.stanzas.find((s) => s.ref === ref);
    if (stanza) {
      return {
        ...stanza,
        chapterNumber: chapter.number,
        index: chapter.stanzas.indexOf(stanza) + 1,
      };
    }
  }
  return null;
}

async function init() {
  try {
    const response = await fetch(DATA_URL, { cache: "no-store" });
    if (!response.ok) {
      throw new Error(`Failed to load data (${response.status})`);
    }
    state.data = await response.json();

    rebuildTagFilter();
    if (tagFilter) {
      tagFilter.value = state.tag;
    }
    if (togglePages) {
      togglePages.checked = state.showPages;
    }
    if (toggleRefs) {
      toggleRefs.checked = state.showRefs;
    }
    if (viewModeStandardBtn && viewModeStanzaBtn) {
      const isStandard = state.viewMode === "standard";
      viewModeStandardBtn.classList.toggle("is-active", isStandard);
      viewModeStandardBtn.setAttribute("aria-selected", String(isStandard));
      viewModeStanzaBtn.classList.toggle("is-active", !isStandard);
      viewModeStanzaBtn.setAttribute("aria-selected", String(!isStandard));
    }
    render();
    setViewMode(state.viewMode);
    updateLayoutAdminUI();

    const layoutContainer = getLayoutContainer();
    if (layoutContainer) {
      defaultLayoutOrder = getLayoutItems()
        .map((el) => el.dataset.layoutKey)
        .filter(Boolean);
      defaultLayoutPositions = getLayoutPositionsFromDom();

      // Load from localStorage initially (admin layout loaded later via initializeSupabase)
      const savedOrder = loadLayoutOrder();
      if (savedOrder.length) {
        applyLayoutOrder(savedOrder);
      }

      layoutPositions = loadLayoutPositions();
      if (Object.keys(layoutPositions).length) {
        applyLayoutPositions(layoutPositions);
      }

      getLayoutItems().forEach((item) => {
        item.addEventListener("pointerdown", handleLayoutPointerDown);
        item.addEventListener("pointermove", handleLayoutPointerMove);
        item.addEventListener("pointerup", handleLayoutPointerUp);
        item.addEventListener("pointercancel", handleLayoutPointerUp);
      });
    }

    layoutEditBtn?.addEventListener("click", () => {
      const enabled = document.body?.classList.contains("layout-editing");
      setLayoutEditing(!enabled);
    });

    layoutResetBtn?.addEventListener("click", () => {
      if (!defaultLayoutOrder.length) return;
      clearLayoutPositions();
      applyLayoutOrder(defaultLayoutOrder);
      saveLayoutOrder();
      setLayoutEditing(false);
    });

    if (searchInput) {
      searchInput.value = state.query;
      searchInput.addEventListener("input", () => {
        if (!searchInput.value.trim() && state.query) {
          state.query = "";
          applyFilters();
          savePreferencesLocal();
        }
      });
      searchInput.addEventListener("keydown", (event) => {
        if (event.key === "Enter") {
          event.preventDefault();
          runSearch();
        }
      });
    }
    searchBtn?.addEventListener("click", runSearch);

    tagFilter?.addEventListener("change", (event) => {
      state.tag = event.target.value;
      applyFilters();
      savePreferencesLocal();
    });

    togglePages?.addEventListener("change", (event) => {
      state.showPages = event.target.checked;
      render();
      savePreferencesLocal();
    });

    toggleRefs?.addEventListener("change", (event) => {
      state.showRefs = event.target.checked;
      render();
      savePreferencesLocal();
    });
    standardSaveHighlightBtn?.addEventListener("click", saveSelectionAsNote);
    standardAddTagBtn?.addEventListener("click", () => {
      const ref = getSelectedStanzaRef();
      if (!ref) {
        window.alert("Select text within a stanza first.");
        return;
      }
      editTagsForRef(ref);
    });
    standardAnnotateBtn?.addEventListener("click", () => {
      const ref = getSelectedStanzaRef();
      if (!ref) {
        window.alert("Select text within a stanza first.");
        return;
      }
      openAnnotationModal(ref);
    });
    standardViewNotesBtn?.addEventListener("click", toggleNotesPanel);
    viewModeStandardBtn?.addEventListener("click", () => setViewMode("standard"));
    viewModeStanzaBtn?.addEventListener("click", () => setViewMode("typography"));

    saveNoteBtn?.addEventListener("click", saveSelectionAsNote);
    if (toggleNotesBtn) {
      toggleNotesBtn.setAttribute("aria-expanded", "false");
      toggleNotesBtn.setAttribute("aria-controls", "notesModal");
      toggleNotesBtn.addEventListener("click", toggleNotesPanel);
    }
    annotationInput?.addEventListener("input", () => {
      updateAnnotationCount();
      scheduleAnnotationSave();
    });
    annotationCloseBtn?.addEventListener("click", () => {
      saveAnnotation();
      closeAnnotationModal();
    });
    annotationModal?.addEventListener("click", (event) => {
      if (event.target === annotationModal) {
        saveAnnotation();
        closeAnnotationModal();
      }
    });
    headerSignOutBtn?.addEventListener("click", handleHeaderSignOut);

    // Profile settings
    headerProfileBtn?.addEventListener("click", openProfileModal);
    initProfileModal();

    // authOpenBtn: intercept click to open inline auth panel (works in iframe/Simple Browser)
    authOpenBtn?.addEventListener("click", (e) => {
      e.preventDefault();
      setNotesModalOpen(true);
      setNotesVisibility(false);
      setAuthPanelVisible(true);
      authEmail?.focus();
    });
    if (menuBtn && menuPanel) {
      menuBtn.addEventListener("click", (event) => {
        event.stopPropagation();
        const isOpen = !menuPanel.classList.contains("is-hidden");
        setMenuOpen(!isOpen);
      });
      menuPanel.addEventListener("click", (event) => {
        event.stopPropagation();
      });
      document.addEventListener("click", () => {
        setMenuOpen(false);
        if (menuSessionsFlyout) menuSessionsFlyout.classList.add("is-hidden");
      });
      document.addEventListener("keydown", (event) => {
        if (event.key === "Escape") {
          setMenuOpen(false);
          if (menuSessionsFlyout) menuSessionsFlyout.classList.add("is-hidden");
        }
      });
    }

    // Sessions flyout sub-menu
    if (menuSessionsBtn && menuSessionsFlyout) {
      let sessionsTimer = null;
      const sessionsWrapper = menuSessionsBtn.closest(".menu-sessions-wrapper");

      menuSessionsBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        menuSessionsFlyout.classList.toggle("is-hidden");
      });

      if (sessionsWrapper) {
        sessionsWrapper.addEventListener("mouseenter", () => {
          clearTimeout(sessionsTimer);
          menuSessionsFlyout.classList.remove("is-hidden");
        });
        sessionsWrapper.addEventListener("mouseleave", () => {
          sessionsTimer = setTimeout(() => menuSessionsFlyout.classList.add("is-hidden"), 200);
        });
      }
      menuSessionsFlyout.addEventListener("mouseenter", () => clearTimeout(sessionsTimer));
      menuSessionsFlyout.addEventListener("mouseleave", () => {
        sessionsTimer = setTimeout(() => menuSessionsFlyout.classList.add("is-hidden"), 200);
      });
    }

    closeNotesBtn?.addEventListener("click", () => setNotesModalOpen(false));
    notesModal?.addEventListener("click", (event) => {
      // Only close on backdrop click if auth panel is NOT showing
      // This prevents accidental closes when users are entering credentials
      const authPanelVisible = authPanel && !authPanel.classList.contains("is-hidden");
      if (event.target === notesModal && !authPanelVisible) {
        setNotesModalOpen(false);
      }
    });
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        setNotesModalOpen(false);
      }
    });
    copyNotesBtn?.addEventListener("click", copyNotesToClipboard);
    authSignInBtn?.addEventListener("click", handleSignIn);
    authSignUpBtn?.addEventListener("click", handleSignUp);
    authSignOutBtn?.addEventListener("click", handleSignOut);
    authGuestBtn?.addEventListener("click", handleGuestMode);
    authChoiceSignInBtn?.addEventListener("click", () => setAuthStep("signin"));
    authChoiceSignUpBtn?.addEventListener("click", () => setAuthStep("signup"));
    authChoiceGuestBtn?.addEventListener("click", () => setAuthStep("guest"));
    authChoiceCloseBtn?.addEventListener("click", () => {
      setNotesModalOpen(false);
      setAuthPanelVisible(false);
    });
    authResetPasswordBtn?.addEventListener("click", () => {
      // Pre-populate reset email from sign-in form if available
      if (authEmail?.value?.trim() && authResetEmail) {
        authResetEmail.value = authEmail.value.trim();
      }
      setAuthStep("reset");
    });
    authSendResetBtn?.addEventListener("click", handleResetPassword);
    authSetNewPasswordBtn?.addEventListener("click", handleSetNewPassword);
    authBackFromSignInBtn?.addEventListener("click", () => setAuthStep("choice"));
    authBackFromSignUpBtn?.addEventListener("click", () => setAuthStep("choice"));
    authBackFromGuestBtn?.addEventListener("click", () => setAuthStep("choice"));
    authBackFromResetBtn?.addEventListener("click", () => setAuthStep("signin"));
    authBackFromNewPasswordBtn?.addEventListener("click", () => setAuthStep("signin"));
    authConfirmBtn?.addEventListener("click", () => {
      setNotesVisibility(true);
      setAuthPanelVisible(false);
    });

    // ── Invite card: force new-tab behaviour (Safari fallback) ──
    document.querySelectorAll(".invite-card").forEach((card) => {
      card.addEventListener("click", (e) => {
        e.preventDefault();
        const url = card.href || card.closest("a")?.href;
        if (url) window.open(url, "_blank", "noopener,noreferrer");
      });
    });

    await initializeSupabase();

    updateStickyOffsets();
    if (document.fonts?.ready) {
      document.fonts.ready.then(() => updateStickyOffsets());
    }
    const headerEl = document.querySelector(".page-header");
    if (headerEl && "ResizeObserver" in window) {
      const headerObserver = new ResizeObserver(() => updateStickyOffsets());
      headerObserver.observe(headerEl);
    }
    window.addEventListener("resize", () => {
      updateStickyOffsets();
    });


  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    if (contentEl) {
      contentEl.innerHTML = `<div class="loading">Error loading book data: ${message}</div>`;
    }
  }
}

// ── Profile Settings Modal ──

const profileModal = document.getElementById("profileModal");
const profileForm = document.getElementById("profileForm");
const profileCloseBtn = document.getElementById("profileCloseBtn");
const profileCancelBtn = document.getElementById("profileCancelBtn");
const profileStatus = document.getElementById("profileStatus");
const profileFirstName = document.getElementById("profileFirstName");
const profileLastName = document.getElementById("profileLastName");
const profileEmail = document.getElementById("profileEmail");
const profileNickname = document.getElementById("profileNickname");
const profileMiddleInitial = document.getElementById("profileMiddleInitial");
const profilePhone = document.getElementById("profilePhone");
const profileAddress = document.getElementById("profileAddress");

function setProfileStatus(msg, type = "info") {
  if (!profileStatus) return;
  profileStatus.textContent = msg;
  profileStatus.className = `profile-status is-${type}`;
}

async function loadProfileData() {
  if (!state.auth.client || !state.auth.user) return;
  const email = getUserEmail(state.auth.user);
  if (!email) return;

  if (profileEmail) profileEmail.value = email;

  const { data, error } = await state.auth.client
    .from(membersTable)
    .select("first_name, last_name, nickname, middle_initial, phone, address")
    .eq("email", email)
    .maybeSingle();

  if (error || !data) {
    setProfileStatus("Could not load profile.", "error");
    return;
  }

  if (profileFirstName) profileFirstName.value = data.first_name || "";
  if (profileLastName) profileLastName.value = data.last_name || "";
  if (profileNickname) profileNickname.value = data.nickname || "";
  if (profileMiddleInitial) profileMiddleInitial.value = data.middle_initial || "";
  if (profilePhone) profilePhone.value = data.phone || "";
  if (profileAddress) profileAddress.value = data.address || "";
  setProfileStatus("");
}

async function saveProfileData(e) {
  e.preventDefault();
  if (!state.auth.client || !state.auth.user) return;
  const email = getUserEmail(state.auth.user);
  if (!email) return;

  const firstName = profileFirstName?.value?.trim();
  const lastName = profileLastName?.value?.trim();
  if (!firstName || !lastName) {
    setProfileStatus("First name and last name are required.", "error");
    return;
  }

  setProfileStatus("Saving…", "info");

  const updates = {
    first_name: firstName,
    last_name: lastName,
    nickname: profileNickname?.value?.trim() || null,
    middle_initial: profileMiddleInitial?.value?.trim() || null,
    phone: profilePhone?.value?.trim() || null,
    address: profileAddress?.value?.trim() || null,
  };

  const { error } = await state.auth.client
    .from(membersTable)
    .update(updates)
    .eq("email", email);

  if (error) {
    setProfileStatus(`Save failed: ${error.message}`, "error");
    return;
  }

  setProfileStatus("Profile saved.", "success");
  setTimeout(() => closeProfileModal(), 1200);
}

function openProfileModal() {
  if (!profileModal) return;
  profileModal.classList.remove("is-hidden");
  profileModal.setAttribute("aria-hidden", "false");
  loadProfileData();
}

function closeProfileModal() {
  if (!profileModal) return;
  profileModal.classList.add("is-hidden");
  profileModal.setAttribute("aria-hidden", "true");
  setProfileStatus("");
}

function initProfileModal() {
  if (!profileModal) return;
  profileForm?.addEventListener("submit", saveProfileData);
  profileCloseBtn?.addEventListener("click", closeProfileModal);
  profileCancelBtn?.addEventListener("click", closeProfileModal);
  profileModal.querySelector(".profile-modal-backdrop")?.addEventListener("click", closeProfileModal);
  profileModal.addEventListener("click", (event) => {
    if (event.target === profileModal) {
      closeProfileModal();
    }
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !profileModal.classList.contains("is-hidden")) {
      closeProfileModal();
    }
  });
}

init();
