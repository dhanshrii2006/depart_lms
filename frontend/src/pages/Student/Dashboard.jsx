import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCourses, useCreateCourse, useEnrollByCode, useNotifications } from '../../hooks/index.js';
import { Button, Card, Input, Loading, Skeleton } from '../../components/ui.jsx';
import { Plus, Key } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';

const enrollSchema = z.object({
  code: z.string().min(1, 'Invite code is required'),
});

export default function StudentDashboard() {
  const navigate = useNavigate();
  const { data: courses, isLoading } = useCourses();
  const { data: notifications, isLoading: notificationsLoading } = useNotifications();
  const { mutate: enrollByCode, isPending } = useEnrollByCode();
  const [showEnrollModal, setShowEnrollModal] = useState(false);
  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(enrollSchema),
  });

  const onEnroll = (data) => {
    enrollByCode(data, {
      onSuccess: () => {
        toast.success('Enrolled successfully!');
        reset();
        setShowEnrollModal(false);
      },
      onError: (error) => {
        toast.error(error.response?.data?.error || 'Enrollment failed');
      },
    });
  };

  if (isLoading) return <Loading />;

  const recentNotifications = (notifications || []).slice(0, 5);

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">My Classes</h1>
        <Button
          variant="primary"
          onClick={() => setShowEnrollModal(true)}
          className="flex items-center gap-2"
        >
          <Key className="w-5 h-5" />
          Join Class
        </Button>
      </div>

      {/* Recent Notifications */}
      <Card className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Notifications</h2>
        </div>

        {notificationsLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-5 w-2/3" />
            <Skeleton className="h-5 w-1/2" />
          </div>
        ) : recentNotifications.length === 0 ? (
          <p className="text-sm text-gray-600">No notifications yet.</p>
        ) : (
          <div className="space-y-3">
            {recentNotifications.map((n) => (
              <button
                key={n.id}
                type="button"
                onClick={() => {
                  if (n.related_type === 'assignment' && n.related_id) {
                    navigate(`/student/assignment/${n.related_id}`);
                  }
                }}
                className="w-full text-left p-3 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{n.title}</p>
                    {n.message && <p className="text-xs text-gray-600 mt-0.5">{n.message}</p>}
                  </div>
                  {n.is_read === false && (
                    <span className="mt-1 inline-block w-2 h-2 bg-red-500 rounded-full" />
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </Card>

      {/* Courses Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {courses?.map((course) => (
          <div
            key={course.id}
            onClick={() => navigate(`/student/course/${course.id}`)}
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
          <p className="text-gray-600 mb-4">You haven't joined any classes yet</p>
          <Button
            variant="primary"
            onClick={() => setShowEnrollModal(true)}
          >
            Join Your First Class
          </Button>
        </Card>
      )}

      {/* Enroll Modal */}
      {showEnrollModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md">
            <h2 className="text-2xl font-bold mb-4">Join a Class</h2>
            <form onSubmit={handleSubmit(onEnroll)} className="space-y-4">
              <Input
                label="Invite Code"
                placeholder="Enter the 6-character code"
                {...register('code')}
                error={errors.code?.message}
              />
              <div className="flex gap-3">
                <Button
                  type="submit"
                  variant="primary"
                  className="flex-1"
                  disabled={isPending}
                >
                  {isPending ? 'Joining...' : 'Join'}
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  className="flex-1"
                  onClick={() => {
                    setShowEnrollModal(false);
                    reset();
                  }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
