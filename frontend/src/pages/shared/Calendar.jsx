import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Loading } from '../../components/ui.jsx';
import { assignmentsAPI, coursesAPI } from '../../api/client.js';
import { useAuthStore } from '../../store/index.js';

function formatDateShort(date) {
  return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' }).format(date);
}

export default function Calendar() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [events, setEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const run = async () => {
      setIsLoading(true);
      try {
        if (user?.role === 'student') {
          const res = await assignmentsAPI.getTranscript();
          const transcript = res.data?.transcript || [];
          const byAssignmentId = new Map();

          for (const row of transcript) {
            if (!row?.assignment_id || !row?.due_date) continue;
            if (!byAssignmentId.has(row.assignment_id)) {
              byAssignmentId.set(row.assignment_id, {
                assignmentId: row.assignment_id,
                title: row.assignment_title,
                courseTitle: row.course_title,
                dueDate: new Date(row.due_date),
                role: 'student',
              });
            }
          }

          setEvents(Array.from(byAssignmentId.values()));
        } else if (user?.role === 'teacher') {
          const coursesRes = await coursesAPI.list();
          const courses = coursesRes.data || [];
          const all = [];

          for (const course of courses) {
            const aRes = await assignmentsAPI.list(course.id);
            const assignments = aRes.data || [];
            for (const a of assignments) {
              if (!a?.due_date) continue;
              all.push({
                assignmentId: a.id,
                title: a.title,
                courseTitle: course.title,
                dueDate: new Date(a.due_date),
                role: 'teacher',
              });
            }
          }

          setEvents(all);
        } else {
          setEvents([]);
        }
      } catch {
        setEvents([]);
      } finally {
        setIsLoading(false);
      }
    };

    run();
  }, [user?.role]);

  const upcoming = useMemo(() => {
    const now = new Date();
    return [...events]
      .filter((e) => e.dueDate instanceof Date && !Number.isNaN(e.dueDate.getTime()))
      .filter((e) => e.dueDate >= new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1))
      .sort((a, b) => a.dueDate - b.dueDate)
      .slice(0, 20);
  }, [events]);

  if (isLoading) return <Loading />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Calendar</h1>
        <p className="text-gray-600">Upcoming assignment due dates</p>
      </div>

      <Card>
        {upcoming.length === 0 ? (
          <p className="text-gray-600">No upcoming due dates.</p>
        ) : (
          <div className="divide-y">
            {upcoming.map((e) => (
              <button
                key={e.assignmentId}
                type="button"
                onClick={() => {
                  if (user?.role === 'student') {
                    navigate(`/student/assignment/${e.assignmentId}`);
                  } else if (user?.role === 'teacher') {
                    navigate(`/teacher/grading/${e.assignmentId}`);
                  }
                }}
                className="w-full text-left py-4 flex items-start justify-between gap-4 hover:bg-gray-50 px-2 rounded-lg transition-colors"
              >
                <div>
                  <p className="font-medium text-gray-900">{e.title}</p>
                  <p className="text-sm text-gray-600">{e.courseTitle}</p>
                </div>
                <div className="text-sm text-gray-700 whitespace-nowrap">
                  {formatDateShort(e.dueDate)}
                </div>
              </button>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
