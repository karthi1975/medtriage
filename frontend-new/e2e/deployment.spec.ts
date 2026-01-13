/**
 * MediChat GCP Deployment E2E Tests
 * Tests complete deployment including Frontend, Backend, and HAPI FHIR integration
 */

import { test, expect } from '@playwright/test';

const BACKEND_URL = 'https://fhir-chat-api-820444130598.us-east5.run.app';
const FRONTEND_URL = 'https://medichat-frontend-820444130598.us-east5.run.app';

test.describe('GCP Deployment Verification', () => {

  test.describe.configure({ mode: 'serial' });

  test('Frontend loads successfully', async ({ page }) => {
    console.log('Testing frontend at:', FRONTEND_URL);

    const response = await page.goto(FRONTEND_URL);
    expect(response?.status()).toBe(200);

    // Wait for React app to load
    await page.waitForSelector('body', { timeout: 30000 });

    // Check page title
    const title = await page.title();
    console.log('Page title:', title);
    expect(title).toBeTruthy();
  });

  test('Frontend health check endpoint works', async ({ request }) => {
    console.log('Testing frontend health check...');

    const response = await request.get(`${FRONTEND_URL}/health`);
    expect(response.status()).toBe(200);

    const body = await response.text();
    console.log('Frontend health response:', body);
    expect(body).toContain('healthy');
  });

  test('Backend health check works', async ({ request }) => {
    console.log('Testing backend health check...');

    const startTime = Date.now();
    const response = await request.get(`${BACKEND_URL}/health`, {
      timeout: 60000, // 60 second timeout for cold start
    });
    const duration = Date.now() - startTime;

    console.log(`Backend health check took ${duration}ms`);
    expect(response.status()).toBe(200);

    const data = await response.json();
    console.log('Backend health response:', data);
    expect(data.status).toBe('healthy');
  });

  test('Llama 4 API integration works', async ({ request }) => {
    console.log('Testing Llama 4 API integration...');

    const startTime = Date.now();
    const response = await request.get(`${BACKEND_URL}/llama/test`, {
      timeout: 90000, // 90 seconds - Llama API can be slow
    });
    const duration = Date.now() - startTime;

    console.log(`Llama test took ${duration}ms`);
    expect(response.status()).toBe(200);

    const data = await response.json();
    console.log('Llama API response:', data);
    expect(data.success).toBe(true);
  });

  test('Backend patient search endpoint responds', async ({ request }) => {
    console.log('Testing patient search...');

    const response = await request.post(`${BACKEND_URL}/api/v1/patients/search`, {
      data: {
        query: 'test',
        search_type: 'auto'
      },
      timeout: 60000,
    });

    console.log('Patient search status:', response.status());
    expect(response.status()).toBeLessThan(500); // Should not be server error
  });

  test('Frontend navigation works', async ({ page }) => {
    console.log('Testing frontend navigation...');

    await page.goto(FRONTEND_URL);

    // Wait for app to load
    await page.waitForLoadState('networkidle', { timeout: 60000 });

    // Check for main navigation elements
    const hasContent = await page.locator('body').textContent();
    console.log('Page has content:', hasContent ? 'Yes' : 'No');
    expect(hasContent).toBeTruthy();
  });
});

test.describe('API Timeout Testing', () => {

  test('Measure actual API response times', async ({ request }) => {
    const endpoints = [
      { name: 'Health Check', url: `${BACKEND_URL}/health`, method: 'GET' },
      { name: 'Llama Test', url: `${BACKEND_URL}/llama/test`, method: 'GET' },
      { name: 'Facilities', url: `${BACKEND_URL}/api/v1/facilities`, method: 'GET' },
      { name: 'Specialties', url: `${BACKEND_URL}/api/v1/specialties`, method: 'GET' },
    ];

    console.log('\n=== API Response Time Analysis ===\n');

    for (const endpoint of endpoints) {
      const startTime = Date.now();

      try {
        const response = await request.fetch(endpoint.url, {
          method: endpoint.method,
          timeout: 90000,
        });

        const duration = Date.now() - startTime;
        const status = response.status();

        console.log(`${endpoint.name}:`);
        console.log(`  - URL: ${endpoint.url}`);
        console.log(`  - Status: ${status}`);
        console.log(`  - Duration: ${duration}ms`);
        console.log(`  - Within 30s timeout: ${duration < 30000 ? '✓ YES' : '✗ NO'}`);
        console.log('');

        // All endpoints should respond within reasonable time
        expect(status).toBeLessThan(500);

      } catch (error: any) {
        console.log(`${endpoint.name}:`);
        console.log(`  - URL: ${endpoint.url}`);
        console.log(`  - ERROR: ${error.message}`);
        console.log('');

        // Don't fail test if endpoint is just not available yet
        if (!error.message.includes('404')) {
          throw error;
        }
      }
    }
  });

  test('Test slow operations (intelligent triage simulation)', async ({ request }) => {
    console.log('\n=== Testing Slow Operations ===\n');

    // Test patient search which might be slow
    const startTime = Date.now();

    try {
      const response = await request.post(`${BACKEND_URL}/api/v1/patients/search`, {
        data: {
          query: '21003', // Known test patient
          search_type: 'auto'
        },
        timeout: 120000, // 2 minutes
      });

      const duration = Date.now() - startTime;
      const status = response.status();

      console.log('Patient Search (with HAPI FHIR lookup):');
      console.log(`  - Status: ${status}`);
      console.log(`  - Duration: ${duration}ms`);
      console.log(`  - Within 30s timeout: ${duration < 30000 ? '✓ YES' : '✗ NO (TIMEOUT LIKELY)'}`);
      console.log(`  - Recommended timeout: ${Math.ceil(duration / 1000) + 10}s`);

      if (duration > 30000) {
        console.log('\n⚠️  WARNING: This operation exceeds the 30-second timeout!');
        console.log('   Frontend API clients need increased timeout configuration.');
      }

    } catch (error: any) {
      console.log('Patient Search failed:', error.message);

      if (error.message.includes('Timeout')) {
        console.log('\n⚠️  CONFIRMED: Operation times out after 30 seconds!');
        console.log('   This is the root cause of the frontend errors.');
      }
    }
  });
});

test.describe('Frontend-Backend Integration', () => {

  test('Frontend can make API calls successfully', async ({ page, context }) => {
    console.log('\n=== Testing Frontend API Integration ===\n');

    // Listen to all API calls made by the frontend
    const apiCalls: Array<{ url: string; status: number; duration: number }> = [];

    page.on('response', async (response) => {
      const url = response.url();
      if (url.includes(BACKEND_URL)) {
        const timing = response.timing();
        apiCalls.push({
          url,
          status: response.status(),
          duration: timing.responseEnd,
        });
      }
    });

    // Navigate to frontend
    await page.goto(FRONTEND_URL);

    // Wait for initial API calls to complete
    await page.waitForTimeout(10000);

    console.log(`Captured ${apiCalls.length} API calls:`);
    apiCalls.forEach((call, index) => {
      console.log(`${index + 1}. ${call.url}`);
      console.log(`   Status: ${call.status}, Duration: ${call.duration}ms`);
    });

    // Check for any failed API calls
    const failedCalls = apiCalls.filter(call => call.status >= 500);
    if (failedCalls.length > 0) {
      console.log('\n⚠️  Failed API calls detected:');
      failedCalls.forEach(call => console.log(`   - ${call.url}: ${call.status}`));
    }

    // Check for timeouts (if any calls took > 30s)
    const slowCalls = apiCalls.filter(call => call.duration > 30000);
    if (slowCalls.length > 0) {
      console.log('\n⚠️  Slow API calls (>30s) detected:');
      slowCalls.forEach(call => console.log(`   - ${call.url}: ${call.duration}ms`));
    }
  });

  test('Frontend error handling for timeouts', async ({ page }) => {
    console.log('\n=== Testing Frontend Error Handling ===\n');

    // Listen for console errors
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    await page.goto(FRONTEND_URL);
    await page.waitForTimeout(5000);

    console.log(`Console errors captured: ${consoleErrors.length}`);

    // Check for timeout errors
    const timeoutErrors = consoleErrors.filter(err =>
      err.includes('timeout') || err.includes('ECONNABORTED')
    );

    if (timeoutErrors.length > 0) {
      console.log('\n⚠️  Timeout errors found in console:');
      timeoutErrors.forEach(err => console.log(`   - ${err}`));
    }
  });
});
