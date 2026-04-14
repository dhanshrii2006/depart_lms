import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Card, Button, Loading } from '../../components/ui.jsx';
import GradeAnalytics from '../../components/GradeAnalytics.jsx';
import { ArrowLeft, BarChart3, Edit2, AlertCircle } from 'lucide-react';
import { assignmentsAPI } from '../../api/client.js';

export default function TeacherGradebook() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [gradebook, setGradebook] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('grid');
  const [editingSubmission, setEditingSubmission] = useState(null);
  const [editGrade, setEditGrade] = useState('');
  const [editFeedback, setEditFeedback] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchGradebookData();
  }, [courseId]);

  const fetchGradebookData = async () => {
    setIsLoading(true);
    try {
      const [gradebookRes, analyticsRes] = await Promise.all([
        assignmentsAPI.getGradebook(courseId),
        assignmentsAPI.getAnalytics(courseId),
      ]);

      setGradebook(gradebookRes.data);
      setAnalytics(analyticsRes.data);
    } catch (error) {
      toast.error('Failed to load gradebook');
      navigate(-1);
    } finally {
      setIsLoading(false);
    }
  };

  const getSubmission = (studentId, assignmentId) => {
    if (!gradebook) return null;
    return gradebook.submissions.find(
      (s) => s.assignment_id === assignmentId && s.user_id === studentId
    );
  };

  const handleEditGrade = (submission) => {
    setEditingSubmission(submission.id);
    setEditGrade(submission.grade || '');
    setEditFeedback(submission.feedback || '');
  };

  const handleSaveGrade = async () => {
    if (!editingSubmission) return;
    setIsSaving(true);

    try {
      await assignmentsAPI.grade(editingSubmission, {
        grade: parseFloat(editGrade) || 0,
        feedback: editFeedback,
      });
      toast.success('Grade saved!');
      await fetchGradebookData();
      setEditingSubmission(null);
    } catch (error) {
      toast.error('Failed to save grade');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) return <Loading />;

  if (!gradebook) {
    return (
      <div>
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-6 flex items-center gap-2"
        >
          <ArrowLeft className="w-5 h-5" /> Back
        </Button>
        <Card className="text-center py-12">
          <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-600">No gradebook data available</p>
        </Card>
      </div>
    );
  }

  const students = gradebook.students || [];
  const assignments = gradebook.assignments || [];

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
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Gradebook</h1>
        <p className="text-gray-600">
          {students.length} students • {assignments.length} assignments
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab('grid')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            activeTab === 'grid'
              ? 'bg-indigo-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Grade Grid
        </button>
        <button
          onClick={() => setActiveTab('analytics')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
            activeTab === 'analytics'
              ? 'bg-indigo-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          <BarChart3 className="w-4 h-4" /> Analytics
        </button>
      </div>

      {/* Grid View */}
      {activeTab === 'grid' && (
        <Card className="p-6">
          {assignments.length === 0 ? (
            <div className="text-center py-12">
              <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600">No assignments yet</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-gray-200">
                    <th className="text-left py-3 px-4 text-gray-700 font-bold sticky left-0 bg-white z-10">
                      Student
                    </th>
                    {assignments.map((assignment) => (
                      <th
                        key={assignment.id}
                        className="text-center py-3 px-2 text-gray-700 font-bold whitespace-nowrap text-sm"
                      >
                        <div className="flex flex-col items-center">
                          <span className="truncate max-w-[100px]" title={assignment.title}>
                            {assignment.title}
                          </span>
                          <span className="text-xs text-gray-500">({assignment.points})</span>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {students.map((student) => (
                    <tr key={student.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4 sticky left-0 bg-white z-10">
                        <div>
                          <p className="font-medium text-gray-900">
                            {student.first_name} {student.last_name}
                          </p>
                          <p className="text-xs text-gray-500">{student.email}</p>
                        </div>
                      </td>
                      {assignments.map((assignment) => {
                        const submission = getSubmission(student.id, assignment.id);
                        return (
                          <td
                            key={assignment.id}
                            className="py-3 px-2 text-center relative group"
                          >
                            {editingSubmission === submission?.id ? (
                              <div className="space-y-2 p-2 bg-indigo-50 rounded">
                                <input
                                  type="number"
                                  value={editGrade}
                                  onChange={(e) => setEditGrade(e.target.value)}
                                  min="0"
                                  max={assignment.points}
                                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                                />
                                <button
                                  onClick={handleSaveGrade}
                                  disabled={isSaving}
                                  className="block w-full px-2 py-1 bg-green-600 text-white rounded text-xs font-semibold hover:bg-green-700 disabled:opacity-50"
                                >
                                  {isSaving ? 'Saving...' : 'Save'}
                                </button>
                                <button
                                  onClick={() => setEditingSubmission(null)}
                                  className="block w-full px-2 py-1 bg-gray-300 text-gray-700 rounded text-xs font-semibold hover:bg-gray-400"
                                >
                                  Cancel
                                </button>
                              </div>
                            ) : submission && submission.grade !== null ? (
                              <div className="flex items-center justify-center gap-1 group/cell">
                                <span className="font-bold text-green-700">
                                  {parseFloat(submission.grade).toFixed(1)}
                                </span>
                                <button
                                  onClick={() => handleEditGrade(submission)}
                                  className="opacity-0 group-hover/cell:opacity-100 p-1 text-gray-500 hover:text-indigo-600 transition-all"
                                >
                                  <Edit2 className="w-3 h-3" />
                                </button>
                              </div>
                            ) : submission ? (
                              <button
                                onClick={() => handleEditGrade(submission)}
                                className="px-2 py-1 text-xs font-semibold bg-yellow-100 text-yellow-800 rounded hover:bg-yellow-200"
                              >
                                Grade
                              </button>
                            ) : (
                              <span className="text-gray-400 text-sm">—</span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {/* Analytics View */}
      {activeTab === 'analytics' && <GradeAnalytics analytics={analytics} isLoading={false} />}
    </div>
  );
}
