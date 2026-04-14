import { Card, Loading } from './ui.jsx';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, AlertCircle, Award, BarChart3 } from 'lucide-react';

export default function GradeAnalytics({ analytics, isLoading }) {
  if (isLoading) return <Loading />;

  if (!analytics) {
    return (
      <Card className="p-6 text-center">
        <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-600">No analytics data available</p>
      </Card>
    );
  }

  const { assignments, studentCount, gradeDistribution } = analytics;

  // Prepare chart data for assignment performance
  const assignmentData = assignments.map((a) => ({
    name: a.title.length > 20 ? a.title.substring(0, 20) + '...' : a.title,
    avg: parseFloat(a.average_grade) || 0,
    max: a.max_grade || 0,
    min: a.min_grade || 0,
  }));

  // Prepare pie chart data for grade distribution
  const gradeData = [
    { name: 'A (90%+)', value: gradeDistribution.grade_a || 0, color: '#10B981' },
    { name: 'B (80-89%)', value: gradeDistribution.grade_b || 0, color: '#3B82F6' },
    { name: 'C (70-79%)', value: gradeDistribution.grade_c || 0, color: '#F59E0B' },
    { name: 'F (<70%)', value: gradeDistribution.grade_f || 0, color: '#EF4444' },
    { name: 'Not Graded', value: gradeDistribution.not_graded || 0, color: '#D1D5DB' },
  ].filter((item) => item.value > 0);

  const totalSubmissions = assignments.reduce((sum, a) => sum + (a.total_submissions || 0), 0);
  const totalGraded = assignments.reduce((sum, a) => sum + (a.graded_submissions || 0), 0);
  const gradingPercentage = totalSubmissions > 0 ? Math.round((totalGraded / totalSubmissions) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4 bg-gradient-to-br from-indigo-50 to-white border border-indigo-100">
          <p className="text-sm text-gray-600 mb-1">Total Students</p>
          <p className="text-3xl font-bold text-indigo-600">{studentCount}</p>
        </Card>
        <Card className="p-4 bg-gradient-to-br from-blue-50 to-white border border-blue-100">
          <p className="text-sm text-gray-600 mb-1">Total Submissions</p>
          <p className="text-3xl font-bold text-blue-600">{totalSubmissions}</p>
        </Card>
        <Card className="p-4 bg-gradient-to-br from-green-50 to-white border border-green-100">
          <p className="text-sm text-gray-600 mb-1">Graded</p>
          <p className="text-3xl font-bold text-green-600">{totalGraded}</p>
        </Card>
        <Card className="p-4 bg-gradient-to-br from-purple-50 to-white border border-purple-100">
          <p className="text-sm text-gray-600 mb-1">Grading Progress</p>
          <p className="text-3xl font-bold text-purple-600">{gradingPercentage}%</p>
        </Card>
      </div>

      {/* Grading Progress Bar */}
      <Card className="p-6 bg-gradient-to-r from-slate-50 to-slate-100 border border-slate-200">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-blue-600" />
            Grading Status
          </h3>
          <span className="text-sm font-bold text-blue-600">{Math.round(gradingPercentage)}%</span>
        </div>
        <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
          <div
            className="bg-gradient-to-r from-blue-500 to-blue-600 h-full rounded-full transition-all duration-500"
            style={{ width: `${gradingPercentage}%` }}
          />
        </div>
        <p className="text-xs text-gray-600 mt-2">{totalGraded} of {totalSubmissions} submissions graded</p>
      </Card>

      {/* Charts - Two Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Assignment Performance Chart */}
        {assignmentData.length > 0 && (
          <Card className="p-6 border border-slate-200">
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 className="w-5 h-5 text-indigo-600" />
              <h3 className="font-bold text-lg text-gray-900">Assignment Performance</h3>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={assignmentData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                <YAxis />
                <Tooltip contentStyle={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px' }} />
                <Legend wrapperStyle={{ paddingTop: '20px' }} />
                <Bar dataKey="avg" fill="#3B82F6" name="Average" radius={[8, 8, 0, 0]} />
                <Bar dataKey="max" fill="#10B981" name="Max" radius={[8, 8, 0, 0]} />
                <Bar dataKey="min" fill="#F59E0B" name="Min" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        )}

        {/* Grade Distribution Chart */}
        {gradeData.length > 0 && (
          <Card className="p-6 border border-slate-200">
            <div className="flex items-center gap-2 mb-4">
              <Award className="w-5 h-5 text-purple-600" />
              <h3 className="font-bold text-lg text-gray-900">Grade Distribution</h3>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={gradeData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {gradeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `${value} submissions`} contentStyle={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px' }} />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        )}
      </div>

      {/* Detailed Assignment Stats */}
      <Card className="p-6 border border-slate-200">
        <h3 className="font-bold text-lg text-gray-900 mb-4 flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-slate-600" />
          Assignment Details
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b-2 border-slate-300 bg-slate-50">
                <th className="text-left py-3 px-4 text-gray-700 font-bold">Assignment</th>
                <th className="text-center py-3 px-4 text-gray-700 font-bold">Points</th>
                <th className="text-center py-3 px-4 text-gray-700 font-bold">Submissions</th>
                <th className="text-center py-3 px-4 text-gray-700 font-bold">Graded</th>
                <th className="text-center py-3 px-4 text-gray-700 font-bold">Average</th>
                <th className="text-center py-3 px-4 text-gray-700 font-bold">Min - Max</th>
              </tr>
            </thead>
            <tbody>
              {assignments.map((assignment, index) => (
                <tr key={assignment.id} className={`border-b border-slate-100 ${index % 2 === 0 ? 'bg-white' : 'bg-slate-50'} hover:bg-blue-50 transition-colors`}>
                  <td className="py-3 px-4 text-gray-900 font-medium">{assignment.title}</td>
                  <td className="text-center py-3 px-4 text-gray-600">{assignment.points}</td>
                  <td className="text-center py-3 px-4 text-gray-600">{assignment.total_submissions}</td>
                  <td className="text-center py-3 px-4">
                    <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-bold">
                      {assignment.graded_submissions}
                    </span>
                  </td>
                  <td className="text-center py-3 px-4 text-gray-900 font-bold text-lg">
                    {assignment.average_grade ? parseFloat(assignment.average_grade).toFixed(1) + '%' : '-'}
                  </td>
                  <td className="text-center py-3 px-4 text-gray-600 text-sm">
                    <span className="text-orange-600 font-semibold">{assignment.min_grade ? parseFloat(assignment.min_grade).toFixed(1) : '-'}</span>
                    <span className="text-gray-400"> - </span>
                    <span className="text-green-600 font-semibold">{assignment.max_grade ? parseFloat(assignment.max_grade).toFixed(1) : '-'}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
