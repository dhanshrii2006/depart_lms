/**
 * Shared Navbar Component with Notification Bell
 * Provides consistent navigation and notifications across all student pages
 */

let notificationDropdownOpen = false;
let notificationRefreshInterval = null;

function renderNavbar() {
  const navbarHTML = `
    <aside class="sidebar">
      <div class="sidebar-logo">Acadify</div>
      
      <!-- Notification Bell -->
      <div class="notification-bell-wrapper">
        <button id="notificationBell" class="notification-bell" title="Notifications">
          🔔
          <span id="unreadBadge" class="unread-badge" style="display: none;">0</span>
        </button>
        
        <!-- Notification Dropdown Panel -->
        <div id="notificationPanel" class="notification-panel" style="display: none;">
          <div class="notification-header">
            <h3>Notifications</h3>
            <button id="closeNotificationPanel" class="close-btn" title="Close">&times;</button>
          </div>
          <div id="notificationList" class="notification-list">
            <div class="notification-loading">Loading...</div>
          </div>
        </div>
      </div>
      
      <ul class="sidebar-menu">
        <li><a href="student-dashboard.html" class="nav-link"><i class="fas fa-th-large mr-2"></i> Dashboard</a></li>
        <li><a href="my-courses.html" class="nav-link"><i class="fas fa-book mr-2"></i> My Library</a></li>
        <li><a href="browse-courses.html" class="nav-link"><i class="fas fa-search mr-2"></i> Explore</a></li>
        <li><a href="calendar.html" class="nav-link"><i class="fas fa-calendar mr-2"></i> Calendar</a></li>
        <li><a href="settings.html" class="nav-link"><i class="fas fa-cog mr-2"></i> Settings</a></li>
        <li class="mt-4"><a href="#" id="navLogoutBtn" class="nav-link"><i class="fas fa-sign-out-alt mr-2"></i> Exit</a></li>
      </ul>
    </aside>
  `;

  // Find main layout and insert sidebar at the beginning
  const layout = document.querySelector('.layout');
  if (layout) {
    // Create a temporary container
    const temp = document.createElement('div');
    temp.innerHTML = navbarHTML;
    const newSidebar = temp.firstElementChild;
    
    // Remove any existing sidebar
    const existingSidebar = layout.querySelector('.sidebar');
    if (existingSidebar) {
      existingSidebar.remove();
    }
    
    // Insert new sidebar at the beginning of layout
    layout.insertBefore(newSidebar, layout.firstChild);
  }

  // Set active link based on current page
  setActiveNavLink();

  // Attach event listeners
  attachNavbarListeners();

  // Load and refresh notifications
  loadNotifications();
  startNotificationPolling();
}

function attachNavbarListeners() {
  // Notification bell click
  const notificationBell = document.getElementById('notificationBell');
  if (notificationBell) {
    notificationBell.addEventListener('click', toggleNotificationPanel);
  }

  // Close notification panel button
  const closeBtn = document.getElementById('closeNotificationPanel');
  if (closeBtn) {
    closeBtn.addEventListener('click', closeNotificationPanel);
  }

  // Close panel when clicking outside
  document.addEventListener('click', (e) => {
    const panel = document.getElementById('notificationPanel');
    const bell = document.getElementById('notificationBell');
    const wrapper = document.querySelector('.notification-bell-wrapper');
    
    if (notificationDropdownOpen && !wrapper?.contains(e.target)) {
      closeNotificationPanel();
    }
  });

  // Logout handler
  const logoutBtn = document.getElementById('navLogoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', (e) => {
      e.preventDefault();
      logout();
    });
  }
}

function toggleNotificationPanel() {
  const panel = document.getElementById('notificationPanel');
  if (panel) {
    if (notificationDropdownOpen) {
      closeNotificationPanel();
    } else {
      panel.style.display = 'block';
      notificationDropdownOpen = true;
      loadNotifications();
    }
  }
}

function closeNotificationPanel() {
  const panel = document.getElementById('notificationPanel');
  if (panel) {
    panel.style.display = 'none';
    notificationDropdownOpen = false;
  }
}

async function loadNotifications() {
  try {
    const response = await notificationsAPI.list(20, 0);
    const { notifications, unread_count } = response;

    // Update unread badge
    const badge = document.getElementById('unreadBadge');
    if (badge) {
      if (unread_count > 0) {
        badge.textContent = unread_count;
        badge.style.display = 'block';
      } else {
        badge.style.display = 'none';
      }
    }

    // Render notifications list
    const notificationList = document.getElementById('notificationList');
    if (notificationList) {
      if (notifications.length === 0) {
        notificationList.innerHTML = '<div class="notification-empty">No new notifications</div>';
      } else {
        notificationList.innerHTML = notifications.map(notif => {
          // Handle different notification types
          if (notif.type === 'assignment_graded') {
            return `
              <div class="notification-item ${notif.is_read ? 'read' : 'unread'}">
                <div class="notification-content">
                  <div class="notification-title">📋 Assignment Graded</div>
                  <div class="notification-subtitle">${notif.data?.assignment_title || 'Unknown Assignment'}</div>
                  <div class="notification-code-container">
                    <span class="notification-code">Your grade: ${notif.data?.percentage || 'N/A'}%</span>
                  </div>
                  <div class="notification-time">${formatTimeAgo(new Date(notif.created_at))}</div>
                </div>
                <button class="dismiss-btn" onclick="dismissNotification('${notif.id}')" title="Dismiss">
                  &times;
                </button>
              </div>
            `;
          } else {
            // Handle course_published type (original)
            return `
              <div class="notification-item ${notif.is_read ? 'read' : 'unread'}">
                <div class="notification-content">
                  <div class="notification-title">${notif.course_title || notif.data?.course_title}</div>
                  <div class="notification-subtitle">by ${notif.teacher_name || notif.data?.teacher_name}</div>
                  <div class="notification-code-container">
                    <code class="notification-code">${notif.invite_code || notif.data?.invite_code}</code>
                    <button class="copy-btn" onclick="copyNotificationCode('${notif.invite_code || notif.data?.invite_code}', '${notif.id}')" title="Copy code">
                      <i class="fas fa-copy"></i> Copy
                    </button>
                  </div>
                  <div class="notification-time">${formatTimeAgo(new Date(notif.created_at))}</div>
                </div>
                <button class="dismiss-btn" onclick="dismissNotification('${notif.id}')" title="Dismiss">
                  &times;
                </button>
              </div>
            `;
          }
        }).join('');
      }
    }
  } catch (error) {
    console.error('Failed to load notifications:', error);
    const notificationList = document.getElementById('notificationList');
    if (notificationList) {
      notificationList.innerHTML = '<div class="notification-error">Failed to load notifications</div>';
    }
  }
}

async function copyNotificationCode(code, notificationId) {
  try {
    // Copy to clipboard
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(code);
    } else {
      // Fallback for older browsers
      const textarea = document.createElement('textarea');
      textarea.value = code;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
    }

    // Show toast
    showCopyToast(`✓ Copied "${code}" to clipboard!`);

    // Mark as read
    await notificationsAPI.markAsRead(notificationId);
    loadNotifications();
  } catch (error) {
    console.error('Failed to copy code:', error);
    showCopyToast('Failed to copy code', true);
  }
}

async function dismissNotification(notificationId) {
  try {
    await notificationsAPI.delete(notificationId);
    loadNotifications();
  } catch (error) {
    console.error('Failed to dismiss notification:', error);
  }
}

function showCopyToast(message, isError = false) {
  const toast = document.createElement('div');
  toast.className = `copy-toast ${isError ? 'error' : 'success'}`;
  toast.textContent = message;
  toast.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    background: ${isError ? '#f56565' : '#48bb78'};
    color: white;
    padding: 12px 16px;
    border-radius: 8px;
    font-weight: 600;
    z-index: 10000;
    animation: slideUp 0.3s ease;
  `;
  
  document.body.appendChild(toast);
  
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transition = 'opacity 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 2000);
}

function startNotificationPolling() {
  // Poll every 30 seconds
  if (notificationRefreshInterval) {
    clearInterval(notificationRefreshInterval);
  }
  
  notificationRefreshInterval = setInterval(() => {
    if (document.visibilityState === 'visible') {
      loadNotifications();
    }
  }, 30000);
}

function formatTimeAgo(date) {
  const seconds = Math.floor((new Date() - date) / 1000);
  
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function setActiveNavLink() {
  const currentPage = window.location.pathname.split('/').pop() || 'student-dashboard.html';
  const navLinks = document.querySelectorAll('.nav-link');
  
  navLinks.forEach(link => {
    const href = link.getAttribute('href');
    if (href === currentPage || (currentPage === '' && href === 'student-dashboard.html')) {
      link.classList.add('active');
    } else {
      link.classList.remove('active');
    }
  });
}

// Initialize navbar when DOM is ready
document.addEventListener('DOMContentLoaded', renderNavbar);

// Clean up on page unload
window.addEventListener('beforeunload', () => {
  if (notificationRefreshInterval) {
    clearInterval(notificationRefreshInterval);
  }
});
