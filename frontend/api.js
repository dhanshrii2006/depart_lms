const BASE = 'http://localhost:4000';

async function fetchWithAuth(path, options = {}) {
  const { headers = {}, ...rest } = options;
  const token = localStorage.getItem('authToken');

  const response = await fetch(`http://localhost:4000${path}`, {
    ...rest,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      ...headers
    }
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || 'Request failed');
  }
  return response.json();
}

// Auth API
const authAPI = {
  async login(email, password) {
    return fetchWithAuth('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
  },

  async register(name, email, password, role) {
    return fetchWithAuth('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password, role })
    });
  },

  async logout() {
    return fetchWithAuth('/api/auth/logout', {
      method: 'POST'
    });
  },

  async me() {
    return fetchWithAuth('/api/auth/me');
  }
};

// Courses API
const coursesAPI = {
  async list() {
    return fetchWithAuth('/api/courses');
  },

  async get(id) {
    return fetchWithAuth(`/api/courses/${id}`);
  },

  async create(title, description) {
    return fetchWithAuth('/api/courses', {
      method: 'POST',
      body: JSON.stringify({ title, description })
    });
  }
};

// Enrollments API
const enrollmentsAPI = {
  async join(invite_code) {
    return fetchWithAuth('/api/enrollments/join', {
      method: 'POST',
      body: JSON.stringify({ invite_code })
    });
  },

  async myCourses() {
    return fetchWithAuth('/api/enrollments/my-courses');
  }
};

// Health check
async function healthCheck() {
  try {
    const response = await fetch(`${BASE}/api/health`);
    return response.ok;
  } catch (error) {
    return false;
  }
}
