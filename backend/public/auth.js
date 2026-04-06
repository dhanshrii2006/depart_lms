// Authentication utilities

function checkAuth(requiredRole) {
  const userRole = localStorage.getItem('userRole');
  
  if (!userRole) {
    window.location.href = 'index.html';
    return;
  }
  
  if (requiredRole && userRole !== requiredRole) {
    window.location.href = 'index.html';
    return;
  }
}

function logout() {
  // Clear localStorage
  localStorage.removeItem('userRole');
  localStorage.removeItem('userName');
  localStorage.removeItem('userInitials');
  localStorage.removeItem('authToken');
  localStorage.removeItem('token');
  localStorage.removeItem('userId');
  localStorage.removeItem('userEmail');
  
  // Call logout endpoint
  fetch('http://localhost:8080/api/auth/logout', {
    method: 'POST',
    credentials: 'include'
  }).catch(err => console.error('Logout error:', err));
  
  // Redirect to home
  window.location.href = 'index.html';
}

function getUserRole() {
  return localStorage.getItem('userRole');
}

function getUserName() {
  return localStorage.getItem('userName');
}

function getUserInitials() {
  const name = localStorage.getItem('userName');
  if (!name) return 'U';
  
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function getUserId() {
  return localStorage.getItem('userId');
}

// Get enrolled students for a course
async function getEnrolledStudents(courseId) {
  try {
    const response = await fetch(`/api/courses/${courseId}/enrolled-students`, {
      method: 'GET',
      credentials: 'include'
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch students: ${response.statusText}`);
    }

    const data = await response.json();
    return data.students || [];
  } catch (error) {
    console.error('Error fetching enrolled students:', error);
    return [];
  }
}

// Get all courses with student count
async function getTeacherCourses() {
  try {
    const response = await fetch('/api/courses', {
      method: 'GET',
      credentials: 'include'
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch courses: ${response.statusText}`);
    }

    const data = await response.json();
    return data || [];
  } catch (error) {
    console.error('Error fetching courses:', error);
    return [];
  }
}

// Mark notifications as seen for a course
function markNotificationSeen(courseId) {
  const notificationsKey = `newEnrollments_${courseId}`;
  localStorage.removeItem(notificationsKey);
  updateNotificationBadge();
}

// Get count of new enrollments
function getNewEnrollmentCount() {
  let totalCount = 0;
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith('newEnrollments_')) {
      const count = localStorage.getItem(key);
      if (count) totalCount += parseInt(count, 10);
    }
  }
  return totalCount;
}

// Update notification badge display
function updateNotificationBadge() {
  const badge = document.getElementById('notificationBadge');
  if (!badge) return;

  const count = getNewEnrollmentCount();
  if (count > 0) {
    badge.style.display = 'flex';
    badge.textContent = count > 99 ? '99+' : count;
  } else {
    badge.style.display = 'none';
  }
}

// Simulate new enrollment notification (called by teacher dashboard)
// In production, this would come from WebSocket or polling
function setNewEnrollmentCount(courseId, count) {
  if (count > 0) {
    localStorage.setItem(`newEnrollments_${courseId}`, count.toString());
  }
  updateNotificationBadge();
}
