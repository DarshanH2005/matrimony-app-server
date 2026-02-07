/**
 * Updated Admin Panel JavaScript
 * With language support and WhatsApp sharing
 */

const API_BASE = "/api/admin";
const CONFIG_API = "/api/config";

// State
let currentLang = localStorage.getItem("adminLang") || "en";
let langStrings = {};
let brokerConfig = {};

// Get stored token
function getToken() {
  return localStorage.getItem("adminToken");
}

// Get admin info
function getAdminInfo() {
  const info = localStorage.getItem("adminInfo");
  return info ? JSON.parse(info) : null;
}

// Check authentication
function checkAuth() {
  const token = getToken();
  if (!token) {
    window.location.href = "index.html";
    return false;
  }

  // Update admin info in sidebar
  const admin = getAdminInfo();
  if (admin) {
    const avatarEl = document.getElementById("adminAvatar");
    const nameEl = document.getElementById("adminName");
    const roleEl = document.getElementById("adminRole");

    if (avatarEl) avatarEl.textContent = admin.name[0].toUpperCase();
    if (nameEl) nameEl.textContent = admin.name;
    if (roleEl) roleEl.textContent = admin.role.replace("_", " ");
  }

  // Load config and language
  loadConfig();
  loadLanguage(currentLang);

  return true;
}

// Load broker config
async function loadConfig() {
  try {
    const response = await fetch(CONFIG_API);
    const data = await response.json();
    if (data.success) {
      brokerConfig = data.data;
      applyBranding();
    }
  } catch (error) {
    console.error("Failed to load config:", error);
  }
}

// Apply branding
function applyBranding() {
  // Update page title
  document.title = `${brokerConfig.broker?.name || "Admin"} - Dashboard`;

  // Update colors
  const colors = brokerConfig.branding?.colors;
  if (colors) {
    document.documentElement.style.setProperty("--accent", colors.primary);
    document.documentElement.style.setProperty("--gold", colors.secondary);
  }

  // Update broker name in sidebar
  const sidebarTitle = document.querySelector(".sidebar-header h2");
  if (sidebarTitle && brokerConfig.broker?.name) {
    sidebarTitle.textContent = brokerConfig.broker.name.split(" ")[0];
  }
}

// Load language
async function loadLanguage(langCode) {
  try {
    const response = await fetch(`${CONFIG_API}/lang/${langCode}`);
    const data = await response.json();
    if (data.success) {
      langStrings = data.data.strings;
      currentLang = langCode;
      localStorage.setItem("adminLang", langCode);
      applyLanguage();
      updateLanguageSelector();
    }
  } catch (error) {
    console.error("Failed to load language:", error);
  }
}

// Apply language strings to page
function applyLanguage() {
  // Update elements with data-lang attribute
  document.querySelectorAll("[data-lang]").forEach((el) => {
    const key = el.getAttribute("data-lang");
    const parts = key.split(".");
    let value = langStrings;
    for (const part of parts) {
      value = value?.[part];
    }
    if (value) {
      el.textContent = value;
    }
  });
}

// Update language selector
function updateLanguageSelector() {
  const selector = document.getElementById("langSelector");
  if (selector) {
    selector.value = currentLang;
  }
}

// Change language
function changeLanguage(langCode) {
  loadLanguage(langCode);
}

// API call helper
async function api(endpoint, options = {}) {
  const token = getToken();

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    if (response.status === 401) {
      localStorage.removeItem("adminToken");
      localStorage.removeItem("adminInfo");
      window.location.href = "index.html";
    }
    throw new Error(data.message || "API request failed");
  }

  return data.data;
}

// Logout
function logout() {
  localStorage.removeItem("adminToken");
  localStorage.removeItem("adminInfo");
  window.location.href = "index.html";
}

// Show toast notification
function showToast(type, title, message = "") {
  const container = document.getElementById("toastContainer");
  if (!container) return;

  const icons = {
    success:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>',
    error:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>',
    warning:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>',
    info: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>',
  };

  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  toast.innerHTML = `
    <div class="toast-icon">${icons[type]}</div>
    <div class="toast-content">
      <div class="toast-title">${title}</div>
      ${message ? `<div class="toast-message">${message}</div>` : ""}
    </div>
    <button class="toast-close" onclick="this.parentElement.remove()">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:16px;height:16px">
        <line x1="18" y1="6" x2="6" y2="18"></line>
        <line x1="6" y1="6" x2="18" y2="18"></line>
      </svg>
    </button>
  `;

  container.appendChild(toast);

  // Auto remove after 5 seconds
  setTimeout(() => {
    toast.style.opacity = "0";
    setTimeout(() => toast.remove(), 300);
  }, 5000);
}

// Format date
function formatDate(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diff = now - date;

  // Less than 24 hours
  if (diff < 86400000) {
    const hours = Math.floor(diff / 3600000);
    if (hours < 1) {
      const mins = Math.floor(diff / 60000);
      return mins < 1 ? "Just now" : `${mins}m ago`;
    }
    return `${hours}h ago`;
  }

  // Less than 7 days
  if (diff < 604800000) {
    const days = Math.floor(diff / 86400000);
    return `${days}d ago`;
  }

  // Default format
  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

// Capitalize string
function capitalize(str) {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1).replace(/_/g, " ");
}

// Confirm dialog
function confirmAction(message) {
  return confirm(message);
}

// ===================
// WHATSAPP SHARING
// ===================

// Share profile on WhatsApp
function shareOnWhatsApp(user) {
  const brokerPhone =
    brokerConfig.broker?.whatsapp || brokerConfig.broker?.phone || "";
  const brokerName = brokerConfig.broker?.name || "Lagnam";

  const profileText = `
*${user.basicInfo?.name || "Profile"}*
━━━━━━━━━━━━━━━━

👤 *Basic Info*
• Age: ${user.basicInfo?.age || "-"}
• Gender: ${capitalize(user.basicInfo?.gender) || "-"}
• Height: ${user.basicInfo?.height ? user.basicInfo.height + " cm" : "-"}
• City: ${user.basicInfo?.city || "-"}, ${user.basicInfo?.state || "-"}
• Marital Status: ${capitalize(user.basicInfo?.maritalStatus) || "-"}

🙏 *Cultural Background*
• Religion: ${capitalize(user.culturalInfo?.religion) || "-"}
• Caste: ${user.culturalInfo?.caste || "-"}
• Mother Tongue: ${user.culturalInfo?.motherTongue || "-"}

💼 *Career & Education*
• Education: ${capitalize(user.careerInfo?.education) || "-"}
• Profession: ${user.careerInfo?.profession || "-"}
• Income: ${capitalize(user.careerInfo?.annualIncome) || "-"}

━━━━━━━━━━━━━━━━
📞 Contact: ${brokerPhone}
🏷️ ${brokerName}
`.trim();

  const encodedText = encodeURIComponent(profileText);
  const whatsappUrl = `https://wa.me/?text=${encodedText}`;
  window.open(whatsappUrl, "_blank");
}

// Share multiple profiles
function shareProfileLink(userId) {
  const baseUrl = window.location.origin;
  const shareUrl = `${baseUrl}/profile/${userId}`;
  const text = `Check out this profile: ${shareUrl}`;
  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
  window.open(whatsappUrl, "_blank");
}

// Share user by ID (fetches user data first)
async function shareUserOnWhatsApp(userId) {
  try {
    showToast("info", "Loading profile...");
    const data = await api(`/users/${userId}`);
    if (data && data.user) {
      shareOnWhatsApp(data.user);
    }
  } catch (error) {
    showToast("error", "Failed to load profile");
  }
}

// ===================
// PASSWORD & MODAL
// ===================

// Show change password modal
function showChangePassword() {
  const overlay = document.createElement("div");
  overlay.className = "modal-overlay active";
  overlay.innerHTML = `
    <div class="modal">
      <div class="modal-header">
        <h3 class="modal-title" data-lang="common.changePassword">Change Password</h3>
        <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:24px;height:24px">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>
      <form id="changePasswordForm" class="modal-body">
        <div class="input-group">
          <label>Current Password</label>
          <input type="password" id="currentPassword" required>
        </div>
        <div class="input-group">
          <label>New Password</label>
          <input type="password" id="newPassword" required minlength="6">
        </div>
        <div class="input-group">
          <label>Confirm New Password</label>
          <input type="password" id="confirmPassword" required minlength="6">
        </div>
      </form>
      <div class="modal-footer">
        <button class="btn btn-secondary btn-lg" onclick="this.closest('.modal-overlay').remove()">Cancel</button>
        <button class="btn btn-primary btn-lg" onclick="changePassword()">Update Password</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);
}

// Handle password change
async function changePassword() {
  const currentPassword = document.getElementById("currentPassword").value;
  const newPassword = document.getElementById("newPassword").value;
  const confirmPassword = document.getElementById("confirmPassword").value;

  if (newPassword !== confirmPassword) {
    showToast("error", "Passwords do not match");
    return;
  }

  if (newPassword.length < 6) {
    showToast("error", "Password must be at least 6 characters");
    return;
  }

  try {
    await api("/change-password", {
      method: "PUT",
      body: JSON.stringify({ currentPassword, newPassword }),
    });

    showToast("success", "Password changed successfully");
    document.querySelector(".modal-overlay").remove();
  } catch (error) {
    showToast("error", error.message);
  }
}

// Pagination helper
function renderPagination(container, pagination, callback) {
  const { page, pages } = pagination;

  let html = "";

  // Previous button
  html += `<button class="btn-lg" ${page <= 1 ? "disabled" : ""} onclick="${callback}(${page - 1})">«</button>`;

  // Page numbers
  const startPage = Math.max(1, page - 2);
  const endPage = Math.min(pages, page + 2);

  if (startPage > 1) {
    html += `<button onclick="${callback}(1)">1</button>`;
    if (startPage > 2) html += `<button disabled>...</button>`;
  }

  for (let i = startPage; i <= endPage; i++) {
    html += `<button class="${i === page ? "active" : ""}" onclick="${callback}(${i})">${i}</button>`;
  }

  if (endPage < pages) {
    if (endPage < pages - 1) html += `<button disabled>...</button>`;
    html += `<button onclick="${callback}(${pages})">${pages}</button>`;
  }

  // Next button
  html += `<button class="btn-lg" ${page >= pages ? "disabled" : ""} onclick="${callback}(${page + 1})">»</button>`;

  container.innerHTML = html;
}

// Get translation
function t(key) {
  const parts = key.split(".");
  let value = langStrings;
  for (const part of parts) {
    value = value?.[part];
  }
  return value || key;
}

// ===================
// MOBILE MENU
// ===================

// Toggle mobile sidebar
function toggleSidebar() {
  const sidebar = document.getElementById("sidebar");
  const overlay = document.getElementById("sidebarOverlay");

  if (sidebar) {
    sidebar.classList.toggle("open");
  }
  if (overlay) {
    overlay.classList.toggle("active");
  }
}

// Close sidebar when overlay clicked
function closeSidebar() {
  const sidebar = document.getElementById("sidebar");
  const overlay = document.getElementById("sidebarOverlay");

  if (sidebar) {
    sidebar.classList.remove("open");
  }
  if (overlay) {
    overlay.classList.remove("active");
  }
}

// Initialize mobile menu on page load
function initMobileMenu() {
  // Create menu toggle button if it doesn't exist
  if (!document.getElementById("menuToggle")) {
    const menuBtn = document.createElement("button");
    menuBtn.id = "menuToggle";
    menuBtn.className = "menu-toggle";
    menuBtn.onclick = toggleSidebar;
    menuBtn.innerHTML = `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <line x1="3" y1="6" x2="21" y2="6"></line>
        <line x1="3" y1="12" x2="21" y2="12"></line>
        <line x1="3" y1="18" x2="21" y2="18"></line>
      </svg>
    `;
    document.body.appendChild(menuBtn);
  }

  // Create overlay if it doesn't exist
  if (!document.getElementById("sidebarOverlay")) {
    const overlay = document.createElement("div");
    overlay.id = "sidebarOverlay";
    overlay.className = "sidebar-overlay";
    overlay.onclick = closeSidebar;
    document.body.appendChild(overlay);
  }

  // Close sidebar on nav link click (mobile)
  document.querySelectorAll(".nav-link").forEach((link) => {
    link.addEventListener("click", () => {
      if (window.innerWidth <= 1024) {
        closeSidebar();
      }
    });
  });
}

// Close sidebar on window resize to desktop
window.addEventListener("resize", () => {
  if (window.innerWidth > 1024) {
    closeSidebar();
  }
});

// Auto-init mobile menu when DOM is ready
document.addEventListener("DOMContentLoaded", initMobileMenu);
