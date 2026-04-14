export const MOCK_USERS = {
  admin: {
    id: '1',
    name: 'Admin User',
    email: 'admin@acadify.com',
    role: 'admin',
    avatar: null,
  },
  teacher: {
    id: '2',
    name: 'Jane Smith',
    email: 'jane@acadify.com',
    role: 'teacher',
    avatar: null,
  },
  student: {
    id: '3',
    name: 'John Doe',
    email: 'john@acadify.com',
    role: 'student',
    avatar: null,
  },
};

export const MOCK_COURSES = [
  {
    id: '1',
    title: 'Advanced React',
    subject: 'Computer Science',
    section: '10A',
    teacher: { id: '2', name: 'Jane Smith' },
    color: 'indigo',
    students: 28,
    inviteCode: 'REACT101',
  },
  {
    id: '2',
    title: 'Web Design Fundamentals',
    subject: 'Design',
    section: '9B',
    teacher: { id: '2', name: 'Jane Smith' },
    color: 'emerald',
    students: 32,
    inviteCode: 'DESIGN01',
  },
  {
    id: '3',
    title: 'Data Structures',
    subject: 'Computer Science',
    section: '11C',
    teacher: { id: '2', name: 'Jane Smith' },
    color: 'rose',
    students: 25,
    inviteCode: 'DATA101',
  },
  {
    id: '4',
    title: 'Mathematics Advanced',
    subject: 'Mathematics',
    section: '10A',
    teacher: { id: '2', name: 'Jane Smith' },
    color: 'amber',
    students: 30,
    inviteCode: 'MATH101',
  },
  {
    id: '5',
    title: 'English Literature',
    subject: 'English',
    section: '9B',
    teacher: { id: '2', name: 'Jane Smith' },
    color: 'sky',
    students: 35,
    inviteCode: 'ENG101',
  },
];

export const MOCK_ASSIGNMENTS = [
  {
    id: '1',
    courseId: '1',
    title: 'Build a Todo App with Context API',
    description: 'Create a fully functional todo application using React Context API for state management.',
    dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
    points: 100,
    topic: 'State Management',
    status: 'assigned',
    instructions: 'Build a todo app with the following requirements:...',
  },
  {
    id: '2',
    courseId: '1',
    title: 'Implement Custom Hooks',
    description: 'Create 3 custom React hooks and explain their use cases.',
    dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
    points: 75,
    topic: 'Hooks',
    status: 'assigned',
  },
  {
    id: '3',
    courseId: '2',
    title: 'Design a Landing Page',
    description: 'Create a modern, responsive landing page for a SaaS product.',
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    points: 100,
    topic: 'UI Design',
    status: 'assigned',
  },
];

export const MOCK_ANNOUNCEMENTS = [
  {
    id: '1',
    courseId: '1',
    author: { id: '2', name: 'Jane Smith', initials: 'JS' },
    content: 'Welcome to Advanced React! This course will cover the latest React patterns and best practices.',
    timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    comments: [
      {
        id: 'c1',
        author: { id: '3', name: 'John Doe' },
        content: 'Excited for this course!',
        timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      },
    ],
  },
];

export const MOCK_SUBMISSIONS = [
  {
    id: '1',
    assignmentId: '1',
    studentId: '3',
    submittedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    status: 'submitted',
    grade: null,
    files: [
      { id: 'f1', name: 'todo-app.zip', size: 245000, type: 'application/zip' },
    ],
  },
];

export const MOCK_GRADES = {
  '3': {
    '1': 87,
    '2': 92,
    '3': null,
  },
};

export const MOCK_NOTIFICATIONS = [
  {
    id: '1',
    type: 'assignment_due',
    title: 'Assignment Due Soon',
    message: 'Your React assignment is due in 2 days',
    read: false,
    timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000),
  },
  {
    id: '2',
    type: 'grade_posted',
    title: 'Grade Posted',
    message: 'Your assignment has been graded: 87/100',
    read: false,
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
  },
  {
    id: '3',
    type: 'announcement',
    title: 'New Announcement',
    message: 'Jane Smith posted a new announcement in Advanced React',
    read: true,
    timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
  },
];
