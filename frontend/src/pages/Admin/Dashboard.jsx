import { useState, useEffect } from 'react';
import { Card, Button, Loading } from '../../components/ui.jsx';
import { adminAPI } from '../../api/client.js';
import { Users, BookOpen } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await adminAPI.getStats();
      setStats(response.data);
    } catch (error) {
      toast.error('Failed to load statistics');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) return <Loading />;

  const statCards = [
    {
      title: 'Total Users',
      value: stats?.totalUsers || 0,
      icon: Users,
      color: 'bg-indigo-100 text-indigo-600',
    },
    {
      title: 'Total Courses',
      value: stats?.totalCourses || 0,
      icon: BookOpen,
      color: 'bg-cyan-100 text-cyan-600',
    },
    {
      title: 'Total Enrollments',
      value: stats?.totalEnrollments || 0,
      icon: Users,
      color: 'bg-pink-100 text-pink-600',
    },
  ];

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Admin Dashboard</h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title} className="flex items-center gap-4">
              <div className={`p-4 rounded-lg ${stat.color}`}>
                <Icon className="w-8 h-8" />
              </div>
              <div>
                <p className="text-gray-600 text-sm">{stat.title}</p>
                <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <h3 className="text-lg font-bold text-gray-900 mb-4">User Management</h3>
          <p className="text-gray-600 mb-4">Manage teachers, students, and permissions</p>
          <Button
            variant="primary"
            onClick={() => window.location.href = '/admin/users'}
          >
            Manage Users
          </Button>
        </Card>

        <Card>
          <h3 className="text-lg font-bold text-gray-900 mb-4">Roll Number Management</h3>
          <p className="text-gray-600 mb-4">Upload and manage valid student roll numbers</p>
          <Button
            variant="primary"
            onClick={() => window.location.href = '/admin/roll-numbers'}
          >
            Manage Roll Numbers
          </Button>
        </Card>
      </div>
    </div>
  );
}
