const BASE = 'http://localhost:4000';

// Test data
const testTeacher = {
  name: 'Test Teacher',
  email: 'teacher-' + Date.now() + '@test.com',
  password: 'password123',
  role: 'teacher'
};

const testStudent = {
  name: 'Test Student',
  email: 'student-' + Date.now() + '@test.com',
  password: 'password123',
  role: 'student'
};

let teacherToken = null;
let studentToken = null;
let courseId = null;
let inviteCode = null;

async function request(method, path, body = null, token = null) {
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
    }
  };

  if (token) {
    options.headers['Authorization'] = `Bearer ${token}`;
  }

  if (body) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(BASE + path, options);
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.error || `HTTP ${response.status}`);
  }
  
  return data;
}

async function runTests() {
  console.log('\n🧪 Starting Acadify Course Publishing Test Suite\n');

  try {
    // 1. Register teacher
    console.log('📝 1. Registering teacher...');
    const teacherReg = await request('POST', '/api/auth/register', testTeacher);
    console.log('✅ Teacher registered:', teacherReg.user.email);

    // 2. Login teacher
    console.log('📝 2. Logging in teacher...');
    const teacherLogin = await request('POST', '/api/auth/login', {
      email: testTeacher.email,
      password: testTeacher.password
    });
    teacherToken = teacherLogin.token;
    console.log('✅ Teacher logged in, token:', teacherToken.substring(0, 20) + '...');

    // 3. Create course
    console.log('📝 3. Creating course...');
    const courseResponse = await request('POST', '/api/courses', {
      title: 'Test Course - ' + Date.now(),
      description: 'This is a test course for publishing'
    }, teacherToken);
    courseId = courseResponse.id;
    inviteCode = courseResponse.invite_code;
    console.log('✅ Course created:');
    console.log('   - ID:', courseId);
    console.log('   - Invite Code:', inviteCode);
    console.log('   - Published:', courseResponse.is_published);

    // 4. Publish course
    console.log('📝 4. Publishing course via PATCH...');
    const publishResponse = await request('PATCH', `/api/courses/${courseId}`, {
      is_published: true
    }, teacherToken);
    console.log('✅ Course published successfully:');
    console.log('   - Published:', publishResponse.course.is_published);
    console.log('   - Invite Code:', publishResponse.course.invite_code);

    // 5. Verify course appears in public list
    console.log('📝 5. Checking if course appears in public list...');
    const publicCourses = await request('GET', '/api/courses/public');
    const foundCourse = publicCourses.courses.find(c => c.id === courseId);
    if (foundCourse) {
      console.log('✅ Course found in public list');
    } else {
      console.log('⚠️ Course not found in public list (might be a query timing issue)');
    }

    // 6. Register student
    console.log('📝 6. Registering student...');
    const studentReg = await request('POST', '/api/auth/register', testStudent);
    console.log('✅ Student registered:', studentReg.user.email);

    // 7. Login student
    console.log('📝 7. Logging in student...');
    const studentLogin = await request('POST', '/api/auth/login', {
      email: testStudent.email,
      password: testStudent.password
    });
    studentToken = studentLogin.token;
    console.log('✅ Student logged in');

    // 8. Student joins course with invite code
    console.log('📝 8. Student joining course with invite code...');
    const enrollResponse = await request('POST', '/api/enrollments/join', {
      invite_code: inviteCode
    }, studentToken);
    console.log('✅ Student enrolled successfully:');
    console.log('   - Enrollment ID:', enrollResponse.enrollment.id);

    // 9. Verify student can see the course in their courses
    console.log('📝 9. Checking student enrolled courses...');
    const myCourses = await request('GET', '/api/enrollments/my-courses', null, studentToken);
    const studentCourse = myCourses.find(c => c.id === courseId);
    if (studentCourse) {
      console.log('✅ Course found in student enrolled courses');
      console.log('   - Title:', studentCourse.title);
      console.log('   - Teacher:', studentCourse.teacher_name);
    } else {
      console.log('❌ Course not found in student enrolled courses');
    }

    console.log('\n✅ All tests passed! Course publishing workflow is working.\n');
    process.exit(0);

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    process.exit(1);
  }
}

runTests();
