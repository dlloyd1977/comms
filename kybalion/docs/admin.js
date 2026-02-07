import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const body = document.body;
const supabaseUrl = body.dataset.supabaseUrl;
const supabaseAnonKey = body.dataset.supabaseAnonKey;
const adminEmails = (body.dataset.adminEmails || "")
  .split(",")
  .map((email) => email.trim().toLowerCase())
  .filter(Boolean);
const docsBucket = body.dataset.docsBucket || "kybalion-docs";
const docsPrefix = body.dataset.docsPrefix || "";
const membersTable = body.dataset.membersTable || "active_members";

const DOCS_LAYOUT_KEY = "kybalion.docs.layout.order";
const DOCS_LAYOUT_POS_KEY = "kybalion.docs.layout.positions";

// Header elements
const authOpenBtn = document.getElementById("authOpenBtn");
const userDisplay = document.getElementById("userDisplay");
const headerSignOutBtn = document.getElementById("headerSignOutBtn");
const headerUploadBtn = document.getElementById("headerUploadBtn");
const headerNewFolderBtn = document.getElementById("headerNewFolderBtn");
const uploadInput = document.getElementById("uploadInput");
const uploadStatus = document.getElementById("uploadStatus");

// Content elements
const docTableBody = document.querySelector(".doc-table tbody");
const docsContent = document.querySelector("[data-docs-content]");
const accessGate = document.getElementById("accessGate");
const emptyState = document.getElementById("emptyState");

// Auth modal elements
let authModal = null;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ── Layout editing state ──
const DOCS_LAYOUT_TABLE = "kybalion_layout";
const DOCS_LAYOUT_ROW_ID = 2; // id=1 is main page, id=2 is docs header
let layoutEditBtn = null;
let layoutResetBtn = null;
let defaultLayoutOrder = [];
let defaultLayoutPositions = null;
let layoutPositions = {};
let layoutResizeObserver = null;
let dragItem = null;
let dragState = null;
let currentIsAdmin = false;

// Utility functions
const formatTimestamp = (date) =>
  date.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

const formatFileSize = (bytes) => {
  if (!bytes && bytes !== 0) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const getUserEmail = (user) => (user?.email || "").toLowerCase();

// ── Layout editing helpers ──

function getLayoutContainer() {
  return document.querySelector(".header-actions");
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
      top: Math.max(0, Math.round(rect.top - containerRect.top)),
      width: Math.max(80, Math.round(rect.width)),
      height: Math.max(36, Math.round(rect.height)),
    };
  });
  return positions;
}

function loadLayoutPositions() {
  try {
    const raw = localStorage.getItem(DOCS_LAYOUT_POS_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function saveLayoutPositions() {
  const positions = getLayoutPositionsFromDom();
  layoutPositions = positions;
  localStorage.setItem(DOCS_LAYOUT_POS_KEY, JSON.stringify(positions));
  updateLayoutContainerHeight();
  // If admin, also persist to Supabase for all members
  if (currentIsAdmin) {
    saveDocsAdminLayout();
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
  localStorage.removeItem(DOCS_LAYOUT_POS_KEY);
  document.body?.classList.remove("layout-freeform");
  const container = getLayoutContainer();
  if (container) container.style.minHeight = "";
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
    const raw = localStorage.getItem(DOCS_LAYOUT_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveLayoutOrder() {
  const order = getLayoutItems().map((el) => el.dataset.layoutKey).filter(Boolean);
  localStorage.setItem(DOCS_LAYOUT_KEY, JSON.stringify(order));
  // If admin, also persist to Supabase for all members
  if (currentIsAdmin) {
    saveDocsAdminLayout();
  }
}

// ── Supabase layout persistence (shared with all members) ──

async function saveDocsAdminLayout() {
  if (!currentIsAdmin) return;
  const user = await getCurrentUser();
  if (!user) return;

  const positions = getLayoutPositionsFromDom();
  const order = getLayoutItems().map((el) => el.dataset.layoutKey).filter(Boolean);

  const layoutData = {
    id: DOCS_LAYOUT_ROW_ID,
    positions: positions,
    order: order,
    updated_at: new Date().toISOString(),
    updated_by: getUserEmail(user),
  };

  const { error } = await supabase
    .from(DOCS_LAYOUT_TABLE)
    .upsert(layoutData, { onConflict: "id" });

  if (error) {
    console.error("Failed to save docs admin layout:", error.message);
  } else {
    console.log("Docs admin layout saved to database");
  }
}

async function loadDocsAdminLayout() {
  const { data, error } = await supabase
    .from(DOCS_LAYOUT_TABLE)
    .select("positions, order")
    .eq("id", DOCS_LAYOUT_ROW_ID)
    .maybeSingle();

  if (error) {
    console.log("No docs admin layout found or error:", error.message);
    return null;
  }

  return data;
}

async function applyDocsAdminLayoutFromDatabase() {
  const adminLayout = await loadDocsAdminLayout();
  if (adminLayout) {
    console.log("Loading docs admin layout from database");
    if (adminLayout.order?.length) {
      applyLayoutOrder(adminLayout.order);
      localStorage.setItem(DOCS_LAYOUT_KEY, JSON.stringify(adminLayout.order));
    }
    if (adminLayout.positions && Object.keys(adminLayout.positions).length) {
      layoutPositions = adminLayout.positions;
      applyLayoutPositions(adminLayout.positions);
      localStorage.setItem(DOCS_LAYOUT_POS_KEY, JSON.stringify(adminLayout.positions));
    }
  } else {
    console.log("No docs admin layout in database, using localStorage");
  }
}

async function resetDocsAdminLayout() {
  if (!currentIsAdmin) return;
  const user = await getCurrentUser();
  if (!user) return;

  const { error } = await supabase
    .from(DOCS_LAYOUT_TABLE)
    .delete()
    .eq("id", DOCS_LAYOUT_ROW_ID);

  if (error) {
    console.error("Failed to reset docs admin layout:", error.message);
  } else {
    console.log("Docs admin layout reset in database");
  }
}

function setLayoutEditing(enabled) {
  if (!document.body) return;
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
  const isResizeCorner = event.clientX > rect.right - 16 && event.clientY > rect.bottom - 16;
  if (isResizeCorner) return;
  const container = getLayoutContainer();
  if (!container) return;
  const containerRect = container.getBoundingClientRect();
  const startLeft = parseFloat(item.style.left || "0");
  const startTop = parseFloat(item.style.top || "0");
  dragItem = item;
  dragState = {
    startX: event.clientX,
    startY: event.clientY,
    startLeft,
    startTop,
    maxLeft: Math.max(0, containerRect.width - rect.width),
    maxTop: Math.max(0, containerRect.height - rect.height),
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
  const nextTop = Math.min(Math.max(0, dragState.startTop + deltaY), dragState.maxTop);
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

/**
 * Inject data-layout-key attributes and Edit / Reset buttons into the docs header.
 */
function initDocsLayoutUI() {
  const container = getLayoutContainer();
  if (!container) return;

  // Assign data-layout-key to each actionable child
  const keyMap = [
    { selector: "a[href='../']", key: "back" },
    { selector: "a[href='/kybalion/']", key: "home" },
    { selector: "#authOpenBtn", key: "auth" },
    { selector: "#userDisplay", key: "user" },
    { selector: "#headerSignOutBtn", key: "signout" },
    { selector: "#headerUploadBtn", key: "upload" },
    { selector: "#headerNewFolderBtn", key: "newfolder" },
  ];
  keyMap.forEach(({ selector, key }) => {
    const el = container.querySelector(selector);
    if (el) el.dataset.layoutKey = key;
  });

  // Create Edit layout button
  layoutEditBtn = document.createElement("button");
  layoutEditBtn.className = "button secondary is-hidden";
  layoutEditBtn.type = "button";
  layoutEditBtn.id = "layoutEditBtn";
  layoutEditBtn.textContent = "Edit layout";
  container.appendChild(layoutEditBtn);

  // Create Reset layout button
  layoutResetBtn = document.createElement("button");
  layoutResetBtn.className = "button secondary is-hidden";
  layoutResetBtn.type = "button";
  layoutResetBtn.id = "layoutResetBtn";
  layoutResetBtn.textContent = "Reset layout";
  container.appendChild(layoutResetBtn);

  // Capture default order before any saved layout is applied
  defaultLayoutOrder = getLayoutItems().map((el) => el.dataset.layoutKey).filter(Boolean);
  defaultLayoutPositions = getLayoutPositionsFromDom();

  // Restore saved layout
  const savedOrder = loadLayoutOrder();
  if (savedOrder.length) applyLayoutOrder(savedOrder);
  layoutPositions = loadLayoutPositions();
  if (Object.keys(layoutPositions).length) applyLayoutPositions(layoutPositions);

  // Attach drag handlers
  getLayoutItems().forEach((item) => {
    item.addEventListener("pointerdown", handleLayoutPointerDown);
    item.addEventListener("pointermove", handleLayoutPointerMove);
    item.addEventListener("pointerup", handleLayoutPointerUp);
    item.addEventListener("pointercancel", handleLayoutPointerUp);
  });

  // Button event listeners
  layoutEditBtn.addEventListener("click", () => {
    const isEditing = document.body.classList.contains("layout-editing");
    setLayoutEditing(!isEditing);
  });

  layoutResetBtn.addEventListener("click", () => {
    if (!defaultLayoutOrder.length) return;
    clearLayoutPositions();
    applyLayoutOrder(defaultLayoutOrder);
    localStorage.setItem(DOCS_LAYOUT_KEY, JSON.stringify(defaultLayoutOrder));
    localStorage.removeItem(DOCS_LAYOUT_POS_KEY);
    setLayoutEditing(false);
    // Also clear from Supabase so all members see the reset
    resetDocsAdminLayout();
  });
}

function updateDocsLayoutAdminUI(isAdmin) {
  currentIsAdmin = isAdmin;
  [layoutEditBtn, layoutResetBtn].forEach((btn) => {
    if (!btn) return;
    btn.classList.toggle("is-hidden", !isAdmin);
    btn.setAttribute("aria-hidden", String(!isAdmin));
  });
  if (!isAdmin) setLayoutEditing(false);
}

const getCurrentUser = async () => {
  const { data } = await supabase.auth.getSession();
  return data?.session?.user || null;
};

// Member and admin state
const getActiveMember = async (user) => {
  if (!user) return null;
  const email = getUserEmail(user);
  if (!email) return null;
  const { data, error } = await supabase
    .from(membersTable)
    .select("status, group")
    .eq("email", email)
    .maybeSingle();
  if (error) return null;
  return data?.status === "active" ? data : null;
};

const setUIState = (user, member) => {
  const email = getUserEmail(user);
  const isSignedIn = Boolean(email);
  const isActive = Boolean(member);
  // Check admin from database group OR from hardcoded admin emails list
  const isAdmin = (member?.group === "admin") || (isSignedIn && adminEmails.includes(email));

  console.log("setUIState:", { email, isSignedIn, isActive, isAdmin, memberGroup: member?.group, adminEmails });

  // User display
  if (userDisplay) {
    userDisplay.textContent = email ? `Signed in as ${email}` : "";
    userDisplay.classList.toggle("is-hidden", !isSignedIn);
  }

  // Auth button (show when not signed in)
  if (authOpenBtn) {
    authOpenBtn.classList.toggle("is-hidden", isSignedIn);
  }

  // Sign out button (show when signed in)
  if (headerSignOutBtn) {
    headerSignOutBtn.classList.toggle("is-hidden", !isSignedIn);
  }

  // Upload button (show only for admins)
  if (headerUploadBtn) {
    headerUploadBtn.classList.toggle("is-hidden", !isAdmin);
    console.log("headerUploadBtn visibility:", !isAdmin ? "hidden" : "visible");
  }

  // New folder button (show only for admins)
  if (headerNewFolderBtn) {
    headerNewFolderBtn.classList.toggle("is-hidden", !isAdmin);
  }

  // Layout editing buttons (show only for admins)
  updateDocsLayoutAdminUI(isAdmin);

  // Content visibility (show for active members)
  if (docsContent) {
    docsContent.classList.toggle("is-hidden", !isActive);
  }

  // Access gate (show when not active member)
  if (accessGate) {
    accessGate.classList.toggle("is-hidden", isActive);
  }

  return { isSignedIn, isActive, isAdmin };
};

const updateMemberAccess = async (user) => {
  const member = await getActiveMember(user);
  const { isActive } = setUIState(user, member);
  
  if (isActive) {
    await loadDocsFromBucket();
  }

  // Load admin layout from database for all users (so admin changes apply to everyone)
  await applyDocsAdminLayoutFromDatabase();
};

// Document loading
const appendRow = ({ name, modified, size, url, isFolder }) => {
  if (!docTableBody) return;

  const row = document.createElement("tr");
  const icon = isFolder ? "📁" : "";
  row.innerHTML = `
    <td><a class="doc-link" href="${url}">${icon} ${name}</a></td>
    <td>${modified}</td>
    <td>David Lloyd</td>
    <td>${size}</td>
  `;
  docTableBody.appendChild(row);
};

const loadDocsFromBucket = async () => {
  if (!docTableBody) return;

  const { data: files, error } = await supabase.storage
    .from(docsBucket)
    .list(docsPrefix || "", { sortBy: { column: "created_at", order: "desc" } });

  if (error) {
    console.error("Failed to load docs:", error.message);
    return;
  }

  docTableBody.innerHTML = "";
  let fileCount = 0;

  for (const file of files) {
    const isFolder = !file.metadata;
    
    if (isFolder) {
      // It's a folder - show it
      appendRow({
        name: file.name,
        modified: "—",
        size: "—",
        url: `#folder-${file.name}`,
        isFolder: true,
      });
      fileCount++;
    } else {
      // It's a file
      const { data: publicUrlData } = supabase.storage
        .from(docsBucket)
        .getPublicUrl(`${docsPrefix}${file.name}`);

      const modified = file.updated_at
        ? formatTimestamp(new Date(file.updated_at))
        : "—";

      appendRow({
        name: file.name,
        modified,
        size: formatFileSize(file.metadata?.size),
        url: publicUrlData.publicUrl,
        isFolder: false,
      });
      fileCount++;
    }
  }

  if (emptyState) {
    emptyState.classList.toggle("is-hidden", fileCount > 0);
  }
};

// Auth modal
const createAuthModal = () => {
  if (authModal) return authModal;

  authModal = document.createElement("div");
  authModal.className = "auth-modal is-hidden";
  authModal.innerHTML = `
    <div class="auth-modal-backdrop"></div>
    <div class="auth-modal-content panel">
      <h2>Admin Sign In</h2>
      <form class="auth-form" id="authModalForm">
        <label>
          Email
          <input type="email" id="authModalEmail" autocomplete="email" required />
        </label>
        <label>
          Password
          <input type="password" id="authModalPassword" autocomplete="current-password" required />
        </label>
        <p class="auth-status" id="authModalStatus"></p>
        <div class="auth-actions">
          <button class="button secondary" type="button" id="authModalCancel">Cancel</button>
          <button class="button primary" type="submit">Sign in</button>
        </div>
      </form>
    </div>
  `;
  document.body.appendChild(authModal);

  const form = authModal.querySelector("#authModalForm");
  const cancelBtn = authModal.querySelector("#authModalCancel");
  const backdrop = authModal.querySelector(".auth-modal-backdrop");

  const closeModal = () => authModal.classList.add("is-hidden");

  cancelBtn.addEventListener("click", closeModal);
  backdrop.addEventListener("click", closeModal);

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = authModal.querySelector("#authModalEmail").value.trim();
    const password = authModal.querySelector("#authModalPassword").value;
    const status = authModal.querySelector("#authModalStatus");

    status.textContent = "Signing in…";
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      status.textContent = `Sign-in failed: ${error.message}`;
    } else {
      status.textContent = "Signed in.";
      form.reset();
      closeModal();
    }
  });

  return authModal;
};

const showAuthModal = () => {
  const modal = createAuthModal();
  modal.classList.remove("is-hidden");
  modal.querySelector("#authModalEmail")?.focus();
};

// Upload handling
const handleUpload = async () => {
  if (!uploadInput?.files?.length) return;

  const user = await getCurrentUser();
  const member = await getActiveMember(user);
  const isAdmin = member?.group === "admin" || adminEmails.includes(getUserEmail(user));

  if (!isAdmin) {
    showStatus("Admin access required to upload.");
    return;
  }

  const files = Array.from(uploadInput.files);
  const total = files.length;
  let uploaded = 0;
  let failed = 0;

  for (const file of files) {
    const fileName = file.webkitRelativePath || file.name;
    const path = `${docsPrefix}${fileName}`;
    showStatus(`Uploading ${uploaded + 1}/${total}: ${file.name}…`);

    const { error } = await supabase.storage
      .from(docsBucket)
      .upload(path, file, { upsert: true });

    if (error) {
      console.error(`Upload failed for ${file.name}:`, error.message);
      failed++;
    } else {
      uploaded++;
    }
  }

  uploadInput.value = "";

  if (failed > 0) {
    showStatus(`Uploaded ${uploaded}/${total} files. ${failed} failed. Refreshing…`);
  } else {
    showStatus(`Uploaded ${uploaded} file${uploaded !== 1 ? "s" : ""}. Refreshing…`);
  }

  setTimeout(() => window.location.reload(), 1500);
};

const showStatus = (message) => {
  if (uploadStatus) {
    uploadStatus.textContent = message;
    uploadStatus.classList.remove("is-hidden");
  }
};

// New folder handling
const handleNewFolder = async () => {
  const folderName = prompt("Enter folder name:");
  if (!folderName || !folderName.trim()) return;

  const user = await getCurrentUser();
  const member = await getActiveMember(user);
  const isAdmin = member?.group === "admin" || adminEmails.includes(getUserEmail(user));

  if (!isAdmin) {
    showStatus("Admin access required to create folders.");
    return;
  }

  // Create a placeholder file to make the folder exist
  const placeholderPath = `${docsPrefix}${folderName.trim()}/.folder`;
  showStatus(`Creating folder: ${folderName}…`);

  const { error } = await supabase.storage
    .from(docsBucket)
    .upload(placeholderPath, new Blob([""]), { upsert: true });

  if (error) {
    showStatus(`Failed to create folder: ${error.message}`);
    return;
  }

  showStatus(`Folder "${folderName}" created. Refreshing…`);
  setTimeout(() => window.location.reload(), 1000);
};

// Initialize layout editing UI
initDocsLayoutUI();

// Event listeners
if (authOpenBtn) {
  authOpenBtn.addEventListener("click", showAuthModal);
}

if (headerSignOutBtn) {
  headerSignOutBtn.addEventListener("click", async () => {
    await supabase.auth.signOut();
  });
}

if (headerUploadBtn) {
  headerUploadBtn.addEventListener("click", () => {
    uploadInput?.click();
  });
}

if (uploadInput) {
  uploadInput.addEventListener("change", handleUpload);
}

if (headerNewFolderBtn) {
  headerNewFolderBtn.addEventListener("click", handleNewFolder);
}

// Auth state changes
supabase.auth.onAuthStateChange((_event, session) => {
  void updateMemberAccess(session?.user || null);
});

// Initial load
getCurrentUser().then((user) => updateMemberAccess(user));
