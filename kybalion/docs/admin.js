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

const authOpenBtn = document.getElementById("authOpenBtn");
const userDisplay = document.getElementById("userDisplay");
const headerSignOutBtn = document.getElementById("headerSignOutBtn");
const authForm = document.getElementById("authForm");
const authEmail = document.getElementById("authEmail");
const authPassword = document.getElementById("authPassword");
const authStatus = document.getElementById("authStatus");
const authWarning = document.getElementById("authWarning");
const uploadPanel = document.getElementById("uploadPanel");
const uploadInput = document.getElementById("uploadInput");
const uploadBtn = document.getElementById("uploadBtn");
const uploadStatus = document.getElementById("uploadStatus");
const docTableBody = document.querySelector(".doc-table tbody");
const docsContent = document.querySelector("[data-docs-content]");
const accessGate = document.getElementById("accessGate");
let chooseFileBtn = null;
let fileNameEl = null;

const uploadRow = uploadInput?.closest(".upload-row");
if (uploadRow && uploadInput) {
  // Enable multiple file and folder selection
  uploadInput.classList.add("file-input-hidden");
  uploadInput.setAttribute("multiple", "");
  uploadInput.setAttribute("webkitdirectory", "");
  
  chooseFileBtn = document.createElement("button");
  chooseFileBtn.type = "button";
  chooseFileBtn.className = "button secondary file-choose-btn";
  chooseFileBtn.textContent = "Choose Files";

  // Add folder button
  const chooseFolderBtn = document.createElement("button");
  chooseFolderBtn.type = "button";
  chooseFolderBtn.className = "button secondary file-choose-btn";
  chooseFolderBtn.textContent = "Choose Folder";

  fileNameEl = document.createElement("span");
  fileNameEl.className = "file-name";
  fileNameEl.textContent = "No files chosen";

  // Create a separate input for files only (no webkitdirectory)
  const fileOnlyInput = document.createElement("input");
  fileOnlyInput.type = "file";
  fileOnlyInput.multiple = true;
  fileOnlyInput.classList.add("file-input-hidden");
  fileOnlyInput.id = "fileOnlyInput";
  uploadRow.appendChild(fileOnlyInput);

  uploadRow.insertBefore(chooseFileBtn, uploadInput);
  uploadRow.insertBefore(chooseFolderBtn, uploadInput);
  if (uploadBtn) {
    uploadRow.insertBefore(fileNameEl, uploadBtn);
  } else {
    uploadRow.appendChild(fileNameEl);
  }

  // Choose Files button - opens file picker (multiple files)
  chooseFileBtn.addEventListener("click", () => fileOnlyInput.click());
  
  // Choose Folder button - opens folder picker
  chooseFolderBtn.addEventListener("click", () => uploadInput.click());

  // Sync file selection from fileOnlyInput to display
  fileOnlyInput.addEventListener("change", () => {
    if (fileOnlyInput.files && fileOnlyInput.files.length > 0) {
      const count = fileOnlyInput.files.length;
      fileNameEl.textContent = count === 1 
        ? fileOnlyInput.files[0].name 
        : `${count} files selected`;
      uploadStatus.textContent = "Ready to upload.";
    }
  });
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

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

const setAdminState = (user, isAdmin = null) => {
  const email = user?.email?.toLowerCase() || "";
  // Use passed isAdmin if provided, else fall back to email list
  const adminAccess = isAdmin !== null ? isAdmin : adminEmails.includes(email);

  if (userDisplay) {
    userDisplay.textContent = email ? `Signed in as ${email}` : "";
    userDisplay.classList.toggle("is-hidden", !email);
  }

  if (authOpenBtn) {
    authOpenBtn.classList.toggle("is-hidden", Boolean(email));
  }

  if (headerSignOutBtn) {
    headerSignOutBtn.classList.toggle("is-hidden", !email);
  }

  if (authForm) {
    authForm.classList.toggle("is-hidden", Boolean(email));
  }

  if (authWarning) {
    authWarning.classList.toggle("is-hidden", !email || adminAccess);
  }

  if (uploadPanel) {
    uploadPanel.classList.remove("is-hidden");
    uploadPanel.classList.toggle("is-disabled", !adminAccess);
  }

  if (uploadInput) {
    uploadInput.disabled = !adminAccess;
  }

  if (uploadBtn) {
    uploadBtn.disabled = !adminAccess;
  }

  if (chooseFileBtn) {
    chooseFileBtn.disabled = !adminAccess;
  }

  if (uploadStatus && !adminAccess) {
    uploadStatus.textContent = "Admin access required to upload.";
  }

  if (authStatus) {
    if (!email) {
      authStatus.textContent = "Sign in to upload or edit documents.";
    } else if (adminAccess) {
      authStatus.textContent = "Admin access granted. You can upload files.";
    } else {
      authStatus.textContent = "Signed in, but not an admin.";
    }
  }

  return adminAccess;
};

const getUserEmail = (user) => (user?.email || "").toLowerCase();

const getActiveMember = async (user) => {
  if (!user) return false;
  const email = getUserEmail(user);
  if (!email) return false;
  const { data, error } = await supabase
    .from(membersTable)
    .select("status, group")
    .eq("email", email)
    .maybeSingle();
  if (error) return false;
  return data?.status === "active" ? data : null;
};

const setAccessState = (canView) => {
  if (docsContent) {
    docsContent.classList.toggle("is-hidden", !canView);
  }
  if (accessGate) {
    accessGate.classList.toggle("is-hidden", canView);
  }
  if (!canView) {
    uploadPanel?.classList.add("is-hidden");
  }
};

const updateMemberAccess = async (user) => {
  const member = await getActiveMember(user);
  const isActive = Boolean(member);
  const isAdmin = member?.group === "admin" || adminEmails.includes(getUserEmail(user));
  setAdminState(user, isAdmin);
  setAccessState(isActive);
  if (!isActive && authStatus) {
    authStatus.textContent = "Access restricted to active members.";
  }
  // Load docs from bucket if user has access
  if (isActive) {
    await loadDocsFromBucket();
  }
};

const appendRow = ({ name, modified, size, url }) => {
  if (!docTableBody) return;

  const row = document.createElement("tr");
  row.innerHTML = `
    <td><a class="doc-link" href="${url}">${name}</a></td>
    <td>${modified}</td>
    <td>David Lloyd</td>
    <td>${size}</td>
  `;
  docTableBody.prepend(row);
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

  // Clear existing rows (except header)
  docTableBody.innerHTML = "";

  const emptyState = document.getElementById("emptyState");
  let fileCount = 0;

  for (const file of files) {
    // Skip folders (they have no metadata)
    if (!file.metadata) continue;

    fileCount++;

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
    });
  }

  // Show/hide empty state
  if (emptyState) {
    emptyState.classList.toggle("is-hidden", fileCount > 0);
  }
};

const getCurrentUser = async () => {
  const { data } = await supabase.auth.getSession();
  return data?.session?.user || null;
};

const handleSignIn = async (event) => {
  event.preventDefault();
  if (!authEmail || !authPassword) return;

  authStatus.textContent = "Signing in…";
  const { error } = await supabase.auth.signInWithPassword({
    email: authEmail.value.trim(),
    password: authPassword.value,
  });

  if (error) {
    authStatus.textContent = `Sign-in failed: ${error.message}`;
    return;
  }

  authStatus.textContent = "Signed in.";
  authForm.reset();
};

const handleSignOut = async () => {
  await supabase.auth.signOut();
};

const handleUpload = async () => {
  if (!uploadInput) return;

  // Check both inputs for files
  const fileOnlyInput = document.getElementById("fileOnlyInput");
  const filesToUpload = (fileOnlyInput?.files?.length > 0) 
    ? Array.from(fileOnlyInput.files) 
    : (uploadInput.files?.length > 0) 
      ? Array.from(uploadInput.files) 
      : [];

  if (filesToUpload.length === 0) {
    uploadStatus.textContent = "Choose files or a folder to upload.";
    return;
  }

  const user = await getCurrentUser();
  const isAdmin = setAdminState(user);
  if (!isAdmin) {
    uploadStatus.textContent = "Admin access required to upload.";
    return;
  }

  const total = filesToUpload.length;
  let uploaded = 0;
  let failed = 0;

  for (const file of filesToUpload) {
    // Use relative path for folder uploads, or just filename
    const fileName = file.webkitRelativePath || file.name;
    const path = `${docsPrefix}${fileName}`;
    uploadStatus.textContent = `Uploading ${uploaded + 1}/${total}: ${file.name}…`;

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

  // Clear inputs
  uploadInput.value = "";
  if (fileOnlyInput) fileOnlyInput.value = "";
  if (fileNameEl) {
    fileNameEl.textContent = "No files chosen";
  }

  // Show result and refresh once
  if (failed > 0) {
    uploadStatus.textContent = `Uploaded ${uploaded}/${total} files. ${failed} failed. Refreshing…`;
  } else {
    uploadStatus.textContent = `Uploaded ${uploaded} file${uploaded !== 1 ? 's' : ''}. Refreshing…`;
  }

  // Single refresh after all uploads complete
  setTimeout(() => {
    window.location.reload();
  }, 1500);
};

if (authForm) {
  authForm.addEventListener("submit", handleSignIn);
}

if (headerSignOutBtn) {
  headerSignOutBtn.addEventListener("click", handleSignOut);
}

if (uploadBtn) {
  uploadBtn.addEventListener("click", handleUpload);
}

if (uploadInput) {
  uploadInput.addEventListener("change", () => {
    if (uploadInput.files && uploadInput.files.length > 0) {
      const count = uploadInput.files.length;
      if (fileNameEl) {
        fileNameEl.textContent = count === 1 
          ? uploadInput.files[0].name 
          : `${count} files selected`;
      }
      if (uploadStatus) {
        uploadStatus.textContent = "Ready to upload.";
      }
    }
  });
}

supabase.auth.onAuthStateChange((_event, session) => {
  void updateMemberAccess(session?.user || null);
});

getCurrentUser().then((user) => updateMemberAccess(user));
