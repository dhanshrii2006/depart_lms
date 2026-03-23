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
  
  // Call logout endpoint
  fetch('http://localhost:5000/api/auth/logout', {
    method: 'POST',
    credentials: 'include'
  }).finally(() => {
    window.location.href = 'index.html';
  });
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
