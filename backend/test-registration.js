import http from 'http';

const API_URL = 'http://localhost:8080';

function makeRequest(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 8080,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          data: body ? JSON.parse(body) : null
        });
      });
    });

    req.on('error', reject);
    if (data) req.write(JSON.stringify(data));
    req.end();
  });
}

async function testRegistration() {
  console.log('\n=== Testing Authentication & Authorization Fixes ===\n');

  // Test 1: Valid registration
  console.log('Test 1: Valid Student Registration');
  try {
    const res = await makeRequest('POST', '/api/auth/register', {
      name: 'John Student',
      email: 'john@example.com',
      password: 'SecurePassword123'
    });
    console.log('✅ Status:', res.status);
    console.log('✅ User Role:', res.data.user.role);
    console.log('✅ Token Present:', !!res.data.token);
    console.log('✅ Message:', res.data.message);
  } catch (error) {
    console.error('❌ Error:', error.message);
  }

  // Test 2: Duplicate email
  console.log('\n\nTest 2: Duplicate Email (409 Conflict)');
  try {
    const res = await makeRequest('POST', '/api/auth/register', {
      name: 'Another User',
      email: 'john@example.com',
      password: 'SecurePassword123'
    });
    console.log('✅ Status:', res.status);
    console.log('✅ Error:', res.data.error);
  } catch (error) {
    console.error('❌ Error:', error.message);
  }

  // Test 3: Invalid email
  console.log('\n\nTest 3: Invalid Email Format (400)');
  try {
    const res = await makeRequest('POST', '/api/auth/register', {
      name: 'Test User',
      email: 'invalid-email',
      password: 'SecurePassword123'
    });
    console.log('✅ Status:', res.status);
    console.log('✅ Error:', res.data.error);
  } catch (error) {
    console.error('❌ Error:', error.message);
  }

  // Test 4: Password too short
  console.log('\n\nTest 4: Password Too Short (400)');
  try {
    const res = await makeRequest('POST', '/api/auth/register', {
      name: 'Test User',
      email: 'short@example.com',
      password: 'short'
    });
    console.log('✅ Status:', res.status);
    console.log('✅ Error:', res.data.error);
  } catch (error) {
    console.error('❌ Error:', error.message);
  }

  // Test 5: Missing fields
  console.log('\n\nTest 5: Missing Required Fields (400)');
  try {
    const res = await makeRequest('POST', '/api/auth/register', {
      name: 'Test User'
    });
    console.log('✅ Status:', res.status);
    console.log('✅ Error:', res.data.error);
  } catch (error) {
    console.error('❌ Error:', error.message);
  }

  // Test 6: Unauthorized access (no token)
  console.log('\n\nTest 6: No Token (401 Unauthorized)');
  try {
    const res = await makeRequest('GET', '/api/auth/me');
    console.log('✅ Status:', res.status);
    console.log('✅ Error:', res.data.error);
  } catch (error) {
    console.error('❌ Error:', error.message);
  }

  // Test 7: Health check
  console.log('\n\nTest 7: Health Check');
  try {
    const res = await makeRequest('GET', '/api/health');
    console.log('✅ Status:', res.status);
    console.log('✅ Health:', res.data.status);
  } catch (error) {
    console.error('❌ Error:', error.message);
  }

  console.log('\n=== All Tests Complete ===\n');
}

testRegistration().catch(console.error);
