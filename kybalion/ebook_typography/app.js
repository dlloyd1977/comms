const DATA_URL = "data/kybalion.json";
const APP_VERSION = "1.1.0";
const STORAGE_KEY = "kybalion.tags";
const NOTES_KEY = "kybalion.notes";

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

const state = {
  data: null,
  tags: loadTags(),
  notes: loadNotes(),
  query: "",
  tag: "",
  showPages: true,
  showRefs: true,
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

    const text = document.createElement("p");
    text.className = "note-text";
    text.textContent = note.text;

    card.append(link, text);
    notesList.appendChild(card);
  });
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

  state.notes.push({ id: noteId, ref, text: selectedText, label: "Notes" });
  saveNotes(state.notes);
  renderNotes();
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

    printBtn?.addEventListener("click", () => window.print());
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    if (contentEl) {
      contentEl.innerHTML = `<div class="loading">Error loading book data: ${message}</div>`;
    }
  }
}

init();
