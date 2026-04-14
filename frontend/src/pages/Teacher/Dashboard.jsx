import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCourses } from '../../hooks/index.js';
import { Button, Card, Loading } from '../../components/ui.jsx';
import { Plus } from 'lucide-react';
import { CreateCourseModal } from '../../components/course/index.js';

export default function TeacherDashboard() {
  const navigate = useNavigate();
  const { data: courses, isLoading } = useCourses();
  const [showCreateModal, setShowCreateModal] = useState(false);

  if (isLoading) return <Loading />;

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">My Classes</h1>
        <Button
          variant="primary"
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Create Class
        </Button>
      </div>

      {/* Courses Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {courses?.map((course) => (
          <div
            key={course.id}
            onClick={() => navigate(`/teacher/course/${course.id}`)}
            className="cursor-pointer group"
          >
            <Card className="h-48 flex flex-col justify-between p-6 transform transition-transform duration-200 group-hover:shadow-lg group-hover:-translate-y-1"
              style={{ borderTopColor: course.cover_color, borderTopWidth: '4px' }}>
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{course.title}</h3>
                <p className="text-sm text-gray-600">{course.subject || 'No subject'}</p>
              </div>
              <p className="text-xs text-gray-500">Section: {course.section || 'N/A'}</p>
            </Card>
          </div>
        ))}
      </div>

      {courses?.length === 0 && (
        <Card className="text-center py-12">
          <p className="text-gray-600 mb-4">You haven't created any classes yet</p>
          <Button
            variant="primary"
            onClick={() => setShowCreateModal(true)}
          >
            Create Your First Class
          </Button>
        </Card>
      )}

      {/* Create Modal */}
      <CreateCourseModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
      />
    </div>
  );
}
