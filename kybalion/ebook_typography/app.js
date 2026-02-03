const DATA_URL = "data/kybalion.json";
const STORAGE_KEY = "kybalion.tags";

const contentEl = document.getElementById("content");
const tocListEl = document.getElementById("tocList");
const searchInput = document.getElementById("searchInput");
const tagFilter = document.getElementById("tagFilter");
const togglePages = document.getElementById("togglePages");
const toggleRefs = document.getElementById("toggleRefs");
const printBtn = document.getElementById("printBtn");

const state = {
  data: null,
  tags: loadTags(),
  query: "",
  tag: "",
  showPages: true,
  showRefs: true,
};

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
  const response = await fetch(DATA_URL, { cache: "no-store" });
  state.data = await response.json();

  rebuildTagFilter();
  render();

  searchInput.addEventListener("input", (event) => {
    state.query = normalize(event.target.value || "");
    applyFilters();
  });

  tagFilter.addEventListener("change", (event) => {
    state.tag = event.target.value;
    applyFilters();
  });

  togglePages.addEventListener("change", (event) => {
    state.showPages = event.target.checked;
    render();
  });

  toggleRefs.addEventListener("change", (event) => {
    state.showRefs = event.target.checked;
    render();
  });

  printBtn.addEventListener("click", () => window.print());
}

init();
