import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

const DATA_URL = "data/kybalion.json";
const APP_VERSION = "1.1.0";
const STORAGE_KEY = "kybalion.tags";
const NOTES_KEY = "kybalion.notes";
const NOTES_GUEST_KEY = "kybalion.notes.guest";

const contentEl = document.getElementById("content");
const tocListEl = document.getElementById("tocList");
const searchInput = document.getElementById("searchInput");
const tagFilter = document.getElementById("tagFilter");
const togglePages = document.getElementById("togglePages");
const toggleRefs = document.getElementById("toggleRefs");
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

const state = {
  data: null,
  tags: loadTags(),
  notes: loadNotes(),
  query: "",
  tag: "",
  showPages: true,
  showRefs: true,
  auth: {
    client: null,
    user: null,
    ready: false,
    mode: "local",
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

      const tagsWrap = document.createElement("div");
      tagsWrap.className = "stanza-tags";

      const id = stanzaId(chapter.number, stanzaIndex);
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
      tagButton.addEventListener("click", () => {
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
      });
      tagsWrap.appendChild(tagButton);

      stanzaEl.append(header, text, tagsWrap);
      chapterEl.appendChild(stanzaEl);
    });

    contentEl.appendChild(chapterEl);
  });

  applyHighlights();
  renderNotes();
}

function applyHighlights() {
  if (!state.notes.length) return;
  state.notes.forEach((note) => {
    const stanzaEl = document.querySelector(`[data-stanza-ref="${note.ref}"] .stanza-text`);
    if (!stanzaEl) return;
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

    const link = document.createElement("a");
    link.href = `#${note.ref.replace(':', '-')}`;
    link.textContent = `Notes · ${note.ref}`;
    link.addEventListener("click", (event) => {
      event.preventDefault();
      const stanzaEl = document.querySelector(`[data-stanza-ref="${note.ref}"]`);
      stanzaEl?.scrollIntoView({ behavior: "smooth" });
    });

    const noteActions = document.createElement("div");
    noteActions.className = "note-actions";

    const copyBtn = document.createElement("button");
    copyBtn.type = "button";
    copyBtn.className = "note-copy";
    copyBtn.textContent = "Copy";
    copyBtn.addEventListener("click", async () => {
      const payload = `Notes · ${note.ref}\n${note.text}`;
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

    noteActions.appendChild(copyBtn);

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
    }
    updateAuthUI();
  });

  if (state.auth.user) {
    state.auth.mode = "authenticated";
    await loadNotesFromCloud();
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
  setAuthConfirmMessage("Signed in. Sync is active.");
  setAuthStep("confirm");
  setNotesVisibility(true);
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
    setAuthConfirmMessage("Account created and signed in.");
    setAuthStep("confirm");
    setNotesVisibility(true);
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
    .map((note) => `Notes · ${note.ref}\n${note.text}`)
    .join("\n\n");
  try {
    await navigator.clipboard.writeText(text);
    copyNotesBtn.textContent = "Copied!";
    setTimeout(() => {
      copyNotesBtn.textContent = "Copy Notes";
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

  const nextNotes = [...state.notes, { id: noteId, ref, text: selectedText, label: "Notes" }];
  setNotes(nextNotes);
  syncNotesToCloud();
  selection.removeAllRanges();
}

function applyFilters() {
  if (!state.data) return;
  document.querySelectorAll(".stanza").forEach((stanzaEl) => {
    const ref = stanzaEl.dataset.stanzaRef || "";
    const stanza = findStanzaByRef(ref);
    if (!stanza) return;
    stanzaEl.style.display = stanzaMatchesFilters(stanza) ? "block" : "none";
  });
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
    render();

    searchInput?.addEventListener("input", (event) => {
      state.query = normalize(event.target.value || "");
      applyFilters();
    });

    tagFilter?.addEventListener("change", (event) => {
      state.tag = event.target.value;
      applyFilters();
    });

    togglePages?.addEventListener("change", (event) => {
      state.showPages = event.target.checked;
      render();
    });

    toggleRefs?.addEventListener("change", (event) => {
      state.showRefs = event.target.checked;
      render();
    });

    saveNoteBtn?.addEventListener("click", saveSelectionAsNote);
    if (toggleNotesBtn) {
      toggleNotesBtn.setAttribute("aria-expanded", "false");
      toggleNotesBtn.setAttribute("aria-controls", "notesModal");
      toggleNotesBtn.addEventListener("click", toggleNotesPanel);
    }
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
