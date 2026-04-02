const BASE = 'http://localhost:8080';

async function fetchWithAuth(path, options = {}) {
  const { headers = {}, ...rest } = options;
  const token = localStorage.getItem('authToken');

  const response = await fetch(`http://localhost:8080${path}`, {
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
  },

  async publish(id) {
    return fetchWithAuth(`/api/courses/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ is_published: true })
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
  },

  async myStudents() {
    return fetchWithAuth('/api/teacher/my-students');
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

// Assignments API
const assignmentsAPI = {
  async create(course_id, title, description, total_points, due_date, file_url) {
    return fetchWithAuth('/api/assignments', {
      method: 'POST',
      body: JSON.stringify({ course_id, title, description, total_points, due_date, file_url })
    });
  },

  async list(course_id) {
    const url = course_id ? `/api/assignments?course_id=${course_id}` : '/api/assignments';
    return fetchWithAuth(url);
  },

  async get(id) {
    return fetchWithAuth(`/api/assignments/${id}`);
  },

  async update(id, data) {
    return fetchWithAuth(`/api/assignments/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data)
    });
  },

  async delete(id) {
    return fetchWithAuth(`/api/assignments/${id}`, {
      method: 'DELETE'
    });
  },

  async getSubmissions(id) {
    return fetchWithAuth(`/api/assignments/${id}/submissions`);
  },

  async gradeSubmission(assignmentId, submissionId, points_given, teacher_feedback) {
    return fetchWithAuth(`/api/assignments/${assignmentId}/submissions/${submissionId}`, {
      method: 'PATCH',
      body: JSON.stringify({ points_given, teacher_feedback })
    });
  }
};

// Templates API
const templatesAPI = {
  async list() {
    return fetchWithAuth('/api/templates');
  },

  async create(name, description, total_points, file_url) {
    return fetchWithAuth('/api/templates', {
      method: 'POST',
      body: JSON.stringify({ name, description, total_points, file_url })
    });
  },

  async delete(id) {
    return fetchWithAuth(`/api/templates/${id}`, {
      method: 'DELETE'
    });
  }
};

// Student Assignments API
const studentAssignmentsAPI = {
  async list() {
    return fetchWithAuth('/api/student/assignments');
  },

  async get(id) {
    return fetchWithAuth(`/api/student/assignments/${id}`);
  },

  async submit(id, submission_link) {
    return fetchWithAuth(`/api/assignments/${id}/submit`, {
      method: 'POST',
      body: JSON.stringify({ submission_link })
    });
  }
};