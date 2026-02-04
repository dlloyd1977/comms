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
