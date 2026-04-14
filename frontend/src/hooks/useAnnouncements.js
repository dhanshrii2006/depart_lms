import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { announcementsAPI } from '../api/client.js';
import { useToast } from './useToast.js';

/**
 * Fetch all announcements for a course
 */
export const useAnnouncements = (courseId) => {
  return useQuery({
    queryKey: ['announcements', courseId],
    queryFn: async () => {
      const response = await announcementsAPI.list(courseId);
      return response.data;
    },
    enabled: !!courseId,
  });
};

/**
 * Create a new announcement
 */
export const useCreateAnnouncement = (courseId) => {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: async (announcement) => {
      const response = await announcementsAPI.create(courseId, announcement);
      return response.data;
    },
    onSuccess: (data) => {
      // Invalidate the announcements query to refetch
      queryClient.invalidateQueries({
        queryKey: ['announcements', courseId],
      });
      toast.success('Announcement posted!');
    },
    onError: (error) => {
      const message = error.response?.data?.message || error.message || 'Failed to post announcement';
      toast.error(message);
    },
  });
};

/**
 * Delete an announcement
 */
export const useDeleteAnnouncement = (courseId) => {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: async (announcementId) => {
      await announcementsAPI.delete(announcementId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['announcements', courseId],
      });
      toast.success('Announcement deleted');
    },
    onError: (error) => {
      const message = error.response?.data?.message || 'Failed to delete announcement';
      toast.error(message);
    },
  });
};

/**
 * Add a comment to an announcement
 */
export const useAddAnnouncementComment = (courseId, announcementId) => {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: async (comment) => {
      const response = await announcementsAPI.addComment(announcementId, comment);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['announcements', courseId],
      });
      toast.success('Comment added');
    },
    onError: (error) => {
      const message = error.response?.data?.message || 'Failed to add comment';
      toast.error(message);
    },
  });
};
