import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Card, Button, Input, Textarea, Modal, Loading } from '../../components/ui.jsx';
import { AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, Download, FileText, MessageSquare, CheckCircle, 
  AlertCircle, Clock, BookOpen, Users 
} from 'lucide-react';
import { coursesAPI, assignmentsAPI, announcementsAPI, materialsAPI } from '../../api/client.js';
import MaterialRow from '../../components/materials/MaterialRow.jsx';
import YouTubeModal from '../../components/materials/YouTubeModal.jsx';
import { extractVideoId, isGoogleDriveUrl, isYouTubeUrl, getYouTubeEmbedUrl } from '../../lib/videoUtils.js';

const commentSchema = {
  content: (value) => (value && value.trim().length > 0) || 'Comment cannot be empty',
};

export default function StudentCourseDetail() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('assignments'); // assignments, materials, announcements, people
  const [submissions, setSubmissions] = useState({});
  const [comments, setComments] = useState({});
  const [showCommentModal, setShowCommentModal] = useState(false);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);

  const [videoModal, setVideoModal] = useState(null);

  const [commentContent, setCommentContent] = useState('');

  useEffect(() => {
    fetchCourseData();
  }, [courseId]);

  const fetchCourseData = async () => {
    setIsLoading(true);
    try {
      const [courseRes, assignmentsRes, announcementsRes, materialsRes] = await Promise.all([
        coursesAPI.get(courseId),
        assignmentsAPI.list(courseId),
        announcementsAPI.list(courseId),
        materialsAPI.list(courseId),
      ]);

      setCourse(courseRes.data);
      setAssignments(assignmentsRes.data);
      setAnnouncements(announcementsRes.data);
      setMaterials(materialsRes.data);

      // Fetch student submissions
      const submissionMap = {};
      for (const assignment of assignmentsRes.data) {
        try {
          const subRes = await assignmentsAPI.getStudentSubmission(assignment.id);
          submissionMap[assignment.id] = subRes.data;
        } catch (error) {
          // No submission yet
        }
      }
      setSubmissions(submissionMap);
    } catch (error) {
      toast.error('Failed to load course');
      navigate(-1);
    } finally {
      setIsLoading(false);
    }
  };

  const onAddComment = async () => {
    if (!selectedAnnouncement) return;

    const validation = commentSchema.content(commentContent);
    if (validation !== true) {
      toast.error(typeof validation === 'string' ? validation : 'Comment cannot be empty');
      return;
    }

    try {
      await announcementsAPI.addComment(selectedAnnouncement.id, { content: commentContent });
      toast.success('Comment added!');
      await fetchCourseData();
      setCommentContent('');
      setShowCommentModal(false);
    } catch (error) {
      toast.error('Failed to add comment');
    }
  };

  const getAssignmentStatus = (assignment) => {
    const submission = submissions[assignment.id];
    const dueDate = new Date(assignment.due_date);
    const now = new Date();
    const isOverdue = now > dueDate;

    if (submission && submission.grade !== null) {
      return { status: 'graded', color: 'text-green-600', icon: CheckCircle };
    } else if (submission) {
      return { status: 'submitted', color: 'text-blue-600', icon: CheckCircle };
    } else if (isOverdue) {
      return { status: 'overdue', color: 'text-red-600', icon: AlertCircle };
    } else {
      return { status: 'pending', color: 'text-yellow-600', icon: Clock };
    }
  };

  if (isLoading) return <Loading />;

  const handleMaterialClick = (material) => {
    const url = material?.link_url;
    if (!url) return;

    if (isYouTubeUrl(url)) {
      const info = getYouTubeEmbedUrl(url);
      if (info) {
        setVideoModal({
          platform: 'youtube',
          embedUrl: info.embedUrl,
          title: material.title || 'Video',
          thumbnailUrl: info.thumbnailUrl,
        });
        return;
      }
    }

    if (isGoogleDriveUrl(url)) {
      const info = extractVideoId(url);
      if (info?.embedUrl) {
        setVideoModal({
          platform: 'gdrive',
          embedUrl: info.embedUrl,
          title: material.title || 'Video',
          thumbnailUrl: null,
        });
        return;
      }
    }

    window.open(url, '_blank', 'noopener,noreferrer');
  };

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
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-4 mb-8 border-b border-gray-200">
        {[
          { tab: 'assignments', label: 'Assignments' },
          { tab: 'materials', label: 'Materials' },
          { tab: 'announcements', label: 'Announcements' },
          { tab: 'people', label: 'People' },
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

      {/* Assignments Tab */}
      {activeTab === 'assignments' && (
        <div className="space-y-6">
          {assignments.length === 0 ? (
            <Card className="text-center py-12">
              <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600">No assignments yet</p>
            </Card>
          ) : (
            assignments.map((assignment) => {
              const statusInfo = getAssignmentStatus(assignment);
              const StatusIcon = statusInfo.icon;
              const submission = submissions[assignment.id];
              const dueDate = new Date(assignment.due_date).toLocaleDateString();

              return (
                <Card key={assignment.id} className="p-6">
                  <div className="flex gap-6">
                    <div className={`${statusInfo.color}`}>
                      <StatusIcon className="w-8 h-8" />
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="text-lg font-bold text-gray-900">
                          {assignment.title}
                        </h3>
                        <span className="text-sm font-semibold text-gray-600">
                          {assignment.points} pts
                        </span>
                      </div>
                      <p className="text-gray-600 text-sm mb-4">
                        {assignment.instructions}
                      </p>
                      <div className="flex gap-4 items-center text-sm text-gray-600 mb-4">
                        <span>Due: {dueDate}</span>
                        {submission && submission.grade !== null && (
                          <span className="text-green-600 font-semibold">
                            Grade: {submission.grade}/{assignment.points}
                          </span>
                        )}
                      </div>
                      {submission && submission.feedback && (
                        <div className="bg-blue-50 border-l-4 border-blue-500 p-3 mb-4">
                          <p className="text-sm font-semibold text-blue-900 mb-1">
                            Teacher Feedback:
                          </p>
                          <p className="text-sm text-blue-800">
                            {submission.feedback}
                          </p>
                        </div>
                      )}

                      {submission && (submission.file_url || submission.drive_link || submission.link_url) && (
                        <div className="bg-gray-50 border border-gray-100 rounded-lg p-3 mb-4 space-y-2">
                          {submission.file_url && (
                            <a
                              href={submission.file_url}
                              target="_blank"
                              rel="noreferrer"
                              className="block text-sm text-indigo-600 hover:underline"
                            >
                              Open your submitted file
                            </a>
                          )}
                          {(submission.drive_link || submission.link_url) && (
                            <a
                              href={submission.drive_link || submission.link_url}
                              target="_blank"
                              rel="noreferrer"
                              className="block text-sm text-indigo-600 hover:underline"
                            >
                              Open your submitted link
                            </a>
                          )}
                        </div>
                      )}
                      <Button
                        variant={submission ? 'secondary' : 'primary'}
                        size="sm"
                        onClick={() => navigate(`/student/assignment/${assignment.id}`)}
                      >
                        {submission ? 'View / Resubmit' : 'Turn in'}
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })
          )}
        </div>
      )}

      {/* Materials Tab */}
      {activeTab === 'materials' && (
        <div className="space-y-6">
          {materials.length === 0 ? (
            <Card className="text-center py-12">
              <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600">No materials yet</p>
            </Card>
          ) : (
            <div className="bg-white rounded-[12px] border border-[#E8E6F0] overflow-visible">
              {materials.map((material) => (
                <MaterialRow
                  key={material.id}
                  material={material}
                  onClick={() => handleMaterialClick(material)}
                />
              ))}
            </div>
          )}

          <AnimatePresence>
            {videoModal && (
              <YouTubeModal
                embedUrl={videoModal.embedUrl}
                title={videoModal.title}
                platform={videoModal.platform}
                onClose={() => setVideoModal(null)}
              />
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Announcements Tab */}
      {activeTab === 'announcements' && (
        <div className="space-y-6">
          {announcements.length === 0 ? (
            <Card className="text-center py-12">
              <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600">No announcements yet</p>
            </Card>
          ) : (
            announcements.map((announcement) => (
              <Card key={announcement.id} className="p-6">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="text-lg font-bold text-gray-900">
                    {announcement.title}
                  </h3>
                  <span className="text-xs text-gray-500">
                    {new Date(announcement.created_at).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-gray-700 mb-4">{announcement.content}</p>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setSelectedAnnouncement(announcement);
                    setShowCommentModal(true);
                  }}
                  className="flex items-center gap-2"
                >
                  <MessageSquare className="w-4 h-4" /> Comment
                </Button>
              </Card>
            ))
          )}
        </div>
      )}

      {/* People Tab */}
      {activeTab === 'people' && (
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <Users className="w-6 h-6 text-indigo-600" />
            <h3 className="text-lg font-bold">Classmates</h3>
          </div>
          <p className="text-gray-600">
            {course?.enrollments?.length || 0} students enrolled in this class
          </p>
        </Card>
      )}

      {/* Add Comment Modal */}
      {showCommentModal && selectedAnnouncement && (
        <Modal isOpen={true} onClose={() => setShowCommentModal(false)} title={`Comment on: ${selectedAnnouncement.title}`} size="xl">
          <div className="mb-6">
            <p className="text-sm text-gray-600">Share your thoughts with the class.</p>
          </div>

          <Textarea
            label="Your Comment"
            placeholder="Share your thoughts..."
            value={commentContent}
            onChange={(e) => setCommentContent(e.target.value)}
          />

          <div className="flex gap-3 mt-6">
            <Button type="button" variant="primary" onClick={onAddComment}>
              Post Comment
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setShowCommentModal(false);
                setSelectedAnnouncement(null);
                setCommentContent('');
              }}
            >
              Cancel
            </Button>
          </div>
        </Modal>
      )}
    </div>
  );
}
