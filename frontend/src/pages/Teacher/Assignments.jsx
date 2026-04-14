import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { ArrowLeft, ClipboardList, CheckCircle, Clock } from 'lucide-react';
import { Card, Button, Loading } from '../../components/ui.jsx';
import { assignmentsAPI, coursesAPI } from '../../api/client.js';

function formatDueDate(dateString) {
  if (!dateString) return 'No due date';
  const d = new Date(dateString);
  if (Number.isNaN(d.getTime())) return 'No due date';
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(d);
}

export default function TeacherAssignments() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const run = async () => {
      setIsLoading(true);
      try {
        const [cRes, aRes] = await Promise.all([
          coursesAPI.get(courseId),
          assignmentsAPI.list(courseId),
        ]);
        setCourse(cRes.data);
        setAssignments(aRes.data);
      } catch {
        toast.error('Failed to load assignments');
        navigate(-1);
      } finally {
        setIsLoading(false);
      }
    };

    if (courseId) run();
  }, [courseId, navigate]);

  if (isLoading) return <Loading />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <Button variant="ghost" onClick={() => navigate(-1)} className="flex items-center gap-2">
          <ArrowLeft className="w-5 h-5" /> Back
        </Button>
        <Button
          variant="secondary"
          onClick={() => navigate(`/teacher/gradebook/${courseId}`)}
        >
          Open Gradebook
        </Button>
      </div>

      <div>
        <h1 className="text-3xl font-bold text-gray-900">Assignments</h1>
        <p className="text-gray-600">{course?.title}</p>
      </div>

      <Card>
        {assignments.length === 0 ? (
          <p className="text-gray-600">No assignments yet. Create one from the course page.</p>
        ) : (
          <div className="divide-y">
            {assignments.map((a) => (
              <div key={a.id} className="py-4 flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="font-medium text-gray-900 truncate">{a.title}</p>
                  <p className="text-sm text-gray-600 flex items-center gap-2 mt-1">
                    <Clock className="w-4 h-4" /> {formatDueDate(a.due_date)}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">Points: {a.points ?? 100}</p>
                </div>
                <Button
                  variant="primary"
                  onClick={() => navigate(`/teacher/grading/${a.id}`)}
                  className="flex items-center gap-2"
                >
                  <ClipboardList className="w-4 h-4" /> Grade
                </Button>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
