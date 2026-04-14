import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../store/index.js';
import { authAPI, coursesAPI, assignmentsAPI, announcementsAPI, materialsAPI, notificationsAPI } from '../api/client.js';

// Auth hooks
export const useMe = () => {
  const { setUser, setLoading } = useAuthStore();

  return useQuery({
    queryKey: ['me'],
    queryFn: async () => {
      try {
        const response = await authAPI.me();
        setUser(response.data);
        setLoading(false);
        return response.data;
      } catch (error) {
        setUser(null);
        setLoading(false);
        // Don't re-throw to prevent query error state
        return null;
      }
    },
    retry: false,
    staleTime: Infinity,
  });
};

export const useLogin = () => {
  const { setUser } = useAuthStore();

  return useMutation({
    mutationFn: authAPI.login,
    onSuccess: (response) => {
      setUser(response.data.user);
    },
  });
};

export const useRegister = () => {
  const { setUser } = useAuthStore();

  return useMutation({
    mutationFn: authAPI.register,
    onSuccess: (data) => {
      setUser(data.data.user);
    },
  });
};

export const useLogout = () => {
  const { logout } = useAuthStore();

  return useMutation({
    mutationFn: authAPI.logout,
    onSuccess: () => {
      logout();
    },
  });
};

export const useUpdateProfile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: authAPI.updateProfile,
    onSuccess: (data) => {
      queryClient.setQueryData(['me'], data.data);
    },
  });
};

// Courses hooks
export const useCourses = () => {
  return useQuery({
    queryKey: ['courses'],
    queryFn: coursesAPI.list,
    select: (data) => data.data,
  });
};

export const useCourse = (id) => {
  return useQuery({
    queryKey: ['course', id],
    queryFn: () => coursesAPI.get(id),
    select: (data) => data.data,
    enabled: !!id,
  });
};

export const useCreateCourse = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: coursesAPI.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses'] });
    },
  });
};

export const useEnrollByCode = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: coursesAPI.enrollByCode,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses'] });
    },
  });
};

export const useCourseEnrollments = (courseId) => {
  return useQuery({
    queryKey: ['enrollments', courseId],
    queryFn: () => coursesAPI.getEnrollments(courseId),
    select: (data) => data.data,
    enabled: !!courseId,
  });
};

export const useInviteCode = (courseId) => {
  return useQuery({
    queryKey: ['inviteCode', courseId],
    queryFn: () => coursesAPI.getInviteCode(courseId),
    select: (data) => data.data,
    enabled: !!courseId,
  });
};

// Announcements hooks (imported from separate file)
export {
  useAnnouncements,
  useCreateAnnouncement,
  useDeleteAnnouncement,
  useAddAnnouncementComment,
} from './useAnnouncements.js';

// Assignments hooks (imported from separate file)
export {
  useAssignments,
  useCreateAssignment,
  useDeleteAssignment,
  useSubmitAssignment,
  useUpdateAssignment,
} from './useAssignments.js';

// Materials hooks
export const useMaterials = (courseId) => {
  return useQuery({
    queryKey: ['materials', courseId],
    queryFn: () => materialsAPI.list(courseId),
    select: (data) => data.data,
    enabled: !!courseId,
  });
};

export const useCreateMaterial = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ courseId, data }) => materialsAPI.create(courseId, data),
    onSuccess: (data, { courseId }) => {
      queryClient.invalidateQueries({ queryKey: ['materials', courseId] });
    },
  });
};

// Notifications hooks
export const useNotifications = () => {
  return useQuery({
    queryKey: ['notifications'],
    queryFn: notificationsAPI.list,
    select: (data) => data.data,
  });
};

export const useUnreadCount = () => {
  return useQuery({
    queryKey: ['unreadCount'],
    queryFn: notificationsAPI.getUnreadCount,
    select: (data) => data.data.unreadCount,
  });
};

export const useMarkAsRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: notificationsAPI.markAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['unreadCount'] });
    },
  });
};

// Lectures hooks (imported from separate file)
export {
  useLectures,
  useLecture,
  useCreateLecture,
  useUpdateLecture,
  useDeleteLecture,
  useMarkWatched,
  useLectureStats,
} from './useLectures.js';

// Toast hook
export { useToast } from './useToast.js';
