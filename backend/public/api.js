/**
 * API Client Wrapper
 * Provides helper functions for making API requests to the backend
 */

const API_BASE = ''; // Empty string uses current origin

// ===== COURSES API =====
const coursesAPI = {
  // Get all courses or filtered courses
  list: async (filters = {}) => {
    try {
      const params = new URLSearchParams(filters);
      const response = await fetch(`${API_BASE}/api/courses${params ? '?' + params : ''}`, {
        method: 'GET',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' }
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error('Error fetching courses:', error);
      throw error;
    }
  },

  // Get course details by ID
  get: async (courseId) => {
    try {
      const response = await fetch(`${API_BASE}/api/courses/${courseId}`, {
        method: 'GET',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' }
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error('Error fetching course:', error);
      throw error;
    }
  },

  // Create a new course
  create: async (courseData) => {
    try {
      const response = await fetch(`${API_BASE}/api/courses`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(courseData)
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error('Error creating course:', error);
      throw error;
    }
  },

  // Update course
  update: async (courseId, courseData) => {
    try {
      const response = await fetch(`${API_BASE}/api/courses/${courseId}`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(courseData)
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error('Error updating course:', error);
      throw error;
    }
  },

  // Publish course
  publish: async (courseId) => {
    try {
      const response = await fetch(`${API_BASE}/api/courses/${courseId}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_published: true })
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error('Error publishing course:', error);
      throw error;
    }
  }
};

// ===== ASSIGNMENTS API =====
const assignmentsAPI = {
  // Get all assignments for a course
  // Get all assignments for teacher (from all courses)
  list: async (filters = {}) => {
    try {
      const params = new URLSearchParams(filters);
      const response = await fetch(`${API_BASE}/api/assignments${params ? '?' + params : ''}`, {
        method: 'GET',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' }
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error('Error fetching assignments:', error);
      throw error;
    }
  },

  // Get assignment details
  get: async (assignmentId) => {
    try {
      const response = await fetch(`${API_BASE}/api/assignments/${assignmentId}`, {
        method: 'GET',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' }
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error('Error fetching assignment:', error);
      throw error;
    }
  },

  // Create assignment
  // Create assignment for a specific course
  create: async (courseId, title, description, total_points, due_date, file_url) => {
    try {
      const response = await fetch(`${API_BASE}/api/courses/${courseId}/assignments`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description,
          total_points,
          due_date,
          file_url
        })
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error('Error creating assignment:', error);
      throw error;
    }
  },

  // Delete assignment
  delete: async (assignmentId) => {
    try {
      const response = await fetch(`${API_BASE}/api/assignments/${assignmentId}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' }
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error('Error deleting assignment:', error);
      throw error;
    }
  },

  // Get submissions for assignment
  getSubmissions: async (assignmentId) => {
    try {
      const response = await fetch(`${API_BASE}/api/assignments/${assignmentId}/submissions`, {
        method: 'GET',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' }
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error('Error fetching submissions:', error);
      throw error;
    }
  },

  // Grade submission
  gradeSubmission: async (submissionId, percentage) => {
    try {
      const response = await fetch(`${API_BASE}/api/assignments/${submissionId}/grade`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ percentage })
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error('Error grading submission:', error);
      throw error;
    }
  }
};

// ===== STUDENT ASSIGNMENTS API =====
const studentAssignmentsAPI = {
  // Get student's assignments
  list: async (filters = {}) => {
    try {
      const params = new URLSearchParams(filters);
      const response = await fetch(`${API_BASE}/api/student/assignments${params ? '?' + params : ''}`, {
        method: 'GET',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' }
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error('Error fetching student assignments:', error);
      throw error;
    }
  },

  // Get assignment details
  get: async (assignmentId) => {
    try {
      const response = await fetch(`${API_BASE}/api/student/assignments/${assignmentId}`, {
        method: 'GET',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' }
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error('Error fetching assignment:', error);
      throw error;
    }
  },

  // Submit assignment
  submit: async (assignmentId, submissionData) => {
    try {
      const response = await fetch(`${API_BASE}/api/assignments/${assignmentId}/submit`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submissionData)
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error('Error submitting assignment:', error);
      throw error;
    }
  }
};

// ===== ENROLLMENTS API =====
const enrollmentsAPI = {
  // Join/enroll in a course
  join: async (courseId) => {
    try {
      const response = await fetch(`${API_BASE}/api/courses/${courseId}/enroll`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' }
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error('Error joining course:', error);
      throw error;
    }
  },

  // Get my courses (for students)
  myCourses: async (filters = {}) => {
    try {
      const params = new URLSearchParams(filters);
      const response = await fetch(`${API_BASE}/api/enrollments/my-courses${params ? '?' + params : ''}`, {
        method: 'GET',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' }
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error('Error fetching my courses:', error);
      throw error;
    }
  },

  // Get my students (for teachers)
  myStudents: async (filters = {}) => {
    try {
      const params = new URLSearchParams(filters);
      const response = await fetch(`${API_BASE}/api/teacher/my-students${params ? '?' + params : ''}`, {
        method: 'GET',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' }
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error('Error fetching my students:', error);
      throw error;
    }
  },

  // Join course by invite code
  joinByKey: async (invite_code) => {
    try {
      const response = await fetch(`${API_BASE}/api/courses/join-by-key`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invite_code: invite_code.toUpperCase() })
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || `HTTP ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error joining course by key:', error);
      throw error;
    }
  }
};

// ===== NOTIFICATIONS API =====
const notificationsAPI = {
  // Get all notifications for current student
  list: async (limit = 20, offset = 0) => {
    try {
      const params = new URLSearchParams({ limit, offset });
      const response = await fetch(`${API_BASE}/api/notifications?${params}`, {
        method: 'GET',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' }
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error('Error fetching notifications:', error);
      throw error;
    }
  },

  // Mark notification as read
  markAsRead: async (notificationId) => {
    try {
      const response = await fetch(`${API_BASE}/api/notifications/${notificationId}/read`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' }
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  },

  // Delete/dismiss notification
  delete: async (notificationId) => {
    try {
      const response = await fetch(`${API_BASE}/api/notifications/${notificationId}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' }
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error('Error deleting notification:', error);
      throw error;
    }
  }
};

// ===== AUTH API =====
const authAPI = {
  // Get current user info
  me: async () => {
    try {
      const response = await fetch(`${API_BASE}/api/users/profile`, {
        method: 'GET',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' }
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error('Error fetching user profile:', error);
      throw error;
    }
  },

  // Update user profile
  updateProfile: async (userData) => {
    try {
      const response = await fetch(`${API_BASE}/api/users/profile`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  },

  // Login
  login: async (credentials) => {
    try {
      const response = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials)
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error('Error logging in:', error);
      throw error;
    }
  },

  // Logout
  logout: async () => {
    try {
      const response = await fetch(`${API_BASE}/api/auth/logout`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' }
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error('Error logging out:', error);
      throw error;
    }
  }
};

// ===== QUIZ API =====
const quizzesAPI = {
  // Get quizzes for a course
  list: async (courseId) => {
    try {
      const response = await fetch(`${API_BASE}/api/courses/${courseId}/quizzes`, {
        method: 'GET',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' }
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error('Error fetching quizzes:', error);
      throw error;
    }
  },

  // Get quiz details
  get: async (quizId) => {
    try {
      const response = await fetch(`${API_BASE}/api/quizzes/${quizId}`, {
        method: 'GET',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' }
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error('Error fetching quiz:', error);
      throw error;
    }
  },

  // Submit quiz answers
  submit: async (quizId, answers) => {
    try {
      const response = await fetch(`${API_BASE}/api/quizzes/${quizId}/submit`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers })
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error('Error submitting quiz:', error);
      throw error;
    }
  }
};

// ===== LESSONS API =====
const lessonsAPI = {
  // Get lessons for a course
  list: async (courseId) => {
    try {
      const response = await fetch(`${API_BASE}/api/courses/${courseId}/lessons`, {
        method: 'GET',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' }
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error('Error fetching lessons:', error);
      throw error;
    }
  },

  // Get lesson details
  get: async (lessonId) => {
    try {
      const response = await fetch(`${API_BASE}/api/lessons/${lessonId}`, {
        method: 'GET',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' }
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error('Error fetching lesson:', error);
      throw error;
    }
  },

  // Create lesson
  create: async (courseId, lessonData) => {
    try {
      const response = await fetch(`${API_BASE}/api/courses/${courseId}/lessons`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(lessonData)
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error('Error creating lesson:', error);
      throw error;
    }
  }
};

// ===== ANALYTICS API =====
const analyticsAPI = {
  // Get student progress
  getProgress: async (courseId = null) => {
    try {
      const url = courseId 
        ? `${API_BASE}/api/analytics/progress?courseId=${courseId}`
        : `${API_BASE}/api/analytics/progress`;
      const response = await fetch(url, {
        method: 'GET',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' }
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error('Error fetching progress:', error);
      throw error;
    }
  },

  // Get course analytics
  getCourseAnalytics: async (courseId) => {
    try {
      const response = await fetch(`${API_BASE}/api/courses/${courseId}/analytics`, {
        method: 'GET',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' }
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error('Error fetching course analytics:', error);
      throw error;
    }
  }
};
