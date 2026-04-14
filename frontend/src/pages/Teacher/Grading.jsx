import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Card, Button, Input, Textarea, Loading } from '../../components/ui.jsx';
import { ArrowLeft, CheckCircle, AlertCircle, User } from 'lucide-react';
import { assignmentsAPI } from '../../api/client.js';

const gradeSchema = z.object({
  grade: z.string().transform(Number).refine(v => v >= 0, 'Grade must be 0 or higher'),
  feedback: z.string().optional().default(''),
});

export default function TeacherGrading() {
  const { assignmentId } = useParams();
  const navigate = useNavigate();
  const [assignment, setAssignment] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [gradingId, setGradingId] = useState(null);
  const [submittingGrade, setSubmittingGrade] = useState(null);

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(gradeSchema),
  });

  useEffect(() => {
    fetchGradingData();
  }, [assignmentId]);

  const fetchGradingData = async () => {
    setIsLoading(true);
    try {
      const [assignmentRes, submissionsRes] = await Promise.all([
        assignmentsAPI.get(assignmentId),
        assignmentsAPI.getSubmissions(assignmentId),
      ]);

      setAssignment(assignmentRes.data);
      setSubmissions(submissionsRes.data);
    } catch (error) {
      toast.error('Failed to load submissions');
      navigate(-1);
    } finally {
      setIsLoading(false);
    }
  };

  const onGradeSubmission = async (data) => {
    if (!gradingId) return;
    setSubmittingGrade(gradingId);

    try {
      const submission = submissions.find(s => s.id === gradingId);
      await assignmentsAPI.grade(submission.id, data);
      toast.success('Submission graded!');
      await fetchGradingData();
      setGradingId(null);
      reset();
    } catch (error) {
      toast.error('Failed to grade submission');
    }  finally {
      setSubmittingGrade(null);
    }
  };

  if (isLoading) return <Loading />;

  const ungradedCount = submissions.filter(s => s.grade === null).length;
  const gradedCount = submissions.length - ungradedCount;

  return (
    <div>
      <Button
        variant="ghost"
        onClick={() => navigate(-1)}
        className="mb-6 flex items-center gap-2"
      >
        <ArrowLeft className="w-5 h-5" /> Back
      </Button>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Grade: {assignment?.title}
        </h1>
        <p className="text-gray-600">
          {assignment?.points} points • Due {new Date(assignment?.due_date).toLocaleDateString()}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <Card className="text-center p-4">
          <p className="text-gray-600 text-sm">Total Submissions</p>
          <p className="text-3xl font-bold text-indigo-600">{submissions.length}</p>
        </Card>
        <Card className="text-center p-4">
          <p className="text-gray-600 text-sm">Graded</p>
          <p className="text-3xl font-bold text-green-600">{gradedCount}</p>
        </Card>
        <Card className="text-center p-4">
          <p className="text-gray-600 text-sm">Pending</p>
          <p className="text-3xl font-bold text-yellow-600">{ungradedCount}</p>
        </Card>
      </div>

      {/* Submissions List */}
      <div className="space-y-4">
        {submissions.length === 0 ? (
          <Card className="text-center py-12">
            <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600">No submissions yet</p>
          </Card>
        ) : (
          submissions.map((submission) => (
            <Card key={submission.id} className="p-6">
              <div className="flex gap-4 mb-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
                    <User className="w-6 h-6 text-indigo-600" />
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-gray-900">
                    {submission.student_name}
                  </h3>
                  <p className="text-sm text-gray-600">{submission.student_email}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Submitted {new Date(submission.submitted_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex-shrink-0">
                  {submission.grade !== null ? (
                    <div className="text-right">
                      <div className="flex items-center gap-2 text-green-600">
                        <CheckCircle className="w-5 h-5" />
                        <span className="font-bold">
                          {submission.grade}/{assignment?.points}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="text-right">
                      <div className="flex items-center gap-2 text-yellow-600">
                        <AlertCircle className="w-5 h-5" />
                        <span className="text-sm font-semibold">Pending</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Submission Content */}
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <p className="text-sm text-gray-600 mb-2 font-semibold">Submission:</p>
                <p className="text-gray-700 text-sm whitespace-pre-wrap">
                  {submission.submission_text || '(No text submitted)'}
                </p>
                {(submission.file_url || submission.drive_link || submission.link_url) && (
                  <div className="mt-3 space-y-2">
                    {submission.file_url && (
                      <a
                        href={submission.file_url}
                        target="_blank"
                        rel="noreferrer"
                        className="block text-sm text-indigo-600 hover:underline"
                      >
                        Open submitted file
                      </a>
                    )}
                    {(submission.drive_link || submission.link_url) && (
                      <a
                        href={submission.drive_link || submission.link_url}
                        target="_blank"
                        rel="noreferrer"
                        className="block text-sm text-indigo-600 hover:underline"
                      >
                        Open submitted link
                      </a>
                    )}
                  </div>
                )}
              </div>

              {/* Existing Feedback */}
              {submission.feedback && (
                <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-4">
                  <p className="text-sm font-semibold text-blue-900 mb-1">
                    Your Feedback:
                  </p>
                  <p className="text-sm text-blue-800">{submission.feedback}</p>
                </div>
              )}

              {/* Grading Form */}
              {gradingId === submission.id ? (
                <form
                  onSubmit={handleSubmit(onGradeSubmission)}
                  className="bg-indigo-50 rounded-lg p-4 space-y-4"
                >
                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      label="Grade"
                      type="number"
                      min="0"
                      max={assignment?.points}
                      placeholder={`0 - ${assignment?.points}`}
                      {...register('grade')}
                      error={errors.grade?.message}
                    />
                  </div>
                  <Textarea
                    label="Feedback"
                    placeholder="Provide feedback for the student..."
                    {...register('feedback')}
                  />
                  <div className="flex gap-3">
                    <Button
                      type="submit"
                      variant="primary"
                      disabled={submittingGrade}
                      size="sm"
                    >
                      {submittingGrade ? 'Saving...' : 'Submit Grade'}
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => {
                        setGradingId(null);
                        reset();
                      }}
                      size="sm"
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              ) : (
                <Button
                  variant={submission.grade !== null ? 'secondary' : 'primary'}
                  size="sm"
                  onClick={() => {
                    setGradingId(submission.id);
                    if (submission.grade !== null) {
                      reset({
                        grade: submission.grade,
                        feedback: submission.feedback,
                      });
                    }
                  }}
                >
                  {submission.grade !== null ? 'Edit Grade' : 'Grade Submission'}
                </Button>
              )}
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
