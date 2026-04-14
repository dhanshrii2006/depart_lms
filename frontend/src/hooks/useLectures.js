import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client.js';

/**
 * Fetch all lectures for a course
 */
export const useLectures = (courseId, options = {}) => {
  return useQuery({
    queryKey: ['lectures', courseId],
    queryFn: async () => {
      const { data } = await api.get(`/api/courses/${courseId}/lectures`);
      return data;
    },
    enabled: !!courseId,
    ...options,
  });
};

/**
 * Fetch a single lecture
 */
export const useLecture = (lectureId, options = {}) => {
  return useQuery({
    queryKey: ['lecture', lectureId],
    queryFn: async () => {
      const { data } = await api.get(`/api/lectures/${lectureId}`);
      return data;
    },
    enabled: !!lectureId,
    ...options,
  });
};

/**
 * Create a new lecture
 */
export const useCreateLecture = (courseId) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (lectureData) => {
      const { data } = await api.post(`/api/courses/${courseId}/lectures`, lectureData);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lectures', courseId] });
    },
  });
};

/**
 * Update a lecture
 */
export const useUpdateLecture = (courseId) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ lectureId, ...updates }) => {
      const { data } = await api.patch(`/api/lectures/${lectureId}`, updates);
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['lectures', courseId] });
      queryClient.invalidateQueries({ queryKey: ['lecture', data.id] });
    },
  });
};

/**
 * Delete a lecture
 */
export const useDeleteLecture = (courseId) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (lectureId) => {
      await api.delete(`/api/lectures/${lectureId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lectures', courseId] });
    },
  });
};

/**
 * Mark lecture as watched by student
 * Supports optimistic updates
 */
export const useMarkWatched = (lectureId) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const { data } = await api.post(`/api/lectures/${lectureId}/progress`, {
        watched: true,
      });
      return data;
    },
    onMutate: async () => {
      // Optimistic update
      await queryClient.cancelQueries({ queryKey: ['lecture', lectureId] });
      const previousData = queryClient.getQueryData(['lecture', lectureId]);

      if (previousData) {
        queryClient.setQueryData(['lecture', lectureId], {
          ...previousData,
          watched: true,
          watched_at: new Date().toISOString(),
        });
      }

      return { previousData };
    },
    onError: (err, newData, context) => {
      // Rollback on error
      if (context?.previousData) {
        queryClient.setQueryData(['lecture', lectureId], context.previousData);
      }
    },
  });
};

/**
 * Get lecture watch statistics (teacher only)
 */
export const useLectureStats = (courseId, enabled = false) => {
  return useQuery({
    queryKey: ['lectureStats', courseId],
    queryFn: async () => {
      const { data } = await api.get(`/api/courses/${courseId}/lectures/stats`);
      return data;
    },
    enabled: enabled && !!courseId,
  });
};
