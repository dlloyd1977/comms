const DATA_URL = "data/kybalion.json";
const STORAGE_KEY = "kybalion.tags";
const NOTES_KEY = "kybalion.notes";

const contentEl = document.getElementById("content");
const tocListEl = document.getElementById("tocList");
const searchInput = document.getElementById("searchInput");
const tagFilter = document.getElementById("tagFilter");
const togglePages = document.getElementById("togglePages");
const toggleRefs = document.getElementById("toggleRefs");
const printBtn = document.getElementById("printBtn");
const notesList = document.getElementById("notesList");
const clearNotesBtn = document.getElementById("clearNotesBtn");
const toggleNotesBtn = document.getElementById("toggleNotesBtn");
const notesPanel = document.getElementById("notesPanel");

const state = {
  data: null,
  tags: loadTags(),
  notes: loadNotes(),
  query: "",
  tag: "",
  showPages: true,
  showRefs: true,
  showNotes: false,
};

function showError(message) {
  const target = contentEl || document.body;
  if (!target) return;
  target.innerHTML = "";
  const box = document.createElement("div");
  box.className = "loading";
  box.textContent = `Error loading page: ${message}`;
  target.appendChild(box);
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
  if (!state.data || !contentEl || !tocListEl) return;
  contentEl.innerHTML = "";
  tocListEl.innerHTML = "";
  renderNotes();

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
}

function renderNotes() {
  if (!notesList) return;
  notesList.innerHTML = "";
  if (!state.notes.length) {
    const empty = document.createElement("div");
    empty.className = "note-empty";
    empty.textContent = "No notes yet. Highlight text to save a note.";
    notesList.appendChild(empty);
    return;
  }

  state.notes
    .slice()
    .reverse()
    .forEach((note) => {
      const card = document.createElement("div");
      card.className = "note-card";

      const meta = document.createElement("div");
      meta.className = "note-meta";
      meta.textContent = `Notes • ${note.ref}`;

      const text = document.createElement("div");
      text.className = "note-text";
      text.textContent = note.text;

      card.append(meta, text);
      notesList.appendChild(card);
    });
}

function updateNotesVisibility() {
  if (!notesPanel || !toggleNotesBtn) return;
  if (state.showNotes) {
    notesPanel.classList.add("is-visible");
    toggleNotesBtn.setAttribute("aria-expanded", "true");
  } else {
    notesPanel.classList.remove("is-visible");
    toggleNotesBtn.setAttribute("aria-expanded", "false");
  }
}

function captureHighlight(event) {
  const selection = window.getSelection();
  if (!selection || selection.isCollapsed) return;
  const range = selection.getRangeAt(0);
  const stanzaEl = range.commonAncestorContainer?.parentElement?.closest?.(".stanza");
  if (!stanzaEl) return;

  const text = selection.toString().trim();
  if (!text) return;

  const stanzaRef = stanzaEl.dataset.stanzaRef || "";
  state.notes.push({ text, ref: stanzaRef, createdAt: Date.now() });
  saveNotes(state.notes);
  renderNotes();

  const highlight = document.createElement("mark");
  highlight.className = "highlighted";
  try {
    range.surroundContents(highlight);
  } catch {
    // Ignore if selection spans multiple elements
  }
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
    if (!contentEl || !tocListEl) {
      showError("Missing page elements. Please hard refresh.");
      return;
    }

    const response = await fetch(DATA_URL, { cache: "no-store" });
    if (!response.ok) {
      throw new Error(`Data load failed (${response.status})`);
    }
    state.data = await response.json();

    rebuildTagFilter();
    render();
  } catch (error) {
    showError(error instanceof Error ? error.message : "Unknown error");
    return;
  }

  if (searchInput) {
    searchInput.addEventListener("input", (event) => {
      state.query = normalize(event.target.value || "");
      applyFilters();
    });
  }

  if (tagFilter) {
    tagFilter.addEventListener("change", (event) => {
      state.tag = event.target.value;
      applyFilters();
    });
  }

  if (togglePages) {
    togglePages.addEventListener("change", (event) => {
      state.showPages = event.target.checked;
      render();
    });
  }

  if (toggleRefs) {
    toggleRefs.addEventListener("change", (event) => {
      state.showRefs = event.target.checked;
      render();
    });
  }

  if (printBtn) {
    printBtn.addEventListener("click", () => window.print());
  }

  if (contentEl) {
    contentEl.addEventListener("mouseup", captureHighlight);
    contentEl.addEventListener("touchend", captureHighlight);
  }

  if (clearNotesBtn) {
    clearNotesBtn.addEventListener("click", () => {
      state.notes = [];
      saveNotes(state.notes);
      renderNotes();
    });
  }

  if (toggleNotesBtn) {
    toggleNotesBtn.addEventListener("click", () => {
      state.showNotes = !state.showNotes;
      updateNotesVisibility();
    });
  }

  updateNotesVisibility();
}

init();
