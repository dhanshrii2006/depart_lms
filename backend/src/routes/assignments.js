import { Router } from 'express';
import { z } from 'zod';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import { validate } from '../middleware/validation.js';
import { upload, uploadSubmission } from '../middleware/upload.js';
import * as assignmentsController from '../controllers/assignmentsController.js';

const router = Router();

const createAssignmentSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  instructions: z.string().optional().default(''),
  dueDate: z.string().optional(),
  points: z.coerce.number().optional().default(100)
});

const gradeSchema = z.object({
  grade: z.number().min(0).max(1000),
  feedback: z.string().optional().default('')
});

// Get student transcript (student only) - Must come before :courseId routes
router.get('/student/transcript', authenticateToken, requireRole('student'), assignmentsController.getStudentTranscript);

// Get specific assignment - Must come before :courseId routes
router.get('/assignment/:assignmentId', authenticateToken, assignmentsController.getAssignment);

// Create assignment (teacher only)
router.post('/:courseId/assignments', authenticateToken, requireRole('teacher'), upload.single('file'), validate(createAssignmentSchema), assignmentsController.createAssignment);

// Get assignments for a course
router.get('/:courseId/assignments', authenticateToken, assignmentsController.getAssignments);

// Update assignment (teacher only)
router.put('/:assignmentId', authenticateToken, requireRole('teacher'), validate(createAssignmentSchema), assignmentsController.updateAssignment);

// Delete assignment (teacher only)
router.delete('/:assignmentId', authenticateToken, requireRole('teacher'), assignmentsController.deleteAssignment);

// Submit assignment (students)
router.post(
  '/:assignmentId/submit',
  authenticateToken,
  requireRole('student'),
  uploadSubmission,
  assignmentsController.submitAssignment
);

// Unsubmit assignment (students)
router.post(
  '/:assignmentId/unsubmit',
  authenticateToken,
  requireRole('student'),
  assignmentsController.unsubmitAssignment
);

// Get submissions for assignment (teacher only)
router.get('/:assignmentId/submissions', authenticateToken, requireRole('teacher'), assignmentsController.getSubmissions);

// Get student's submission
router.get(
  '/:assignmentId/my-submission',
  authenticateToken,
  requireRole('student'),
  assignmentsController.getStudentSubmission
);

// Grade submission (teacher only)
router.put('/:submissionId/grade', authenticateToken, requireRole('teacher'), validate(gradeSchema), assignmentsController.gradeSubmission);

// Get gradebook for a course (teacher only)
router.get('/:courseId/gradebook', authenticateToken, requireRole('teacher'), assignmentsController.getCourseGradebook);

// Get grade analytics for a course (teacher only)
router.get('/:courseId/analytics', authenticateToken, requireRole('teacher'), assignmentsController.getCourseGradeAnalytics);

export default router;
