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
  uploadInput.classList.add("file-input-hidden");
  chooseFileBtn = document.createElement("button");
  chooseFileBtn.type = "button";
  chooseFileBtn.className = "button secondary file-choose-btn";
  chooseFileBtn.textContent = "Choose File";

  fileNameEl = document.createElement("span");
  fileNameEl.className = "file-name";
  fileNameEl.textContent = "No file chosen";

  uploadRow.insertBefore(chooseFileBtn, uploadInput);
  if (uploadBtn) {
    uploadRow.insertBefore(fileNameEl, uploadBtn);
  } else {
    uploadRow.appendChild(fileNameEl);
  }

  chooseFileBtn.addEventListener("click", () => uploadInput.click());
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

  if (!uploadInput.files || uploadInput.files.length === 0) {
    uploadInput.click();
    uploadStatus.textContent = "Choose a file to upload.";
    return;
  }

  const user = await getCurrentUser();
  const isAdmin = setAdminState(user);
  if (!isAdmin) {
    uploadStatus.textContent = "Admin access required to upload.";
    return;
  }

  const file = uploadInput.files[0];
  const path = `${docsPrefix}${file.name}`;
  uploadStatus.textContent = `Uploading ${file.name}…`;

  const { data, error } = await supabase.storage
    .from(docsBucket)
    .upload(path, file, { upsert: true });

  if (error) {
    if (error.message?.toLowerCase().includes("bucket not found")) {
      uploadStatus.textContent = "Upload failed: bucket not found. Create the kybalion-docs bucket in Supabase.";
    } else {
      uploadStatus.textContent = `Upload failed: ${error.message}`;
    }
    return;
  }

  const { data: publicUrlData } = supabase.storage
    .from(docsBucket)
    .getPublicUrl(data.path);

  appendRow({
    name: file.name,
    modified: formatTimestamp(new Date()),
    size: formatFileSize(file.size),
    url: publicUrlData.publicUrl,
  });

  uploadStatus.textContent = "Upload complete. Refreshing…";
  uploadInput.value = "";
  if (fileNameEl) {
    fileNameEl.textContent = "No file chosen";
  }

  // Refresh page after short delay so user sees success message
  setTimeout(() => {
    window.location.reload();
  }, 1000);
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
      uploadStatus.textContent = "Ready to upload.";
      if (fileNameEl) {
        fileNameEl.textContent = uploadInput.files[0].name;
      }
    }
  });
}

supabase.auth.onAuthStateChange((_event, session) => {
  void updateMemberAccess(session?.user || null);
});

getCurrentUser().then((user) => updateMemberAccess(user));
