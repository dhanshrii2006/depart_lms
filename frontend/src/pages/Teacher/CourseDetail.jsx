import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Card, Button, Modal, Loading } from '../../components/ui.jsx';
import {
  ArrowLeft, Plus, Copy, Users, FileText, MessageSquare, BarChart3,
  Eye, Trash2
} from 'lucide-react';
import { coursesAPI, materialsAPI } from '../../api/client.js';
import PostComposer from '../../components/stream/PostComposer.jsx';
import CreateAssignmentModal from '../../components/assignment/CreateAssignmentModal.jsx';
import CreateMaterialModal from '../../components/material/CreateMaterialModal.jsx';
import { useAnnouncements, useDeleteAnnouncement } from '../../hooks/useAnnouncements.js';
import { useAssignments, useDeleteAssignment } from '../../hooks/useAssignments.js';


export default function TeacherCourseDetail() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [material, setMaterials] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('assignments');
  const [showCreateAssignmentModal, setShowCreateAssignmentModal] = useState(false);
  const [showCreateMaterialModal, setShowCreateMaterialModal] = useState(false);
  const [showInviteCodeModal, setShowInviteCodeModal] = useState(false);
  const [inviteCode, setInviteCode] = useState('');

  // React Query hooks
  const { data: assignments = [] } = useAssignments(courseId);
  const { data: announcements = [] } = useAnnouncements(courseId);
  const { mutate: deleteAssignment } = useDeleteAssignment(courseId);
  const { mutate: deleteAnnouncement } = useDeleteAnnouncement(courseId);

  useEffect(() => {
    fetchCourseData();
  }, [courseId]);

  const fetchCourseData = async () => {
    setIsLoading(true);
    try {
      const [courseRes, materialsRes, enrollmentsRes, inviteRes] = await Promise.all([
        coursesAPI.get(courseId),
        materialsAPI.list(courseId),
        coursesAPI.getEnrollments(courseId),
        coursesAPI.getInviteCode(courseId),
      ]);

      setCourse(courseRes.data);
      setMaterials(materialsRes.data);
      setEnrollments(enrollmentsRes.data);
      setInviteCode(inviteRes.data.code);
    } catch (error) {
      toast.error('Failed to load course');
      navigate(-1);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAssignment = async (assignmentId) => {
    if (!confirm('Delete this assignment? Students who submitted will keep their submissions.')) return;
    deleteAssignment(assignmentId);
  };

  const handleDeleteAnnouncement = async (announcementId) => {
    if (!confirm('Delete this announcement?')) return;
    deleteAnnouncement(announcementId);
  };

  const copyInviteCode = () => {
    navigator.clipboard.writeText(inviteCode);
    toast.success('Invite code copied!');
  };

  if (isLoading) return <Loading />;

  return (
    <div>
      <Button
        variant="ghost"
        onClick={() => navigate(-1)}
        className="mb-6 flex items-center gap-2"
      >
        <ArrowLeft className="w-5 h-5" /> Back
      </Button>

      {/* Course Header */}
      {course && (
        <div
          className="rounded-xl p-8 text-white mb-8"
          style={{ backgroundColor: course.cover_color }}
        >
          <h1 className="text-4xl font-bold mb-2">{course.title}</h1>
          <p className="text-lg opacity-90">
            {course.subject && `${course.subject} • `}Section {course.section}
          </p>
          <p className="text-sm opacity-75 mt-4">{course.description}</p>
        </div>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <Card className="text-center p-4">
          <p className="text-gray-600 text-sm">Students</p>
          <p className="text-3xl font-bold text-indigo-600">{enrollments.length}</p>
        </Card>
        <Card className="text-center p-4">
          <p className="text-gray-600 text-sm">Assignments</p>
          <p className="text-3xl font-bold text-indigo-600">{assignments.length}</p>
        </Card>
        <Card className="text-center p-4">
          <p className="text-gray-600 text-sm">Announcements</p>
          <p className="text-3xl font-bold text-indigo-600">{announcements.length}</p>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 mb-8 border-b border-gray-200 items-center justify-between">
        <div className="flex gap-4">
          {[
            { tab: 'assignments', label: 'Assignments' },
            { tab: 'announcements', label: 'Announcements' },
            { tab: 'materials', label: 'Materials' },
            { tab: 'students', label: 'Students' },
            { tab: 'insights', label: 'Insights' },
          ].map((item) => (
            <button
              key={item.tab}
              onClick={() => setActiveTab(item.tab)}
              className={`px-4 py-3 font-semibold transition-colors ${
                activeTab === item.tab
                  ? 'text-indigo-600 border-b-2 border-indigo-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
        <Button
          variant="secondary"
          onClick={() => navigate(`/teacher/gradebook/${courseId}`)}
          className="flex items-center gap-2"
        >
          <BarChart3 className="w-5 h-5" /> View Gradebook
        </Button>
      </div>

      {/* Assignments Tab */}
      {activeTab === 'assignments' && (
        <div className="space-y-6">
          <Button
            variant="primary"
            onClick={() => setShowCreateAssignmentModal(true)}
            className="flex items-center gap-2"
          >
            <Plus className="w-5 h-5" /> New Assignment
          </Button>

          {assignments.length === 0 ? (
            <Card className="text-center py-12">
              <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">No assignments yet</p>
              <Button
                variant="primary"
                onClick={() => setShowCreateAssignmentModal(true)}
              >
                Create Assignment
              </Button>
            </Card>
          ) : (
            assignments.map((assignment) => (
              <Card key={assignment.id} className="p-6">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">
                      {assignment.title}
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                      {assignment.instructions}
                    </p>
                  </div>
                  <span className="text-sm font-semibold text-gray-600">
                    {assignment.points} pts
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-4">
                  Due: {new Date(assignment.due_date).toLocaleDateString()}
                </p>
                <div className="flex gap-3">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => navigate(`/teacher/grading/${assignment.id}`)}
                    className="flex items-center gap-2"
                  >
                    <Eye className="w-4 h-4" /> Grade Submissions
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => handleDeleteAssignment(assignment.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </Card>
            ))
          )}

          {/* Create Assignment Modal */}
          <CreateAssignmentModal
            isOpen={showCreateAssignmentModal}
            onClose={() => setShowCreateAssignmentModal(false)}
            courseId={courseId}
          />
        </div>
      )}

      {/* Announcements Tab */}
      {activeTab === 'announcements' && (
        <div className="space-y-6">
          <PostComposer courseId={courseId} />

          {announcements.length === 0 ? (
            <Card className="text-center py-12">
              <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600">No announcements yet</p>
            </Card>
          ) : (
            announcements.map((announcement) => (
              <Card key={announcement.id} className="p-6">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-lg font-bold text-gray-900">
                    {announcement.title}
                  </h3>
                  <button
                    onClick={() => handleDeleteAnnouncement(announcement.id)}
                    className="text-gray-400 hover:text-red-600 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-gray-700 mb-3">{announcement.content}</p>
                <p className="text-xs text-gray-500">
                  Posted {new Date(announcement.created_at).toLocaleDateString()}
                </p>
              </Card>
            ))
          )}
        </div>
      )}

      {/* Materials Tab */}
      {activeTab === 'materials' && (
        <div className="space-y-6">
          <Button
            variant="primary"
            onClick={() => setShowCreateMaterialModal(true)}
            className="flex items-center gap-2"
          >
            <Plus className="w-5 h-5" /> Add Material
          </Button>

          {material.length === 0 ? (
            <Card className="text-center py-12">
              <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">No materials yet</p>
              <p className="text-sm text-gray-500 mb-4">Share YouTube links, Google Drive files, PDFs, and more</p>
              <Button
                variant="primary"
                onClick={() => setShowCreateMaterialModal(true)}
              >
                Add First Material
              </Button>
            </Card>
          ) : (
            material.map((mat) => (
              <Card key={mat.id} className="p-6">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">
                      {mat.title}
                    </h3>
                    {mat.description && (
                      <p className="text-sm text-gray-600 mt-1">
                        {mat.description}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => {
                      if (confirm('Delete this material?')) {
                        // TODO: Implement delete
                      }
                    }}
                    className="text-gray-400 hover:text-red-600 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                {mat.link_url && (
                  <a
                    href={mat.link_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-accent-600 text-sm font-medium hover:underline"
                  >
                    Open Link →
                  </a>
                )}
                {mat.file_url && (
                  <a
                    href={mat.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-accent-600 text-sm font-medium hover:underline"
                  >
                    Download File →
                  </a>
                )}
                <p className="text-xs text-gray-500 mt-3">
                  Posted {new Date(mat.created_at).toLocaleDateString()}
                </p>
              </Card>
            ))
          )}
        </div>
      )}

      {/* Students Tab */}
      {activeTab === 'students' && (
        <div className="space-y-6">
          <Card className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Users className="w-5 h-5" /> {enrollments.length} Students
              </h3>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setShowInviteCodeModal(true)}
                className="flex items-center gap-2"
              >
                <Copy className="w-4 h-4" /> Share Code
              </Button>
            </div>
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <p className="text-sm text-gray-600 mb-1">Invite Code:</p>
              <div className="flex items-center gap-2">
                <code className="text-2xl font-bold text-indigo-600">{inviteCode}</code>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={copyInviteCode}
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </Card>

          {enrollments.length === 0 ? (
            <Card className="text-center py-12">
              <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600">No students yet</p>
            </Card>
          ) : (
            <Card className="overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                      Name
                    </th>
                   <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                      Roll Number
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {enrollments.map((student) => (
                    <tr key={student.id} className="hover:bg-gray-50">
                      <td className="px-6 py-3 font-medium text-gray-900">
                        {student.first_name} {student.last_name}
                      </td>
                      <td className="px-6 py-3 text-gray-600">{student.email}</td>
                      <td className="px-6 py-3 text-gray-600">
                        {student.roll_number || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          )}
        </div>
      )}

      {/* Insights Tab */}
      {activeTab === 'insights' && (
        <Card className="p-6 text-center">
          <BarChart3 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-600">Analytics coming soon</p>
        </Card>
      )}

      {/* Create Material Modal */}
      <CreateMaterialModal
        isOpen={showCreateMaterialModal}
        onClose={() => setShowCreateMaterialModal(false)}
        courseId={courseId}
        onSuccess={() => fetchCourseData()}
      />

      {/* Invite Code Modal */}
      {showInviteCodeModal && (
        <Modal className="max-w-md">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Share This Course</h2>
          <p className="text-gray-600 mb-6">
            Share this invite code with students so they can join your course.
          </p>
          <div className="bg-indigo-50 rounded-lg p-6 text-center mb-6">
            <p className="text-sm text-gray-600 mb-2">Invite Code</p>
            <code className="text-4xl font-bold text-indigo-600">{inviteCode}</code>
          </div>
          <Button
            variant="primary"
            onClick={copyInviteCode}
            className="w-full flex items-center justify-center gap-2"
          >
            <Copy className="w-4 h-4" /> Copy Code
          </Button>
          <Button
            variant="secondary"
            onClick={() => setShowInviteCodeModal(false)}
            className="w-full mt-3"
          >
            Close
          </Button>
        </Modal>
      )}
    </div>
  );
}
