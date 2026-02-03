import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

const DATA_URL = "data/kybalion.json";
const APP_VERSION = "1.7.1";
const STORAGE_KEY = "kybalion.tags";
const NOTES_KEY = "kybalion.notes";
const NOTES_GUEST_KEY = "kybalion.notes.guest";
const PREFS_KEY = "kybalion.preferences";

const contentEl = document.getElementById("content");
const tocListEl = document.getElementById("tocList");
const searchInput = document.getElementById("searchInput");
const tagFilter = document.getElementById("tagFilter");
const togglePages = document.getElementById("togglePages");
const toggleRefs = document.getElementById("toggleRefs");
const searchBtn = document.getElementById("searchBtn");
const viewModeStandardBtn = document.getElementById("viewModeStandardBtn");
const viewModeStanzaBtn = document.getElementById("viewModeStanzaBtn");
const printBtn = document.getElementById("printBtn");
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
const authEmail = document.getElementById("authEmail");
const authPassword = document.getElementById("authPassword");
const authSignUpEmail = document.getElementById("authSignUpEmail");
const authSignUpPassword = document.getElementById("authSignUpPassword");
const authSignInBtn = document.getElementById("authSignInBtn");
const authSignUpBtn = document.getElementById("authSignUpBtn");
const authSignOutBtn = document.getElementById("authSignOutBtn");
const authGuestBtn = document.getElementById("authGuestBtn");
const authBackFromSignInBtn = document.getElementById("authBackFromSignInBtn");
const authBackFromSignUpBtn = document.getElementById("authBackFromSignUpBtn");
const authBackFromGuestBtn = document.getElementById("authBackFromGuestBtn");
const authConfirmBtn = document.getElementById("authConfirmBtn");
const authConfirmMessage = document.getElementById("authConfirmMessage");
const authStatus = document.getElementById("authStatus");
const authWarning = document.getElementById("authWarning");
const notesContent = document.getElementById("notesContent");
const authPanel = document.getElementById("authPanel");
const notesTitle = document.getElementById("notesTitle");
const userDisplay = document.getElementById("userDisplay");
const headerSignOutBtn = document.getElementById("headerSignOutBtn");
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
const standardAddTagBtn = document.getElementById("standardAddTagBtn");
const standardAnnotateBtn = document.getElementById("standardAnnotateBtn");

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

function loadTags() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}") || {};
  } catch {
    return {};
  }
}

function saveTags(tags) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tags));
}

function loadNotes() {
  try {
    return JSON.parse(localStorage.getItem(NOTES_KEY) || "[]") || [];
  } catch {
    return [];
  }
}

function saveNotes(notes) {
  localStorage.setItem(NOTES_KEY, JSON.stringify(notes));
}

function loadGuestMode() {
  return localStorage.getItem(NOTES_GUEST_KEY) === "true";
}

function saveGuestMode(value) {
  localStorage.setItem(NOTES_GUEST_KEY, value ? "true" : "false");
}

function loadPreferences() {
  try {
    return JSON.parse(localStorage.getItem(PREFS_KEY) || "{}") || {};
  } catch {
    return {};
  }
}

function savePreferencesLocal() {
  const payload = {
    query: state.query,
    tag: state.tag,
    showPages: state.showPages,
    showRefs: state.showRefs,
    viewMode: state.viewMode,
  };
  localStorage.setItem(PREFS_KEY, JSON.stringify(payload));
  void syncPreferencesToCloud();
}

function setViewMode(mode) {
  state.viewMode = mode === "standard" ? "standard" : "typography";
  const isStandard = state.viewMode === "standard";
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
    standardView.classList.toggle("is-hidden", !showStandard);
    standardView.setAttribute("aria-hidden", String(!showStandard));
  }
  savePreferencesLocal();
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

  state.data.chapters.forEach((chapter) => {
    const chapterId = `chapter-${chapter.number}`;
    const chapterButton = document.createElement("button");
    chapterButton.type = "button";
    chapterButton.textContent = chapter.title;
    chapterButton.dataset.chapterId = chapterId;
    chapterButton.addEventListener("click", () => {
      document.getElementById(chapterId)?.scrollIntoView({ behavior: "smooth" });
    });
    tocListEl.appendChild(chapterButton);

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
      standardContent.appendChild(stanzaEl);
    });
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

function updateAuthUI() {
  if (!authStatus || !authWarning || !authSignOutBtn || !authGuestBtn) return;
  const { client, user, ready, mode } = state.auth;

  updateUserDisplay(user);

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
    return;
  }
  userDisplay.textContent = "";
  userDisplay.classList.add("is-hidden");
  authOpenBtn.classList.remove("is-hidden");
  authOpenBtn.setAttribute("aria-hidden", "false");
  if (headerSignOutBtn) {
    headerSignOutBtn.classList.add("is-hidden");
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

  state.auth.client = createClient(url, anonKey);
  state.auth.ready = true;

  const { data } = await state.auth.client.auth.getSession();
  state.auth.user = data.session?.user || null;
  state.auth.mode = loadGuestMode() ? "guest" : "local";
  updateAuthUI();

  state.auth.client.auth.onAuthStateChange((_event, session) => {
    state.auth.user = session?.user || null;
    if (state.auth.user) {
      saveGuestMode(false);
      state.auth.mode = "authenticated";
      void loadNotesFromCloud();
      void loadPreferencesFromCloud();
    }
    updateAuthUI();
  });

  if (state.auth.user) {
    state.auth.mode = "authenticated";
    await loadNotesFromCloud();
    await loadPreferencesFromCloud();
  }
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
  const { error } = await state.auth.client.auth.signInWithPassword({ email, password });
  if (error) {
    setAuthStatus(error.message, "error");
    return;
  }
  setNotesModalOpen(false);
  setAuthPanelVisible(false);
}

async function handleSignUp() {
  if (!state.auth.client) return;
  const email = authSignUpEmail?.value?.trim();
  const password = authSignUpPassword?.value || "";
  if (!email || !password) {
    setAuthStatus("Enter both email and password.", "error");
    return;
  }
  const { data, error } = await state.auth.client.auth.signUp({ email, password });
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
  await state.auth.client.auth.signOut();
  state.auth.user = null;
  state.auth.mode = "local";
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
  if (!notesModal || !toggleNotesBtn) return;
  notesModal.classList.toggle("active", open);
  notesModal.setAttribute("aria-hidden", String(!open));
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
  document.querySelectorAll("#tocList button").forEach((tocButton) => {
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
    authOpenBtn?.addEventListener("click", () => {
      setAuthPanelVisible(true);
      setNotesVisibility(false);
      setAuthStep("choice");
      setNotesModalOpen(true);
    });

    closeNotesBtn?.addEventListener("click", () => setNotesModalOpen(false));
    notesModal?.addEventListener("click", (event) => {
      if (event.target === notesModal) {
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
    authBackFromSignInBtn?.addEventListener("click", () => setAuthStep("choice"));
    authBackFromSignUpBtn?.addEventListener("click", () => setAuthStep("choice"));
    authBackFromGuestBtn?.addEventListener("click", () => setAuthStep("choice"));
    authConfirmBtn?.addEventListener("click", () => {
      setNotesVisibility(true);
      setAuthPanelVisible(false);
    });

    await initializeSupabase();

    printBtn?.addEventListener("click", () => window.print());
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    if (contentEl) {
      contentEl.innerHTML = `<div class="loading">Error loading book data: ${message}</div>`;
    }
  }
}

init();
