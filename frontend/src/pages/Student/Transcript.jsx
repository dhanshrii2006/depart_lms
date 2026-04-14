import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Card, Loading, Badge } from '../../components/ui.jsx';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { BookOpen, TrendingUp, AlertCircle } from 'lucide-react';
import { assignmentsAPI } from '../../api/client.js';

export default function StudentTranscript() {
  const [transcript, setTranscript] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchTranscript();
  }, []);

  const fetchTranscript = async () => {
    setIsLoading(true);
    try {
      const res = await assignmentsAPI.getTranscript();
      setTranscript(res.data);
    } catch (error) {
      toast.error('Failed to load transcript');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) return <Loading />;

  if (!transcript) {
    return (
      <Card className="text-center py-12">
        <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-600">No transcript data available</p>
      </Card>
    );
  }

  const { courses, transcript: transcriptData } = transcript;

  // Calculate GPA (average of all grades)
  const gradesData = transcriptData.filter((t) => t.grade !== null);
  const averageGrade =
    gradesData.length > 0 ? gradesData.reduce((sum, t) => sum + parseFloat(t.grade), 0) / gradesData.length : 0;

  // Calculate GPA on 4.0 scale
  const gpa = (averageGrade / (transcriptData[0]?.points || 100)) * 4.0 || 0;

  // Group transcript by course
  const courseGroups = courses.map((course) => ({
    ...course,
    assignments: transcriptData.filter((t) => t.course_id === course.id),
  }));

  // Prepare data for overall performance chart
  const chartData = courseGroups.map((course) => {
    const courseGrades = course.assignments.filter((a) => a.grade !== null);
    const courseAverage =
      courseGrades.length > 0 ? courseGrades.reduce((sum, a) => sum + parseFloat(a.grade), 0) / courseGrades.length : 0;
    return {
      name: course.title.length > 15 ? course.title.substring(0, 15) + '...' : course.title,
      average: parseFloat(courseAverage.toFixed(1)),
    };
  });

  const getGradeColor = (grade, maxPoints) => {
    const percentage = (grade / (maxPoints || 100)) * 100;
    if (percentage >= 90) return 'bg-green-100 text-green-800';
    if (percentage >= 80) return 'bg-blue-100 text-blue-800';
    if (percentage >= 70) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  const getGradeLetter = (grade, maxPoints) => {
    const percentage = (grade / (maxPoints || 100)) * 100;
    if (percentage >= 90) return 'A';
    if (percentage >= 80) return 'B';
    if (percentage >= 70) return 'C';
    return 'F';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Academic Transcript</h1>
        <p className="text-gray-600">View your grades across all courses</p>
      </div>

      {/* Overall Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="p-4">
          <p className="text-sm text-gray-600 mb-1">Courses Enrolled</p>
          <p className="text-2xl font-bold text-indigo-600">{courses.length}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-600 mb-1">Assignments</p>
          <p className="text-2xl font-bold text-blue-600">{transcriptData.length}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-600 mb-1">Average Grade</p>
          <p className="text-2xl font-bold text-green-600">{averageGrade.toFixed(1)}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-600 mb-1">GPA</p>
          <p className="text-2xl font-bold text-purple-600">{gpa.toFixed(2)}</p>
        </Card>
      </div>

      {/* Performance Chart */}
      {chartData.length > 0 && (
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-indigo-600" />
            <h3 className="font-bold text-lg text-gray-900">Course Performance</h3>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
              <YAxis />
              <Tooltip />
              <Bar dataKey="average" fill="#3B82F6" name="Average Score" />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      )}

      {/* Courses and Assignments */}
      <div className="space-y-6">
        {courseGroups.map((course) => {
          const courseGrades = course.assignments.filter((a) => a.grade !== null);
          const courseAverage =
            courseGrades.length > 0
              ? courseGrades.reduce((sum, a) => sum + parseFloat(a.grade), 0) / courseGrades.length
              : null;

          return (
            <Card key={course.id} className="p-6">
              {/* Course Header */}
              <div className="flex items-start justify-between mb-4 border-b pb-4">
                <div>
                  <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-indigo-600" />
                    {course.title}
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {course.subject} • Taught by {course.first_name} {course.last_name}
                  </p>
                </div>
                {courseAverage !== null && (
                  <div className="text-right">
                    <Badge className={`text-lg font-bold ${getGradeColor(courseAverage, 100)}`}>
                      {getGradeLetter(courseAverage, 100)}
                    </Badge>
                    <p className="text-sm text-gray-600 mt-1">{courseAverage.toFixed(1)}/100</p>
                  </div>
                )}
              </div>

              {/* Assignments */}
              {course.assignments.length === 0 ? (
                <p className="text-gray-600 text-center py-4">No assignments in this course</p>
              ) : (
                <div className="space-y-2">
                  {course.assignments.map((assignment) => (
                    <div
                      key={assignment.assignment_id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{assignment.assignment_title}</p>
                        <p className="text-xs text-gray-500">
                          Due: {new Date(assignment.due_date).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-4">
                        {assignment.feedback && (
                          <div className="text-right">
                            <p className="text-xs text-gray-600 mb-1">Feedback</p>
                            <p className="text-xs max-w-[200px] text-gray-600 line-clamp-2">
                              {assignment.feedback}
                            </p>
                          </div>
                        )}
                        {assignment.grade !== null ? (
                          <div className="text-right">
                            <Badge className={getGradeColor(assignment.grade, assignment.points)}>
                              {parseFloat(assignment.grade).toFixed(1)}/{assignment.points}
                            </Badge>
                            <p className="text-xs text-gray-600 mt-1">
                              {((assignment.grade / assignment.points) * 100).toFixed(0)}%
                            </p>
                          </div>
                        ) : (
                          <Badge className="bg-gray-200 text-gray-700">Not Graded</Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          );
        })}
      </div>

      {/* No Courses Message */}
      {courses.length === 0 && (
        <Card className="text-center py-12">
          <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-600">You are not enrolled in any courses yet</p>
        </Card>
      )}
    </div>
  );
}
