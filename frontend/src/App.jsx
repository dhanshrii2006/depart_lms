import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClientProvider, QueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { Toaster } from 'sonner';

// Store
import { useAuthStore } from './store/index.js';

// Layout
import { AppShell } from './components/layout/index.jsx';

// Components
import { ProtectedRoute } from './router/ProtectedRoute.jsx';

// Pages
import Landing from './pages/Auth/Landing.jsx';
import StudentLogin from './pages/Auth/StudentLogin.jsx';
import StudentSignup from './pages/Auth/StudentSignup.jsx';
import TeacherLogin from './pages/Auth/TeacherLogin.jsx';
import AdminLogin from './pages/Auth/AdminLogin.jsx';

import StudentDashboard from './pages/Student/Dashboard.jsx';
import StudentCourseDetail from './pages/Student/CourseDetail.jsx';
import StudentAssignment from './pages/Student/Assignment.jsx';
import StudentTranscript from './pages/Student/Transcript.jsx';

import TeacherDashboard from './pages/Teacher/Dashboard.jsx';
import TeacherCourseDetail from './pages/Teacher/CourseDetail.jsx';
import TeacherAssignments from './pages/Teacher/Assignments.jsx';
import TeacherGrading from './pages/Teacher/Grading.jsx';
import TeacherGradebook from './pages/Teacher/Gradebook.jsx';

import AdminDashboard from './pages/Admin/Dashboard.jsx';
import AdminUsers from './pages/Admin/Users.jsx';
import AdminRollNumbers from './pages/Admin/RollNumbers.jsx';

import Profile from './pages/shared/Profile.jsx';
import Settings from './pages/shared/Settings.jsx';
import Calendar from './pages/shared/Calendar.jsx';
import NotFound from './pages/NotFound.jsx';

// Hooks
import { useMe } from './hooks/index.js';

// CSS
import './index.css';

const queryClient = new QueryClient();

function AppContent() {
  const { user, isLoading, setLoading } = useAuthStore();
  const { isLoading: queryLoading } = useMe();

  useEffect(() => {
    // Mark loading as complete after query completes
    if (!queryLoading) {
      setLoading(false);
    }
  }, [queryLoading, setLoading]);

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<Landing />} />
      <Route path="/student/login" element={<StudentLogin />} />
      <Route path="/student/signup" element={<StudentSignup />} />
      <Route path="/teacher/login" element={<TeacherLogin />} />
      <Route path="/admin/login" element={<AdminLogin />} />

      {/* Protected routes with AppShell layout */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <AppShell>
              {user?.role === 'student' && <StudentDashboard />}
              {user?.role === 'teacher' && <TeacherDashboard />}
              {user?.role === 'admin' && <AdminDashboard />}
            </AppShell>
          </ProtectedRoute>
        }
      />

      <Route
        path="/student/dashboard"
        element={
          <ProtectedRoute requiredRole={['student']}>
            <AppShell>
              <StudentDashboard />
            </AppShell>
          </ProtectedRoute>
        }
      />

      <Route
        path="/student/course/:courseId"
        element={
          <ProtectedRoute requiredRole={['student']}>
            <AppShell>
              <StudentCourseDetail />
            </AppShell>
          </ProtectedRoute>
        }
      />

      <Route
        path="/student/assignment/:assignmentId"
        element={
          <ProtectedRoute requiredRole={['student']}>
            <AppShell>
              <StudentAssignment />
            </AppShell>
          </ProtectedRoute>
        }
      />

      <Route
        path="/teacher/dashboard"
        element={
          <ProtectedRoute requiredRole={['teacher']}>
            <AppShell>
              <TeacherDashboard />
            </AppShell>
          </ProtectedRoute>
        }
      />

      <Route
        path="/teacher/course/:courseId"
        element={
          <ProtectedRoute requiredRole={['teacher']}>
            <AppShell>
              <TeacherCourseDetail />
            </AppShell>
          </ProtectedRoute>
        }
      />

      <Route
        path="/teacher/assignments/:courseId"
        element={
          <ProtectedRoute requiredRole={['teacher']}>
            <AppShell>
              <TeacherAssignments />
            </AppShell>
          </ProtectedRoute>
        }
      />

      <Route
        path="/teacher/grading/:assignmentId"
        element={
          <ProtectedRoute requiredRole={['teacher']}>
            <AppShell>
              <TeacherGrading />
            </AppShell>
          </ProtectedRoute>
        }
      />

      <Route
        path="/teacher/gradebook/:courseId"
        element={
          <ProtectedRoute requiredRole={['teacher']}>
            <AppShell>
              <TeacherGradebook />
            </AppShell>
          </ProtectedRoute>
        }
      />

      <Route
        path="/student/transcript"
        element={
          <ProtectedRoute requiredRole={['student']}>
            <AppShell>
              <StudentTranscript />
            </AppShell>
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/dashboard"
        element={
          <ProtectedRoute requiredRole={['admin']}>
            <AppShell>
              <AdminDashboard />
            </AppShell>
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/users"
        element={
          <ProtectedRoute requiredRole={['admin']}>
            <AppShell>
              <AdminUsers />
            </AppShell>
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/roll-numbers"
        element={
          <ProtectedRoute requiredRole={['admin']}>
            <AppShell>
              <AdminRollNumbers />
            </AppShell>
          </ProtectedRoute>
        }
      />

      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <AppShell>
              <Profile />
            </AppShell>
          </ProtectedRoute>
        }
      />

      <Route
        path="/settings"
        element={
          <ProtectedRoute>
            <AppShell>
              <Settings />
            </AppShell>
          </ProtectedRoute>
        }
      />

      <Route
        path="/calendar"
        element={
          <ProtectedRoute>
            <AppShell>
              <Calendar />
            </AppShell>
          </ProtectedRoute>
        }
      />

      {/* Fallback for catch-all */}
      <Route path="/404" element={<NotFound />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <AppContent />
        <Toaster position="top-right" />
      </BrowserRouter>
    </QueryClientProvider>
  );
}
