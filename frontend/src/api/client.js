import axios from 'axios';

export const api = axios.create({
  baseURL: 'http://localhost:5001/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Suppress console errors for expected auth failures
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Silently handle expected 401/403 errors on auth/me endpoint
    if (error.config.url === '/auth/me' && (error.response?.status === 401 || error.response?.status === 403)) {
      return Promise.reject(error);
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  logout: () => api.post('/auth/logout'),
  me: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/profile', data),
};

// Courses API
export const coursesAPI = {
  list: () => api.get('/courses'),
  get: (id) => api.get(`/courses/${id}`),
  create: (data) => api.post('/courses', data),
  createModule: (courseId, data) => api.post(`/courses/${courseId}/modules`, data),
  update: (id, data) => api.put(`/courses/${id}`, data),
  delete: (id) => api.delete(`/courses/${id}`),
  enrollByCode: (data) => api.post('/courses/enroll/code', data),
  getEnrollments: (id) => api.get(`/courses/${id}/enrollments`),
  getInviteCode: (id) => api.get(`/courses/${id}/invite-code`),
};

export const modulesAPI = {
  createLesson: (moduleId, data) => api.post(`/modules/${moduleId}/lessons`, data),
};

export const lessonsAPI = {
  attachVideo: (lessonId, data) => api.post(`/lessons/${lessonId}/videos`, data),
};

// Assignments API
export const assignmentsAPI = {
  list: (courseId) => api.get(`/assignments/${courseId}/assignments`),
  get: (id) => api.get(`/assignments/assignment/${id}`),
  create: (courseId, data) => {
    const file = data?.file instanceof File ? data.file : data?.file?.[0];

    if (!file) {
      const { file: _ignored, ...payload } = data || {};
      return api.post(`/assignments/${courseId}/assignments`, payload);
    }

    const formData = new FormData();
    formData.append('title', data?.title || '');
    formData.append('instructions', data?.instructions || '');
    formData.append('dueDate', data?.dueDate || '');
    formData.append('points', String(data?.points ?? 100));
    formData.append('file', file);

    return api.post(`/assignments/${courseId}/assignments`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  update: (id, data) => api.put(`/assignments/${id}`, data),
  delete: (id) => api.delete(`/assignments/${id}`),
  submit: (id, data) => {
    const file = data?.file instanceof File ? data.file : data?.file?.[0];
    const formData = new FormData();
    const driveLink = data?.drive_link ?? data?.driveLink ?? data?.linkUrl ?? '';
    const textComment = data?.text_comment ?? data?.textComment ?? data?.submissionText ?? '';

    formData.append('drive_link', driveLink || '');
    formData.append('text_comment', textComment || '');
    if (file) {
      formData.append('file', file);
    }
    return api.post(`/assignments/${id}/submit`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  unsubmit: (id) => api.post(`/assignments/${id}/unsubmit`),
  getSubmissions: (id) => api.get(`/assignments/${id}/submissions`),
  getStudentSubmission: (id) => api.get(`/assignments/${id}/my-submission`),
  grade: (id, data) => api.put(`/assignments/${id}/grade`, data),
  getGradebook: (courseId) => api.get(`/assignments/${courseId}/gradebook`),
  getTranscript: () => api.get(`/assignments/student/transcript`),
  getAnalytics: (courseId) => api.get(`/assignments/${courseId}/analytics`),
};

// Announcements API
export const announcementsAPI = {
  list: (courseId) => api.get(`/announcements/${courseId}/announcements`),
  create: (courseId, data) => api.post(`/announcements/${courseId}/announcements`, data),
  update: (id, data) => api.put(`/announcements/${id}`, data),
  delete: (id) => api.delete(`/announcements/${id}`),
  addComment: (id, data) => api.post(`/announcements/${id}/comments`, data),
  getComments: (id) => api.get(`/announcements/${id}/comments`),
  deleteComment: (id) => api.delete(`/announcements/comment/${id}`),
};

// Materials API
export const materialsAPI = {
  list: (courseId) => api.get(`/materials/${courseId}/materials`),
  create: (courseId, data) => {
    const formData = new FormData();
    formData.append('title', data.title);
    formData.append('description', data.description || '');
    formData.append('linkUrl', data.linkUrl || '');
    if (data.file) {
      formData.append('file', data.file);
    }
    return api.post(`/materials/${courseId}/materials`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  delete: (id) => api.delete(`/materials/${id}`),
};

// Notifications API
export const notificationsAPI = {
  list: () => api.get('/notifications'),
  getUnreadCount: () => api.get('/notifications/unread-count'),
  markAsRead: (id) => api.put(`/notifications/${id}/read`),
  markAllAsRead: () => api.put('/notifications/read-all'),
};

// Admin API
export const adminAPI = {
  getStats: () => api.get('/admin/stats'),
  getUsers: (role) => api.get(`/admin/users${role ? `?role=${role}` : ''}`),
  banUser: (id, banned) => api.put(`/admin/users/${id}/ban`, { banned }),
  deleteUser: (id) => api.delete(`/admin/users/${id}`),
  createTeacher: (data) => api.post('/admin/teachers', data),
  uploadRollNumbers: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/admin/roll-numbers/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  getValidRollNumbers: () => api.get('/admin/roll-numbers'),
};
