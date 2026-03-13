import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Counter, Rate, Trend } from 'k6/metrics';

// Custom metrics
const errors = new Counter('errors');
const errorRate = new Rate('error_rate');
const requestDuration = new Trend('request_duration_ms');

// Configuration
const BASE_URL = __ENV.BASE_URL || 'http://localhost:3333';
const TEST_EMAIL = __ENV.TEST_EMAIL || 'admin@example.com';
const TEST_PASSWORD = __ENV.TEST_PASSWORD || 'admin123';

// Test scenarios
export const options = {
  scenarios: {
    // Load Test: 1000+ concurrent users, steady state
    load_test: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '2m', target: 500 },  // Ramp up to 500 users
        { duration: '5m', target: 1000 }, // Ramp up to 1000 users
        { duration: '5m', target: 1000 }, // Hold at 1000 users
        { duration: '2m', target: 0 },    // Ramp down
      ],
      gracefulRampDown: '30s',
    },
    // Stress Test: progressive increase beyond capacity
    stress_test: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '1m', target: 100 },
        { duration: '2m', target: 500 },
        { duration: '3m', target: 1000 },
        { duration: '5m', target: 2000 }, // Push beyond 1000
        { duration: '2m', target: 0 },
      ],
      gracefulRampDown: '30s',
    },
    // Spike Test: sudden increase in traffic
    spike_test: {
      executor: 'ramping-vus',
      startVUs: 50,
      stages: [
        { duration: '30s', target: 50 },   // Baseline
        { duration: '30s', target: 1500 }, // Spike to 1500
        { duration: '1m', target: 1500 },  // Hold spike
        { duration: '30s', target: 50 },  // Return to baseline
      ],
    },
    // Endurance Test: sustained load over time
    endurance_test: {
      executor: 'constant-vus',
      vus: 500,
      duration: '15m', // 15 minutes sustained
    },
  },
  thresholds: {
    http_req_duration: ['p(95)<500', 'p(99)<1000'],
    http_req_failed: ['rate<0.05'], // Less than 5% errors
    error_rate: ['rate<0.05'],
  },
};

// Get auth token
let authToken = '';

export function setup() {
  const loginRes = http.post(
    `${BASE_URL}/auth/login`,
    JSON.stringify({ email: TEST_EMAIL, password: TEST_PASSWORD }),
    { headers: { 'Content-Type': 'application/json' } }
  );

  if (loginRes.status === 200) {
    const body = JSON.parse(loginRes.body);
    authToken = body.token;
    console.log(`Authenticated successfully, token: ${authToken.substring(0, 20)}...`);
  } else {
    console.log(`Login failed with status ${loginRes.status}: ${loginRes.body}`);
  }

  return { authToken };
}

// Health Check Test
function testHealthCheck() {
  group('Health Check', () => {
    const res = http.get(`${BASE_URL}/health`);

    const success = check(res, {
      'health check returns 200': (r) => r.status === 200,
      'health check has status ok': (r) => {
        try {
          return JSON.parse(r.body).status === 'ok';
        } catch (e) {
          return false;
        }
      },
    });

    if (!success) {
      errors.add(1);
      errorRate.add(1);
    } else {
      errorRate.add(0);
    }

    requestDuration.add(res.timings.duration);
  });
}

// Auth Test
function testAuth() {
  group('Auth - Login', () => {
    const res = http.post(
      `${BASE_URL}/auth/login`,
      JSON.stringify({ email: TEST_EMAIL, password: TEST_PASSWORD }),
      { headers: { 'Content-Type': 'application/json' } }
    );

    const success = check(res, {
      'login returns 200': (r) => r.status === 200,
      'login returns token': (r) => {
        try {
          return JSON.parse(r.body).token !== undefined;
        } catch (e) {
          return false;
        }
      },
    });

    if (!success) {
      errors.add(1);
      errorRate.add(1);
    } else {
      errorRate.add(0);
    }

    requestDuration.add(res.timings.duration);
  });
}

// Get Current User Test
function testGetMe() {
  if (!authToken) return;

  group('Auth - Get Me', () => {
    const res = http.get(`${BASE_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });

    const success = check(res, {
      'get me returns 200': (r) => r.status === 200,
      'get me returns user': (r) => {
        try {
          return JSON.parse(r.body).id !== undefined;
        } catch (e) {
          return false;
        }
      },
    });

    if (!success) {
      errors.add(1);
      errorRate.add(1);
    } else {
      errorRate.add(0);
    }

    requestDuration.add(res.timings.duration);
  });
}

// List Users Test
function testListUsers() {
  if (!authToken) return;

  group('Users - List', () => {
    const res = http.get(`${BASE_URL}/users?page=1&limit=10`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });

    const success = check(res, {
      'list users returns 200': (r) => r.status === 200,
      'list users has data': (r) => {
        try {
          return JSON.parse(r.body).users !== undefined;
        } catch (e) {
          return false;
        }
      },
    });

    if (!success) {
      errors.add(1);
      errorRate.add(1);
    } else {
      errorRate.add(0);
    }

    requestDuration.add(res.timings.duration);
  });
}

// Create User Test
function testCreateUser() {
  if (!authToken) return;

  const uniqueEmail = `test_${Date.now()}@example.com`;

  group('Users - Create', () => {
    const res = http.post(
      `${BASE_URL}/users`,
      JSON.stringify({
        name: 'Test User',
        email: uniqueEmail,
        password: 'testpass123',
      }),
      {
        headers: {
          Authorization: `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const success = check(res, {
      'create user returns 201 or 400': (r) => r.status === 201 || r.status === 400,
    });

    if (!success) {
      errors.add(1);
      errorRate.add(1);
    } else {
      errorRate.add(0);
    }

    requestDuration.add(res.timings.duration);
  });
}

// Main test function
export default function (data) {
  // Run all tests with small delays between them
  testHealthCheck();
  sleep(0.1);

  testAuth();
  sleep(0.1);

  testGetMe();
  sleep(0.1);

  testListUsers();
  sleep(0.1);

  testCreateUser();

  // Small pause between iterations
  sleep(0.2);
}
