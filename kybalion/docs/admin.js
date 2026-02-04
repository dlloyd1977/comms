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

const setAdminState = (user) => {
  const email = user?.email?.toLowerCase() || "";
  const isAdmin = adminEmails.includes(email);

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
    authWarning.classList.toggle("is-hidden", !email || isAdmin);
  }

  if (uploadPanel) {
    uploadPanel.classList.remove("is-hidden");
    uploadPanel.classList.toggle("is-disabled", !isAdmin);
  }

  if (uploadInput) {
    uploadInput.disabled = !isAdmin;
  }

  if (uploadBtn) {
    uploadBtn.disabled = !isAdmin;
  }

  if (uploadStatus && !isAdmin) {
    uploadStatus.textContent = "Admin access required to upload.";
  }

  if (authStatus) {
    if (!email) {
      authStatus.textContent = "Sign in to upload or edit documents.";
    } else if (isAdmin) {
      authStatus.textContent = "Admin access granted. You can upload files.";
    } else {
      authStatus.textContent = "Signed in, but not an admin.";
    }
  }

  return isAdmin;
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
    uploadStatus.textContent = `Upload failed: ${error.message}`;
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

  uploadStatus.textContent = "Upload complete.";
  uploadInput.value = "";
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
    }
  });
}

supabase.auth.onAuthStateChange((_event, session) => {
  setAdminState(session?.user || null);
});

getCurrentUser().then(setAdminState);
