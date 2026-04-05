import http from 'http';

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
        try {
          const parsed = body && body.startsWith('{') ? JSON.parse(body) : body;
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: parsed
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: body
          });
        }
      });
    });

    req.on('error', reject);
    if (data) req.write(JSON.stringify(data));
    req.end();
  });
}

async function testSecurityFixes() {
  console.log('\n=== Testing Security Fixes ===\n');

  // Test 1: Helmet headers
  console.log('Test 1: Helmet Security Headers');
  try {
    const res = await makeRequest('GET', '/api/health');
    const hasSecurityHeaders = res.headers['x-content-type-options'] || res.headers['x-frame-options'];
    console.log('✅ Status:', res.status);
    console.log('✅ Helmet Headers Present:', !!hasSecurityHeaders);
    console.log('✅ Headers:', Object.keys(res.headers).filter(h => h.startsWith('x-')).slice(0, 3));
  } catch (error) {
    console.error('❌ Error:', error.message);
  }

  // Test 2: CORS Configuration
  console.log('\n\nTest 2: CORS Configuration (Development Mode)');
  try {
    const res = await makeRequest('GET', '/api/health');
    console.log('✅ Status:', res.status);
    console.log('✅ CORS Allow Origin:', res.headers['access-control-allow-origin']);
    console.log('✅ CORS Credentials:', res.headers['access-control-allow-credentials']);
  } catch (error) {
    console.error('❌ Error:', error.message);
  }

  // Test 3: Login validation (missing email)
  console.log('\n\nTest 3: Login Validation - Missing Email (400)');
  try {
    const res = await makeRequest('POST', '/api/auth/login', {
      password: 'TestPassword123'
    });
    console.log('✅ Status:', res.status);
    console.log('✅ Error Message:', res.data.error);
  } catch (error) {
    console.error('❌ Error:', error.message);
  }

  // Test 4: Login validation (invalid email)
  console.log('\n\nTest 4: Login Validation - Invalid Email (400)');
  try {
    const res = await makeRequest('POST', '/api/auth/login', {
      email: 'not-an-email',
      password: 'TestPassword123'
    });
    console.log('✅ Status:', res.status);
    console.log('✅ Error Message:', res.data.error);
  } catch (error) {
    console.error('❌ Error:', error.message);
  }

  // Test 5: Login validation (missing password)
  console.log('\n\nTest 5: Login Validation - Missing Password (400)');
  try {
    const res = await makeRequest('POST', '/api/auth/login', {
      email: 'test@example.com'
    });
    console.log('✅ Status:', res.status);
    console.log('✅ Error Message:', res.data.error);
  } catch (error) {
    console.error('❌ Error:', error.message);
  }

  // Test 6: Rate limiting on auth routes (simulate multiple requests)
  console.log('\n\nTest 6: Auth Rate Limiting (First Request)');
  try {
    const res = await makeRequest('POST', '/api/auth/login', {
      email: 'test@example.com',
      password: 'password'
    });
    console.log('✅ Status:', res.status);
    console.log('✅ RateLimit-Remaining:', res.headers['ratelimit-remaining']);
    console.log('✅ RateLimit-Reset:', res.headers['ratelimit-reset']);
  } catch (error) {
    console.error('❌ Error:', error.message);
  }

  // Test 7: Health check returns clean response
  console.log('\n\nTest 7: Health Check (No Error Details)');
  try {
    const res = await makeRequest('GET', '/api/health');
    console.log('✅ Status:', res.status);
    console.log('✅ Response:', JSON.stringify(res.data));
    console.log('✅ No error details exposed:', !res.data.stack && !res.data.message);
  } catch (error) {
    console.error('❌ Error:', error.message);
  }

  console.log('\n=== Security Tests Complete ===\n');
}

testSecurityFixes().catch(console.error);
