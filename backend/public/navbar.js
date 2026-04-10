/**
 * Shared Navbar Component
 * Provides consistent navigation across all student pages
 */

function renderNavbar() {
  const navbarHTML = `
    <aside class="sidebar">
      <div class="sidebar-logo">Acadify</div>
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

  // Attach logout handler
  const logoutBtn = document.getElementById('navLogoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', (e) => {
      e.preventDefault();
      logout();
    });
  }
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
