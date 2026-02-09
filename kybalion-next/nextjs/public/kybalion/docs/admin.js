import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Signal to fallback.js that the module loaded successfully
window.__adminModuleLoaded = true;
console.log("[admin.js] Module loaded");

const body = document.body;
const supabaseUrl = body.dataset.supabaseUrl;
const supabaseAnonKey = body.dataset.supabaseAnonKey;
const adminEmails = (body.dataset.adminEmails || "")
  .split(",")
  .map((email) => email.trim().toLowerCase())
  .filter(Boolean);
const docsBucket = body.dataset.docsBucket || "kybalion-docs";
let docsPrefix = body.dataset.docsPrefix || "";
let currentPrefix = docsPrefix; // mutable — changes when navigating into sub-folders
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
const menuBtn = document.getElementById("menuBtn");
const menuPanel = document.getElementById("menuPanel");
const menuWrapper = menuBtn?.closest(".menu-wrapper") || null;
const adminMenuLinks = document.querySelectorAll(".menu-link.admin-only");
const menuAuthLink = document.getElementById("menuAuthLink");
const menuSessionsBtn = document.getElementById("menuSessionsBtn");
const menuSessionsFlyout = document.getElementById("menuSessionsFlyout");

// Move uploadInput out of header-actions so layout-freeform positioning doesn't interfere
if (uploadInput && uploadInput.parentElement) {
  document.body.appendChild(uploadInput);
}

// ── Menu toggle helper ────────────────────────────────────────
function setDocsMenuOpen(open) {
  if (!menuBtn || !menuPanel) return;
  menuPanel.classList.toggle("is-hidden", !open);
  menuBtn.setAttribute("aria-expanded", String(open));
}

// Content elements (let — re-bound after SPA navigation)
let docTableBody = document.querySelector(".doc-table tbody");
let docsContent = document.querySelector("[data-docs-content]");
let accessGate = document.getElementById("accessGate");
let emptyState = document.getElementById("emptyState");

// Auth modal elements
let authModal = null;
let moveModal = null;
let trashSection = null;
let currentAdminState = false; // tracks if current user is admin for table actions

// Cached auth state for SPA navigation re-application
let cachedUser = null;
let cachedMember = null;
let cachedIsActive = false;

// Dynamic UI elements
let docsProfileBtn = null;
let docsProfileModal = null;

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
let didDrag = false;
let currentIsAdmin = false;
let memberAccessPromise = null; // deduplication guard for updateMemberAccess
let memberAccessUserKey = "";
let pendingMemberAccessUser = null;

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
    // Skip hidden items — they report zero-size rects that corrupt saved positions
    if (item.classList.contains("is-hidden") || item.offsetParent === null) return;
    const rect = item.getBoundingClientRect();
    if (rect.width === 0 && rect.height === 0) return;
    positions[key] = {
      left: Math.max(0, Math.round(rect.left - containerRect.left)),
      top: Math.round(rect.top - containerRect.top),
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
  const visiblePositions = getLayoutPositionsFromDom();
  // Merge: keep previously saved positions for currently-hidden items
  layoutPositions = { ...layoutPositions, ...visiblePositions };
  localStorage.setItem(DOCS_LAYOUT_POS_KEY, JSON.stringify(layoutPositions));
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
  const containerWidth = container.getBoundingClientRect().width;
  const padding = 10;

  // First pass: apply saved positions and track rightmost edge for fallback placement
  let maxRight = 0;
  let fallbackTop = 10;
  getLayoutItems().forEach((item) => {
    const key = item.dataset.layoutKey;
    if (!key) return;
    const pos = positions[key];
    if (pos && pos.width > 0) {
      const width = Math.max(80, Math.round(pos.width));
      const height = Math.max(36, Math.round(pos.height));
      const maxLeft = Math.max(0, containerWidth - width - padding);
      const clampedLeft = Math.min(Math.max(0, Math.round(pos.left)), maxLeft);
      const clampedTop = Math.max(0, Math.round(pos.top));
      item.style.left = `${clampedLeft}px`;
      item.style.top = `${clampedTop}px`;
      item.style.width = `${width}px`;
      item.style.height = `${height}px`;
      maxRight = Math.max(maxRight, clampedLeft + width);
      if (clampedTop >= 0) fallbackTop = Math.max(0, Math.min(fallbackTop, clampedTop));
    }
  });

  // Second pass: position visible items missing from saved data
  // (e.g., Profile button added after layout was last saved, or hidden when captured)
  const gap = 12;
  let nextLeft = maxRight > 0 ? maxRight + gap : padding;
  getLayoutItems().forEach((item) => {
    const key = item.dataset.layoutKey;
    if (!key) return;
    if (positions[key] && positions[key].width > 0) return; // already positioned
    if (item.classList.contains("is-hidden")) return; // skip hidden items
    // Place after the last positioned item in the same row
    const rect = item.getBoundingClientRect();
    const w = Math.max(80, Math.round(rect.width) || 100);
    const h = Math.max(36, Math.round(rect.height) || 40);
    if (containerWidth > 0 && nextLeft + w > containerWidth - padding && nextLeft > padding) {
      nextLeft = padding;
      fallbackTop += h + gap;
    }
    const maxLeft = Math.max(0, containerWidth - w - padding);
    const clampedLeft = Math.min(Math.max(0, nextLeft), maxLeft);
    item.style.left = `${clampedLeft}px`;
    item.style.top = `${Math.max(0, fallbackTop)}px`;
    item.style.width = `${w}px`;
    item.style.height = `${h}px`;
    nextLeft += w + gap;
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
    if (item.classList.contains("is-hidden") || item.offsetParent === null) return;
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

// Only persist header items that exist for all visitors.
const DOCS_SHARED_LAYOUT_KEYS = new Set([
  "auth",
  "user",
  "signout",
  "profile",
  "menu",
]);

function filterDocsLayoutPositions(allPositions) {
  const src = allPositions && typeof allPositions === "object" ? allPositions : {};
  const out = {};
  Object.keys(src).forEach((key) => {
    if (DOCS_SHARED_LAYOUT_KEYS.has(key)) out[key] = src[key];
  });
  return out;
}

function filterDocsLayoutOrder(allOrder) {
  const arr = Array.isArray(allOrder) ? allOrder : [];
  return arr.filter((key) => DOCS_SHARED_LAYOUT_KEYS.has(key));
}

async function saveDocsAdminLayout() {
  if (!currentIsAdmin) return;
  const user = await getCurrentUser();
  if (!user) return;

  // Use the merged layoutPositions (already includes hidden items' prior positions),
  // but persist only the shared keys so hidden/admin-only items can't corrupt member layouts.
  const positions = filterDocsLayoutPositions(layoutPositions);
  const order = filterDocsLayoutOrder(
    getLayoutItems().map((el) => el.dataset.layoutKey).filter(Boolean)
  );

  const layoutData = {
    id: DOCS_LAYOUT_ROW_ID,
    positions: positions,
    order: order,
    updated_at: new Date().toISOString(),
    updated_by: getUserEmail(user),
  };

  // Use UPDATE (not upsert) to avoid INSERT which may be blocked by RLS.
  const { error, count } = await supabase
    .from(DOCS_LAYOUT_TABLE)
    .update(layoutData)
    .eq("id", DOCS_LAYOUT_ROW_ID);

  if (error) {
    console.error("Failed to save docs admin layout:", error.message);
    showStatus(`Layout save failed: ${error.message}`);
  } else {
    console.log("Docs admin layout saved to database");
    showStatus("Layout saved (applies to all visitors).");
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
  // Treat empty order/positions (from a reset) the same as no layout data.
  const hasLayout = adminLayout &&
    ((Array.isArray(adminLayout.order) && adminLayout.order.length > 0) ||
     (adminLayout.positions && Object.keys(adminLayout.positions).length > 0));
  if (hasLayout) {
    console.log("Loading docs admin layout from database");
    const sharedOrder = filterDocsLayoutOrder(adminLayout.order);
    const sharedPositions = filterDocsLayoutPositions(adminLayout.positions);

    if (sharedOrder?.length) {
      applyLayoutOrder(sharedOrder);
      localStorage.setItem(DOCS_LAYOUT_KEY, JSON.stringify(sharedOrder));
    }
    if (sharedPositions && Object.keys(sharedPositions).length) {
      // Admins keep local-only positions; members get shared-only layout.
      layoutPositions = currentIsAdmin
        ? { ...layoutPositions, ...sharedPositions }
        : { ...sharedPositions };

      applyLayoutPositions(layoutPositions);
      localStorage.setItem(DOCS_LAYOUT_POS_KEY, JSON.stringify(layoutPositions));

      // Extra safety for non-admins: clear any stale inline positioning on non-shared items.
      if (!currentIsAdmin) {
        getLayoutItems().forEach((item) => {
          const key = item.dataset.layoutKey;
          if (!key || DOCS_SHARED_LAYOUT_KEYS.has(key)) return;
          item.style.removeProperty("left");
          item.style.removeProperty("top");
          item.style.removeProperty("width");
          item.style.removeProperty("height");
        });
      }
    }
    if (currentIsAdmin) {
      showStatus("Layout loaded from shared settings.");
    }
  } else {
    console.log("No docs admin layout in database, using localStorage");
  }
}

async function resetDocsAdminLayout() {
  if (!currentIsAdmin) return;
  const user = await getCurrentUser();
  if (!user) return;

  // UPDATE with empty values instead of DELETE.
  // This avoids needing INSERT (which RLS may block) when saving again later.
  const { error } = await supabase
    .from(DOCS_LAYOUT_TABLE)
    .update({
      positions: {},
      order: [],
      updated_at: new Date().toISOString(),
      updated_by: getUserEmail(user),
    })
    .eq("id", DOCS_LAYOUT_ROW_ID);

  if (error) {
    console.error("Failed to reset docs admin layout:", error.message);
  } else {
    console.log("Docs admin layout reset in database");
  }
}

/**
 * Calculate a wrapping grid arrangement that fits the container width.
 * Used on first edit so items don't overflow off-screen.
 */
function calculateInitialGridPositions() {
  const container = getLayoutContainer();
  if (!container) return {};
  // Temporarily force full width so we measure the available space
  const prevWidth = container.style.width;
  container.style.width = "100%";
  const containerWidth = container.getBoundingClientRect().width;
  container.style.width = prevWidth;

  const items = getLayoutItems();
  const positions = {};
  const padding = 10;
  const gap = 16;
  // Account for editing-mode CSS: padding 6px 10px + 1px border on each side
  const editExtraW = 22; // 10 + 10 + 1 + 1
  const editExtraH = 14; // 6 + 6 + 1 + 1
  let currentLeft = padding;
  let currentTop = padding;
  let rowHeight = 0;

  items.forEach((item) => {
    const key = item.dataset.layoutKey;
    if (!key) return;
    const rect = item.getBoundingClientRect();
    const itemWidth = Math.max(80, Math.round(rect.width) + editExtraW);
    const itemHeight = Math.max(36, Math.round(rect.height) + editExtraH);

    // Wrap to next row if exceeding container width
    if (currentLeft + itemWidth > containerWidth - padding && currentLeft > padding) {
      currentLeft = padding;
      currentTop += rowHeight + gap;
      rowHeight = 0;
    }

    positions[key] = {
      left: Math.round(currentLeft),
      top: Math.round(currentTop),
      width: itemWidth,
      height: itemHeight,
    };

    currentLeft += itemWidth + gap;
    rowHeight = Math.max(rowHeight, itemHeight);
  });

  return positions;
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
      layoutPositions = calculateInitialGridPositions();
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
  const pageHeader = container.closest(".page-header") || container;
  const headerRect = pageHeader.getBoundingClientRect();
  const startLeft = parseFloat(item.style.left || "0");
  const startTop = parseFloat(item.style.top || "0");
  dragItem = item;
  didDrag = false;
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
  // Mark as a real drag once the pointer moves more than a few pixels
  if (Math.abs(deltaX) > 3 || Math.abs(deltaY) > 3) didDrag = true;
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

/**
 * Inject data-layout-key attributes and Edit / Reset buttons into the docs header.
 */
function initDocsLayoutUI() {
  const container = getLayoutContainer();
  if (!container) return;

  // Assign data-layout-key to each actionable child
  const keyMap = [
    { selector: "#authOpenBtn", key: "auth" },
    { selector: "#userDisplay", key: "user" },
    { selector: "#headerSignOutBtn", key: "signout" },
    { selector: "#headerUploadBtn", key: "upload" },
    { selector: "#headerNewFolderBtn", key: "newfolder" },
    { selector: "#docsProfileBtn", key: "profile" },
    { selector: ".menu-wrapper", key: "menu" },
  ];
  keyMap.forEach(({ selector, key }) => {
    const el = container.querySelector(selector);
    if (el && !el.dataset.layoutKey) el.dataset.layoutKey = key;
  });

  const requiredKeys = Array.from(DOCS_SHARED_LAYOUT_KEYS);
  const presentKeys = getLayoutItems().map((el) => el.dataset.layoutKey).filter(Boolean);
  const missingKeys = requiredKeys.filter((key) => !presentKeys.includes(key));
  const duplicateKeys = presentKeys.filter((key, idx) => presentKeys.indexOf(key) !== idx);
  if (missingKeys.length || duplicateKeys.length) {
    console.warn("Layout key audit:", {
      missingKeys,
      duplicateKeys: Array.from(new Set(duplicateKeys)),
    });
  }

  // Create Edit layout button — place inside the layout container so it's draggable
  layoutEditBtn = document.createElement("button");
  layoutEditBtn.className = "button secondary layout-admin-btn is-hidden";
  layoutEditBtn.type = "button";
  layoutEditBtn.id = "layoutEditBtn";
  layoutEditBtn.dataset.layoutKey = "editbtn";
  layoutEditBtn.textContent = "Edit layout";

  // Create Reset layout button
  layoutResetBtn = document.createElement("button");
  layoutResetBtn.className = "button secondary layout-admin-btn is-hidden";
  layoutResetBtn.type = "button";
  layoutResetBtn.id = "layoutResetBtn";
  layoutResetBtn.dataset.layoutKey = "resetbtn";
  layoutResetBtn.textContent = "Reset layout";

  // Append buttons to the layout container so they participate in drag/resize
  container.appendChild(layoutEditBtn);
  container.appendChild(layoutResetBtn);

  // Capture default order before any saved layout is applied
  defaultLayoutOrder = getLayoutItems().map((el) => el.dataset.layoutKey).filter(Boolean);
  defaultLayoutPositions = getLayoutPositionsFromDom();

  // Restore saved layout
  const savedOrder = loadLayoutOrder();
  if (savedOrder.length) applyLayoutOrder(savedOrder);
  layoutPositions = loadLayoutPositions();
  if (Object.keys(layoutPositions).length) applyLayoutPositions(layoutPositions);

  // Block clicks/navigation on layout items while editing (capturing phase)
  // but allow the Edit/Reset layout buttons to still function
  container.addEventListener(
    "click",
    (e) => {
      if (!document.body.classList.contains("layout-editing")) return;
      const target = e.target.closest("[data-layout-key]");
      if (!target) return;
      // Allow the admin layout buttons to function during editing,
      // but only if the user clicked without dragging
      if ((target.id === "layoutEditBtn" || target.id === "layoutResetBtn") && !didDrag) return;
      e.preventDefault();
      e.stopImmediatePropagation();
    },
    true
  );

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

  layoutResetBtn.addEventListener("click", async () => {
    if (!defaultLayoutOrder.length) return;
    clearLayoutPositions();
    applyLayoutOrder(defaultLayoutOrder);
    localStorage.setItem(DOCS_LAYOUT_KEY, JSON.stringify(defaultLayoutOrder));
    localStorage.removeItem(DOCS_LAYOUT_POS_KEY);
    setLayoutEditing(false);
    // Await Supabase delete so it completes before any navigation
    await resetDocsAdminLayout();
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
    .select("status, group, first_name, nickname")
    .eq("email", email)
    .maybeSingle();
  if (error) return null;
  return data?.status === "active" ? data : null;
};

const getDisplayName = (user, member) => {
  const email = getUserEmail(user);
  const nickname = member?.nickname?.trim?.() || "";
  const firstName = member?.first_name?.trim?.() || "";
  return nickname || firstName || email || "";
};

const setUIState = (user, member) => {
  const email = getUserEmail(user);
  const isSignedIn = Boolean(email);
  const isActive = Boolean(member);
  // Check admin from database group OR from hardcoded admin emails list
  const isAdmin = (member?.group === "admin") || (isSignedIn && adminEmails.includes(email));
  const displayName = getDisplayName(user, member);

  console.log("setUIState:", { email, isSignedIn, isActive, isAdmin, memberGroup: member?.group, adminEmails });

  // User display
  if (userDisplay) {
    userDisplay.textContent = displayName ? `Hi ${displayName}` : "";
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

  // Menu auth link: toggle Sign In ↔ Log Out
  if (menuAuthLink) {
    if (isSignedIn) {
      menuAuthLink.textContent = "Log Out";
      menuAuthLink.removeAttribute("href");
      menuAuthLink.style.cursor = "pointer";
      menuAuthLink.onclick = async (e) => {
        e.preventDefault();
        if (typeof window.__authSync !== "undefined") window.__authSync.clearAll();
        await supabase.auth.signOut();
      };
    } else {
      menuAuthLink.textContent = "Sign In";
      menuAuthLink.removeAttribute("href");
      menuAuthLink.style.cursor = "pointer";
      menuAuthLink.onclick = (e) => {
        e.preventDefault();
        // Close menu panel first
        menuPanel?.classList.add("is-hidden");
        showAuthModal();
      };
    }
  }

  // Profile button (show when signed in)
  if (docsProfileBtn) {
    docsProfileBtn.classList.toggle("is-hidden", !isSignedIn);
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

  // Menu dropdown: admin-only links and visibility
  adminMenuLinks.forEach((link) => {
    link.classList.toggle("is-hidden", !isAdmin);
    link.setAttribute("aria-hidden", String(!isAdmin));
  });
  if (menuWrapper) {
    menuWrapper.classList.toggle("is-hidden", !isActive && !isAdmin);
  }
  if (!isActive && !isAdmin) {
    setDocsMenuOpen(false);
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

  // Track admin state for table action buttons
  currentAdminState = isAdmin;

  return { isSignedIn, isActive, isAdmin };
};

const updateMemberAccess = async (user) => {
  const nextKey = getUserEmail(user) || "";
  // Deduplicate: if already running with same user, return the existing promise
  if (memberAccessPromise) {
    if (memberAccessUserKey === nextKey) return memberAccessPromise;
    // Queue a follow-up run for the new user
    pendingMemberAccessUser = user;
    return memberAccessPromise;
  }
  memberAccessUserKey = nextKey;
  memberAccessPromise = (async () => {
    try {
      const member = await getActiveMember(user);
      const { isActive } = setUIState(user, member);

      // Cache auth state for SPA navigation
      cachedUser = user;
      cachedMember = member;
      cachedIsActive = isActive;
      
      if (isActive) {
        await loadDocsFromBucket();
        // Only apply saved layout for authenticated active members
        await applyDocsAdminLayoutFromDatabase();
      } else {
        // Non-authenticated visitors get the default flex layout (no freeform positioning)
        clearLayoutPositions();
      }
    } finally {
      memberAccessPromise = null;
    }
  })();
  const result = await memberAccessPromise;
  if (pendingMemberAccessUser) {
    const queuedUser = pendingMemberAccessUser;
    pendingMemberAccessUser = null;
    return updateMemberAccess(queuedUser);
  }
  return result;
};

// Document loading
const appendRow = ({ name, modified, size, url, isFolder, filePath, folderPrefix }) => {
  if (!docTableBody) return;

  const row = document.createElement("tr");
  row.dataset.filePath = filePath || "";
  row.dataset.fileName = name;
  row.dataset.isFolder = isFolder ? "true" : "false";
  const icon = isFolder ? "📁" : "";
  const nameCell = document.createElement("td");
  const nameLink = document.createElement("a");
  nameLink.className = `doc-link${isFolder ? " folder-link" : ""}`;
  nameLink.href = url;
  nameLink.textContent = `${icon} ${name}`.trim();
  nameCell.appendChild(nameLink);

  const modifiedCell = document.createElement("td");
  modifiedCell.textContent = modified;

  const byCell = document.createElement("td");
  byCell.textContent = "—";

  const sizeCell = document.createElement("td");
  sizeCell.textContent = size;

  row.appendChild(nameCell);
  row.appendChild(modifiedCell);
  row.appendChild(byCell);
  row.appendChild(sizeCell);

  if (currentAdminState) {
    const actionsCell = document.createElement("td");
    actionsCell.className = "actions-cell";

    const moveBtn = document.createElement("button");
    moveBtn.className = "action-btn action-move";
    moveBtn.title = "Move";
    moveBtn.dataset.action = "move";
    moveBtn.textContent = "Move";
    if (isFolder) moveBtn.disabled = true;

    const deleteBtn = document.createElement("button");
    deleteBtn.className = "action-btn action-delete";
    deleteBtn.title = "Delete";
    deleteBtn.dataset.action = "delete";
    deleteBtn.textContent = "Delete";

    actionsCell.appendChild(moveBtn);
    actionsCell.appendChild(deleteBtn);
    row.appendChild(actionsCell);
  }

  // Make folder links navigate into the folder
  if (isFolder && folderPrefix) {
    const link = row.querySelector(".folder-link");
    if (link) {
      link.addEventListener("click", (e) => {
        e.preventDefault();
        navigateToFolder(folderPrefix);
      });
    }
  }

  // Wire up action buttons
  const moveBtn = row.querySelector('[data-action="move"]');
  const deleteBtn = row.querySelector('[data-action="delete"]');
  if (moveBtn) moveBtn.addEventListener("click", () => handleMoveFile(filePath, name, isFolder));
  if (deleteBtn) deleteBtn.addEventListener("click", () => handleDeleteFile(filePath, name, isFolder));

  docTableBody.appendChild(row);
};

const appendTrashRow = ({ name, originalPath, trashedAt, size }, trashTbody) => {
  if (!trashTbody) return;
  const row = document.createElement("tr");
  row.dataset.trashPath = `.trash/${originalPath}`;
  row.dataset.originalPath = originalPath;
  const nameCell = document.createElement("td");
  const nameSpan = document.createElement("span");
  nameSpan.className = "doc-link trash-item-name";
  nameSpan.textContent = name;
  nameCell.appendChild(nameSpan);

  const trashedCell = document.createElement("td");
  trashedCell.textContent = trashedAt;

  const sizeCell = document.createElement("td");
  sizeCell.textContent = size;

  const actionsCell = document.createElement("td");
  actionsCell.className = "actions-cell";

  const restoreBtn = document.createElement("button");
  restoreBtn.className = "action-btn action-restore";
  restoreBtn.title = "Restore";
  restoreBtn.dataset.action = "restore";
  restoreBtn.textContent = "Restore";

  const permaDeleteBtn = document.createElement("button");
  permaDeleteBtn.className = "action-btn action-permadelete";
  permaDeleteBtn.title = "Permanently delete";
  permaDeleteBtn.dataset.action = "permadelete";
  permaDeleteBtn.textContent = "Perm. Delete";

  actionsCell.appendChild(restoreBtn);
  actionsCell.appendChild(permaDeleteBtn);

  row.appendChild(nameCell);
  row.appendChild(trashedCell);
  row.appendChild(sizeCell);
  row.appendChild(actionsCell);
  restoreBtn.addEventListener("click", () => handleRestoreFile(originalPath, name));
  permaDeleteBtn.addEventListener("click", () => handlePermanentDelete(originalPath, name));
  trashTbody.appendChild(row);
};

// ── Folder navigation ──

const navigateToFolder = (prefix) => {
  currentPrefix = prefix;
  updateBreadcrumb();
  loadDocsFromBucket();
};

const updateBreadcrumb = () => {
  let breadcrumbEl = document.getElementById("folderBreadcrumb");
  if (!breadcrumbEl) {
    // Create breadcrumb bar above the table
    const tablePanel = docTableBody?.closest(".panel");
    if (!tablePanel) return;
    breadcrumbEl = document.createElement("nav");
    breadcrumbEl.id = "folderBreadcrumb";
    breadcrumbEl.className = "folder-breadcrumb";
    tablePanel.parentElement.insertBefore(breadcrumbEl, tablePanel);
  }

  // If we're at the page's root prefix, hide breadcrumb
  if (currentPrefix === docsPrefix) {
    breadcrumbEl.classList.add("is-hidden");
    return;
  }

  breadcrumbEl.classList.remove("is-hidden");

  // Build path segments relative to docsPrefix
  const relativePath = currentPrefix.slice(docsPrefix.length);
  const segments = relativePath.split("/").filter(Boolean);

  let html = `<a class="breadcrumb-link" href="#" data-prefix="${docsPrefix}">Root</a>`;
  let accumulated = docsPrefix;
  for (const seg of segments) {
    accumulated += `${seg}/`;
    html += ` <span class="breadcrumb-sep">/</span> <a class="breadcrumb-link" href="#" data-prefix="${accumulated}">${seg}</a>`;
  }
  breadcrumbEl.innerHTML = html;

  // Attach click handlers
  breadcrumbEl.querySelectorAll(".breadcrumb-link").forEach((link) => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      navigateToFolder(link.dataset.prefix);
    });
  });
};

const loadDocsFromBucket = async () => {
  if (!docTableBody) return;

  // Show/hide Actions column header
  const actionsHeader = document.getElementById("actionsHeader");
  if (actionsHeader) actionsHeader.classList.toggle("is-hidden", !currentAdminState);

  const { data: files, error } = await supabase.storage
    .from(docsBucket)
    .list(currentPrefix || "", { sortBy: { column: "created_at", order: "desc" } });

  if (error) {
    console.error("Failed to load docs:", error.message);
    return;
  }

  docTableBody.innerHTML = "";
  let fileCount = 0;

  for (const file of files) {
    // Skip .trash folder and .folder placeholders
    if (file.name === ".trash" || file.name === ".folder") continue;
    const isFolder = !file.metadata;
    const filePath = `${currentPrefix}${file.name}`;

    if (isFolder) {
      appendRow({
        name: file.name,
        modified: "—",
        size: "—",
        url: `#folder-${file.name}`,
        isFolder: true,
        filePath,
        folderPrefix: `${currentPrefix}${file.name}/`,
      });
      fileCount++;
    } else {
      const { data: publicUrlData } = supabase.storage
        .from(docsBucket)
        .getPublicUrl(filePath);

      const modified = file.updated_at
        ? formatTimestamp(new Date(file.updated_at))
        : "—";

      appendRow({
        name: file.name,
        modified,
        size: formatFileSize(file.metadata?.size),
        url: publicUrlData.publicUrl,
        isFolder: false,
        filePath,
      });
      fileCount++;
    }
  }

  if (emptyState) {
    emptyState.classList.toggle("is-hidden", fileCount > 0);
  }

  // Load trash if admin
  if (currentAdminState) {
    await loadTrashBin();
  }
};

// ── Trash Bin ──

const ensureTrashSection = () => {
  if (trashSection) return trashSection;
  const docsContentEl = document.querySelector("[data-docs-content]");
  if (!docsContentEl) return null;

  trashSection = document.createElement("section");
  trashSection.className = "section trash-section";
  trashSection.id = "trashSection";
  trashSection.innerHTML = `
    <h2>🗑️ Trash</h2>
    <p class="trash-hint">Recently deleted files. Restore or permanently remove them.</p>
    <div class="panel">
      <table class="doc-table trash-table">
        <thead>
          <tr>
            <th>File</th>
            <th>Deleted</th>
            <th>Size</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody></tbody>
      </table>
      <p class="empty-state" id="trashEmptyState">Trash is empty.</p>
    </div>
  `;
  docsContentEl.appendChild(trashSection);
  return trashSection;
};

const loadTrashBin = async () => {
  const trashPrefix = `.trash/${currentPrefix}`;
  const { data: files, error } = await supabase.storage
    .from(docsBucket)
    .list(trashPrefix, { sortBy: { column: "created_at", order: "desc" } });

  if (error) {
    console.log("No trash folder or error:", error.message);
    if (trashSection) trashSection.classList.add("is-hidden");
    return;
  }

  const trashFiles = (files || []).filter((f) => f.metadata && f.name !== ".folder");

  if (!trashFiles.length) {
    if (trashSection) trashSection.classList.add("is-hidden");
    return;
  }

  const section = ensureTrashSection();
  if (!section) return;
  section.classList.remove("is-hidden");

  const trashTbody = section.querySelector(".trash-table tbody");
  if (!trashTbody) return;
  trashTbody.innerHTML = "";

  const trashEmpty = section.querySelector("#trashEmptyState");

  for (const file of trashFiles) {
    const trashedAt = file.updated_at
      ? formatTimestamp(new Date(file.updated_at))
      : "—";
    appendTrashRow(
      {
        name: file.name,
        originalPath: `${currentPrefix}${file.name}`,
        trashedAt,
        size: formatFileSize(file.metadata?.size),
      },
      trashTbody
    );
  }

  if (trashEmpty) trashEmpty.classList.toggle("is-hidden", trashFiles.length > 0);
};

// ── File actions: Delete, Move, Restore, Permanent Delete ──

const handleDeleteFile = async (filePath, name, isFolder) => {
  const label = isFolder ? `folder "${name}" and all its contents` : `file "${name}"`;
  if (!confirm(`Move ${label} to Trash?`)) return;

  showStatus(`Moving ${name} to trash…`);

  if (isFolder) {
    // Recursively list all files in the folder and move each to .trash/
    const moveAllInFolder = async (prefix) => {
      const { data: items, error: listErr } = await supabase.storage
        .from(docsBucket)
        .list(prefix, { limit: 1000 });
      if (listErr) throw listErr;
      let count = 0;
      for (const item of items || []) {
        const src = `${prefix}/${item.name}`;
        if (!item.metadata) {
          // It's a sub-folder — recurse into it
          count += await moveAllInFolder(src);
        } else {
          const dest = `.trash/${src}`;
          const { error } = await supabase.storage.from(docsBucket).move(src, dest);
          if (!error) count++;
        }
      }
      return count;
    };
    let moved = 0;
    try {
      moved = await moveAllInFolder(filePath);
    } catch (err) {
      showStatus(`Failed to list folder: ${err.message}`);
      return;
    }
    // Also move the .folder placeholder if present
    await supabase.storage.from(docsBucket).move(`${filePath}/.folder`, `.trash/${filePath}/.folder`);
    showStatus(`Moved ${moved} file(s) from "${name}" to Trash. Refreshing…`);
  } else {
    const dest = `.trash/${filePath}`;
    const { error } = await supabase.storage.from(docsBucket).move(filePath, dest);
    if (error) {
      showStatus(`Failed to trash "${name}": ${error.message}`);
      return;
    }
    showStatus(`"${name}" moved to Trash. Refreshing…`);
  }

  await loadDocsFromBucket();
};

const handleRestoreFile = async (originalPath, name) => {
  if (!confirm(`Restore "${name}" from Trash?`)) return;
  showStatus(`Restoring ${name}…`);

  const trashPath = `.trash/${originalPath}`;
  const { error } = await supabase.storage.from(docsBucket).move(trashPath, originalPath);
  if (error) {
    showStatus(`Failed to restore "${name}": ${error.message}`);
    return;
  }
  showStatus(`"${name}" restored. Refreshing…`);
  await loadDocsFromBucket();
};

const handlePermanentDelete = async (originalPath, name) => {
  if (!confirm(`PERMANENTLY delete "${name}"? This cannot be undone.`)) return;
  showStatus(`Permanently deleting ${name}…`);

  const trashPath = `.trash/${originalPath}`;
  const { error } = await supabase.storage.from(docsBucket).remove([trashPath]);
  if (error) {
    showStatus(`Failed to delete "${name}": ${error.message}`);
    return;
  }
  showStatus(`"${name}" permanently deleted. Refreshing…`);
  await loadDocsFromBucket();
};

// ── Move File ──

const createMoveModal = () => {
  if (moveModal) return moveModal;
  moveModal = document.createElement("div");
  moveModal.className = "auth-modal is-hidden";
  moveModal.id = "moveModal";
  moveModal.innerHTML = `
    <div class="auth-modal-backdrop"></div>
    <div class="auth-modal-content panel">
      <h2>Move File</h2>
      <p class="move-file-label" id="moveFileLabel"></p>
      <div class="move-folder-list" id="moveFolderList"></div>
      <p class="auth-status" id="moveStatus"></p>
      <div class="auth-actions">
        <button class="button secondary" type="button" id="moveCancelBtn">Cancel</button>
      </div>
    </div>
  `;
  document.body.appendChild(moveModal);

  moveModal.querySelector(".auth-modal-backdrop").addEventListener("click", closeMoveModal);
  moveModal.querySelector("#moveCancelBtn").addEventListener("click", closeMoveModal);
  return moveModal;
};

const closeMoveModal = () => {
  if (moveModal) moveModal.classList.add("is-hidden");
};

const handleMoveFile = async (filePath, name, isFolder) => {
  if (isFolder) return; // folders can't be moved (Supabase limitation)

  const modal = createMoveModal();
  const label = modal.querySelector("#moveFileLabel");
  const folderList = modal.querySelector("#moveFolderList");
  const status = modal.querySelector("#moveStatus");
  label.textContent = `Moving: ${name}`;
  status.textContent = "Loading folders…";
  folderList.innerHTML = "";
  modal.classList.remove("is-hidden");

  // List top-level folders in the bucket
  const { data: topLevel, error } = await supabase.storage
    .from(docsBucket)
    .list("", { limit: 200 });

  if (error) {
    status.textContent = `Failed to list folders: ${error.message}`;
    return;
  }

  const folders = (topLevel || []).filter((f) => !f.metadata && f.name !== ".trash");
  status.textContent = folders.length ? "Select destination folder:" : "No other folders found.";

  // Also add sub-folders within each main folder
  for (const folder of folders) {
    // List sub-folders
    const { data: subFiles } = await supabase.storage.from(docsBucket).list(folder.name, { limit: 200 });
    const subFolders = (subFiles || []).filter((sf) => !sf.metadata && sf.name !== ".trash" && sf.name !== ".folder");

    // Main folder button
    const btn = document.createElement("button");
    btn.className = "button secondary move-dest-btn";
    btn.textContent = `📁 ${folder.name}/`;
    const destPrefix = `${folder.name}/`;
    if (destPrefix === docsPrefix) {
      btn.disabled = true;
      btn.textContent += " (current)";
    }
    btn.addEventListener("click", () => executeMoveFile(filePath, name, destPrefix));
    folderList.appendChild(btn);

    // Sub-folder buttons
    for (const sf of subFolders) {
      const subBtn = document.createElement("button");
      subBtn.className = "button secondary move-dest-btn move-subfolder";
      const subDest = `${folder.name}/${sf.name}/`;
      subBtn.textContent = `  📁 ${folder.name}/${sf.name}/`;
      if (subDest === docsPrefix) {
        subBtn.disabled = true;
        subBtn.textContent += " (current)";
      }
      subBtn.addEventListener("click", () => executeMoveFile(filePath, name, subDest));
      folderList.appendChild(subBtn);
    }
  }
};

const executeMoveFile = async (filePath, name, destPrefix) => {
  const status = moveModal?.querySelector("#moveStatus");
  if (status) status.textContent = `Moving "${name}" to ${destPrefix}…`;

  const destPath = `${destPrefix}${name}`;
  const { error } = await supabase.storage.from(docsBucket).move(filePath, destPath);
  if (error) {
    if (status) status.textContent = `Failed: ${error.message}`;
    return;
  }

  closeMoveModal();
  showStatus(`"${name}" moved to ${destPrefix}. Refreshing…`);
  await loadDocsFromBucket();
};

// ── Profile Settings (Docs) ──

const createDocsProfileBtn = () => {
  if (docsProfileBtn) return docsProfileBtn;
  docsProfileBtn = document.createElement("button");
  docsProfileBtn.className = "button secondary is-hidden";
  docsProfileBtn.type = "button";
  docsProfileBtn.textContent = "Profile";
  docsProfileBtn.id = "docsProfileBtn";
  // Insert before sign-out button
  if (headerSignOutBtn?.parentElement) {
    headerSignOutBtn.parentElement.insertBefore(docsProfileBtn, headerSignOutBtn);
  }
  docsProfileBtn.addEventListener("click", openDocsProfileModal);
  return docsProfileBtn;
};

const createDocsProfileModal = () => {
  if (docsProfileModal) return docsProfileModal;
  docsProfileModal = document.createElement("div");
  docsProfileModal.className = "auth-modal is-hidden";
  docsProfileModal.innerHTML = `
    <div class="auth-modal-backdrop"></div>
    <div class="auth-modal-content panel" style="max-width:520px">
      <div class="profile-header">
        <h2>Profile Settings</h2>
        <button class="button secondary" type="button" id="docsProfileCloseBtn">Close</button>
      </div>
      <form class="profile-form" id="docsProfileForm">
        <div class="profile-row">
          <label class="profile-control">
            <span>First Name <span class="required">*</span></span>
            <input type="text" id="docsProfileFirstName" required />
          </label>
          <label class="profile-control">
            <span>Last Name <span class="required">*</span></span>
            <input type="text" id="docsProfileLastName" required />
          </label>
        </div>
        <div class="profile-row">
          <label class="profile-control">
            <span>Email</span>
            <input type="email" id="docsProfileEmail" disabled />
          </label>
          <label class="profile-control">
            <span>Nickname</span>
            <input type="text" id="docsProfileNickname" placeholder="Optional" />
          </label>
        </div>
        <div class="profile-row">
          <label class="profile-control">
            <span>Middle Initial</span>
            <input type="text" id="docsProfileMiddleInitial" maxlength="1" placeholder="Optional" />
          </label>
          <label class="profile-control">
            <span>Phone</span>
            <input type="tel" id="docsProfilePhone" placeholder="Optional" />
          </label>
        </div>
        <div class="profile-row profile-row-full">
          <label class="profile-control">
            <span>Address</span>
            <input type="text" id="docsProfileAddress" placeholder="Optional" />
          </label>
        </div>
        <p class="auth-status" id="docsProfileStatus"></p>
        <div class="auth-actions" style="justify-content:flex-end">
          <button class="button primary" type="submit">Save</button>
          <button class="button secondary" type="button" id="docsProfileCancelBtn">Cancel</button>
        </div>
      </form>
    </div>
  `;
  document.body.appendChild(docsProfileModal);

  const closeModal = () => docsProfileModal.classList.add("is-hidden");
  docsProfileModal.querySelector(".auth-modal-backdrop").addEventListener("click", closeModal);
  docsProfileModal.querySelector("#docsProfileCloseBtn").addEventListener("click", closeModal);
  docsProfileModal.querySelector("#docsProfileCancelBtn").addEventListener("click", closeModal);

  docsProfileModal.querySelector("#docsProfileForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const status = docsProfileModal.querySelector("#docsProfileStatus");
    const firstName = docsProfileModal.querySelector("#docsProfileFirstName").value.trim();
    const lastName = docsProfileModal.querySelector("#docsProfileLastName").value.trim();
    if (!firstName || !lastName) {
      if (status) { status.textContent = "First name and last name are required."; status.className = "auth-status is-error"; }
      return;
    }
    if (status) { status.textContent = "Saving…"; status.className = "auth-status is-info"; }
    const user = await getCurrentUser();
    const email = getUserEmail(user);
    const updates = {
      first_name: firstName,
      last_name: lastName,
      nickname: docsProfileModal.querySelector("#docsProfileNickname").value.trim() || null,
      middle_initial: docsProfileModal.querySelector("#docsProfileMiddleInitial").value.trim() || null,
      phone: docsProfileModal.querySelector("#docsProfilePhone").value.trim() || null,
      address: docsProfileModal.querySelector("#docsProfileAddress").value.trim() || null,
    };
    const { error } = await supabase.from(membersTable).update(updates).eq("email", email);
    if (error) {
      if (status) { status.textContent = `Save failed: ${error.message}`; status.className = "auth-status is-error"; }
      return;
    }
    if (status) { status.textContent = "Profile saved."; status.className = "auth-status is-success"; }
    setTimeout(closeModal, 1200);
  });

  return docsProfileModal;
};

const openDocsProfileModal = async () => {
  const modal = createDocsProfileModal();
  modal.classList.remove("is-hidden");
  const user = await getCurrentUser();
  const email = getUserEmail(user);
  const emailInput = modal.querySelector("#docsProfileEmail");
  if (emailInput) emailInput.value = email;

  const { data } = await supabase
    .from(membersTable)
    .select("first_name, last_name, nickname, middle_initial, phone, address")
    .eq("email", email)
    .maybeSingle();

  if (data) {
    const set = (id, val) => { const el = modal.querySelector(id); if (el) el.value = val || ""; };
    set("#docsProfileFirstName", data.first_name);
    set("#docsProfileLastName", data.last_name);
    set("#docsProfileNickname", data.nickname);
    set("#docsProfileMiddleInitial", data.middle_initial);
    set("#docsProfilePhone", data.phone);
    set("#docsProfileAddress", data.address);
  }
  const status = modal.querySelector("#docsProfileStatus");
  if (status) { status.textContent = ""; status.className = "auth-status"; }
};

// Auth modal
const createAuthModal = () => {
  if (authModal) return authModal;

  authModal = document.createElement("div");
  authModal.className = "auth-modal is-hidden";
  authModal.innerHTML = `
    <div class="auth-modal-backdrop"></div>
    <div class="auth-modal-content panel">
      <h2>Sign In / Create Account</h2>
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

// Expose a safe global hook for inline fallback handlers
window.__docsShowAuthModal = showAuthModal;

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
    const path = `${currentPrefix}${fileName}`;
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

  setTimeout(() => loadDocsFromBucket(), 1500);
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
  const placeholderPath = `${currentPrefix}${folderName.trim()}/.folder`;
  showStatus(`Creating folder: ${folderName}…`);

  const { error } = await supabase.storage
    .from(docsBucket)
    .upload(placeholderPath, new Blob([""]), { upsert: true });

  if (error) {
    showStatus(`Failed to create folder: ${error.message}`);
    return;
  }

  showStatus(`Folder "${folderName}" created. Refreshing…`);
  setTimeout(() => loadDocsFromBucket(), 1000);
};

// Create dynamic profile button (must run before layout init so it gets a layout key)
createDocsProfileBtn();

// Initialize layout editing UI
initDocsLayoutUI();

// Event listeners
if (authOpenBtn) {
  authOpenBtn.addEventListener("click", showAuthModal);
}

// Fallback: delegated handler in case the button is re-rendered or missed
document.addEventListener("click", (event) => {
  const target = event.target.closest("#authOpenBtn");
  if (!target) return;
  showAuthModal();
});

if (headerSignOutBtn) {
  headerSignOutBtn.addEventListener("click", async () => {
    if (typeof window.__authSync !== "undefined") window.__authSync.clearAll();
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

// ── Menu dropdown toggle ─────────────────────────────────────
if (menuBtn && menuPanel) {
  menuBtn.addEventListener("click", (event) => {
    event.stopPropagation();
    const isOpen = !menuPanel.classList.contains("is-hidden");
    setDocsMenuOpen(!isOpen);
  });
  menuPanel.addEventListener("click", (event) => {
    event.stopPropagation();
  });
  document.addEventListener("click", () => {
    setDocsMenuOpen(false);
    if (menuSessionsFlyout) menuSessionsFlyout.classList.add("is-hidden");
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      setDocsMenuOpen(false);
      if (menuSessionsFlyout) menuSessionsFlyout.classList.add("is-hidden");
    }
  });
}

// ── Sessions flyout sub-menu ─────────────────────────────────
if (menuSessionsBtn && menuSessionsFlyout) {
  let sessionsTimer = null;
  const sessionsWrapper = menuSessionsBtn.closest(".menu-sessions-wrapper");

  menuSessionsBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    menuSessionsFlyout.classList.toggle("is-hidden");
  });

  // Hover: open on enter, close on leave (with delay)
  if (sessionsWrapper) {
    sessionsWrapper.addEventListener("mouseenter", () => {
      clearTimeout(sessionsTimer);
      menuSessionsFlyout.classList.remove("is-hidden");
    });
    sessionsWrapper.addEventListener("mouseleave", () => {
      sessionsTimer = setTimeout(() => menuSessionsFlyout.classList.add("is-hidden"), 200);
    });
  }
  // Keep flyout open when hovering over it
  menuSessionsFlyout.addEventListener("mouseenter", () => clearTimeout(sessionsTimer));
  menuSessionsFlyout.addEventListener("mouseleave", () => {
    sessionsTimer = setTimeout(() => menuSessionsFlyout.classList.add("is-hidden"), 200);
  });

// ── SPA Navigation (persistent header across docs pages) ─────

/**
 * Re-query <main> element references after SPA content swap.
 */
function rebindMainElements() {
  docTableBody = document.querySelector(".doc-table tbody");
  docsContent = document.querySelector("[data-docs-content]");
  accessGate = document.getElementById("accessGate");
  emptyState = document.getElementById("emptyState");
  trashSection = null; // will be recreated by ensureTrashSection if needed
}

/**
 * Returns true if the URL points to an internal docs HTML page.
 */
function isDocsPageUrl(url) {
  try {
    const u = new URL(url, location.origin);
    if (u.origin !== location.origin) return false;
    if (!u.pathname.startsWith("/kybalion/docs")) return false;
    // Don't intercept file downloads (URLs with file extensions like .pdf, .docx, etc.)
    const lastSegment = u.pathname.split("/").filter(Boolean).pop() || "";
    if (lastSegment.includes(".") && !lastSegment.endsWith(".html")) return false;
    return true;
  } catch {
    return false;
  }
}

/**
 * Perform SPA navigation: fetch target docs page, swap <main> and brand,
 * keep the header (auth state, layout, buttons) intact.
 */
let spaNavInProgress = false;
async function spaNavigate(url, pushState = true) {
  if (spaNavInProgress) return;
  spaNavInProgress = true;
  try {
    const res = await fetch(url);
    if (!res.ok) { location.href = url; return; }
    const html = await res.text();
    const parsed = new DOMParser().parseFromString(html, "text/html");

    // 1. Update page title
    document.title = parsed.title;

    // 2. Update brand section (session name, subtitle)
    const newBrand = parsed.querySelector(".brand");
    const curBrand = document.querySelector(".brand");
    if (newBrand && curBrand) curBrand.innerHTML = newBrand.innerHTML;

    // 3. Update data-docs-prefix for file loading
    const newPrefix = parsed.body.dataset.docsPrefix || "";
    document.body.dataset.docsPrefix = newPrefix;
    docsPrefix = newPrefix;
    currentPrefix = newPrefix;

    // 4. Swap <main> content
    const newMain = parsed.querySelector("main.page");
    const curMain = document.querySelector("main.page");
    if (newMain && curMain) curMain.innerHTML = newMain.innerHTML;

    // 5. Re-bind element references that live inside <main>
    rebindMainElements();

    // 6. Re-apply auth visibility on the new <main> elements
    if (cachedIsActive) {
      if (docsContent) docsContent.classList.remove("is-hidden");
      if (accessGate) accessGate.classList.add("is-hidden");
    } else {
      if (docsContent) docsContent.classList.add("is-hidden");
      if (accessGate) accessGate.classList.remove("is-hidden");
    }

    // 7. Update URL
    if (pushState) {
      history.pushState({ docsUrl: url }, "", url);
    }

    // 8. Scroll to top
    window.scrollTo(0, 0);

    // 9. Highlight current page in the menu dropdown
    if (menuPanel) {
      menuPanel.querySelectorAll(".menu-link").forEach((link) => {
        const href = link.getAttribute("href");
        link.classList.toggle("is-active", href === url || url.startsWith(href));
      });
    }

    // 10. Re-load files from Supabase if user has access
    if (cachedIsActive && docTableBody) {
      await loadDocsFromBucket();
    }
  } catch (err) {
    console.error("SPA navigation failed, falling back:", err);
    location.href = url;
  } finally {
    spaNavInProgress = false;
  }
}

// Intercept clicks on internal docs links for SPA navigation.
// Use CAPTURE PHASE so this fires before menuPanel's stopPropagation,
// which otherwise prevents menu-link clicks from reaching a bubbling listener.
document.addEventListener("click", (e) => {
  // Don't intercept if modifier keys are pressed (allow open-in-new-tab etc.)
  if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

  const link = e.target.closest("a[href]");
  if (!link) return;

  const href = link.getAttribute("href");
  if (!href || href.startsWith("#") || href.startsWith("javascript:")) return;

  // Resolve relative URLs against current location
  const resolved = new URL(href, location.href).pathname;

  if (isDocsPageUrl(resolved)) {
    e.preventDefault();
    e.stopPropagation(); // prevent any other handlers from also processing
    // Close the menu dropdown if open
    setDocsMenuOpen(false);
    spaNavigate(resolved);
  }
}, true); // ← capture phase

// Handle browser back/forward navigation
window.addEventListener("popstate", () => {
  if (location.pathname.startsWith("/kybalion/docs")) {
    spaNavigate(location.pathname, false);
  }
});

// Save initial page state for popstate
history.replaceState({ docsUrl: location.pathname }, "", location.pathname);

// Auth state changes — also sync session to cookies for Next.js SSO
supabase.auth.onAuthStateChange((_event, session) => {
  if (typeof window.__authSync !== "undefined") {
    if (session) {
      window.__authSync.syncToCookies(session);
    } else {
      window.__authSync.clearCookies();
    }
  }
  void updateMemberAccess(session?.user || null);
});

// Initial load
getCurrentUser().then((user) => updateMemberAccess(user));
