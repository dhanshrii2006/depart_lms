import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, assignmentsAPI } from '../api/client.js';
import { useToast } from './useToast.js';

/**
 * Fetch all assignments for a course
 */
export const useAssignments = (courseId) => {
  return useQuery({
    queryKey: ['assignments', courseId],
    queryFn: async () => {
      const response = await assignmentsAPI.list(courseId);
      return response.data;
    },
    enabled: !!courseId,
  });
};

/**
 * Create a new assignment
 */
export const useCreateAssignment = (courseId) => {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: async (assignment) => {
      const response = await assignmentsAPI.create(courseId, assignment);
      return response.data;
    },
    onSuccess: (data) => {
      // Invalidate the assignments query to refetch
      queryClient.invalidateQueries({
        queryKey: ['assignments', courseId],
      });
      toast.success('Assignment created!');
    },
    onError: (error) => {
      const message = error.response?.data?.message || error.message || 'Failed to create assignment';
      toast.error(message);
    },
  });
};

/**
 * Delete an assignment
 */
export const useDeleteAssignment = (courseId) => {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: async (assignmentId) => {
      await assignmentsAPI.delete(assignmentId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['assignments', courseId],
      });
      toast.success('Assignment deleted');
    },
    onError: (error) => {
      const message = error.response?.data?.message || 'Failed to delete assignment';
      toast.error(message);
    },
  });
};

/**
 * Submit an assignment (for students)
 */
export const useSubmitAssignment = (assignmentId, courseId) => {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: async (formData) => {
      const response = await api.post(
        `/assignments/${assignmentId}/submit`,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['submission', assignmentId],
      });
      if (courseId) {
        queryClient.invalidateQueries({ queryKey: ['assignments', courseId] });
      }
      toast.success('Assignment turned in ✓');
    },
    onError: (error) => {
      const message = error.response?.data?.message || 'Submission failed';
      toast.error(message);
    },
  });
};

/**
 * Fetch the current student's submission for an assignment
 */
export const useMySubmission = (assignmentId) => {
  return useQuery({
    queryKey: ['submission', assignmentId],
    queryFn: async () => {
      const response = await api.get(`/assignments/${assignmentId}/my-submission`);
      return response.data;
    },
    enabled: !!assignmentId,
  });
};

/**
 * Unsubmit (back to draft) before grading
 */
export const useUnsubmitAssignment = (assignmentId, courseId) => {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: async () => {
      const response = await api.post(`/assignments/${assignmentId}/unsubmit`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['submission', assignmentId] });
      if (courseId) {
        queryClient.invalidateQueries({ queryKey: ['assignments', courseId] });
      }
      toast.success('Assignment unsubmitted');
    },
    onError: (error) => {
      const message = error.response?.data?.message || 'Failed to unsubmit';
      toast.error(message);
    },
  });
};

/**
 * Update an assignment (for teachers)
 */
export const useUpdateAssignment = (assignmentId) => {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: async (updates) => {
      const response = await assignmentsAPI.update(assignmentId, updates);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['assignments'],
      });
      toast.success('Assignment updated');
    },
    onError: (error) => {
      const message = error.response?.data?.message || 'Failed to update assignment';
      toast.error(message);
    },
  });
};
