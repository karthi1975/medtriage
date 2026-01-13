import { chromium } from 'playwright';

(async () => {
  console.log('Starting Playwright test for patient display...\n');

  const browser = await chromium.launch({
    headless: false,
    slowMo: 1000 // Slow down actions to see what's happening
  });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // Step 1: Navigate to frontend
    console.log('Step 1: Navigating to frontend...');
    await page.goto('https://medichat-frontend-tg3weve6aq-ul.a.run.app');
    await page.waitForLoadState('networkidle');
    console.log('✓ Page loaded\n');

    // Step 2: Fill in MA login form
    console.log('Step 2: Logging in as MA...');
    await page.fill('input[placeholder*="Sarah Johnson"]', 'Test MA');

    // Select facility
    await page.click('div[role="button"]:has-text("Facility")');
    await page.waitForTimeout(500);
    await page.click('li[role="option"]:has-text("University Medical Center")');

    // Select specialty
    await page.click('div[role="button"]:has-text("Specialty")');
    await page.waitForTimeout(500);
    await page.click('li[role="option"]:has-text("Cardiology")');

    // Click Start Shift
    await page.click('button:has-text("Start Shift")');
    await page.waitForLoadState('networkidle');
    console.log('✓ Logged in successfully\n');

    // Step 3: Search for patient
    console.log('Step 3: Searching for patient cardiac-emergency-001...');
    const chatInput = await page.locator('textarea[placeholder*="Type patient info"]');
    await chatInput.fill('Find patient cardiac-emergency-001');
    await chatInput.press('Enter');
    console.log('✓ Message sent\n');

    // Step 4: Wait for response
    console.log('Step 4: Waiting for chat response...');
    await page.waitForTimeout(5000); // Wait for API response

    // Step 5: Check for patient panel
    console.log('Step 5: Checking patient panel...\n');

    const noPatientMessage = await page.locator('text=No Patient Selected').isVisible();
    if (noPatientMessage) {
      console.log('❌ ISSUE FOUND: "No Patient Selected" is still showing\n');
    }

    // Check if patient name appears
    const patientName = await page.locator('text=John Robert Martinez').isVisible();
    if (patientName) {
      console.log('✓ Patient name found: John Robert Martinez');
    } else {
      console.log('❌ Patient name NOT found');
    }

    // Check for conditions
    const hasConditions = await page.locator('text=Hypertension').isVisible();
    if (hasConditions) {
      console.log('✓ Conditions found');
    } else {
      console.log('❌ Conditions NOT found');
    }

    // Check for medications
    const hasMedications = await page.locator('text=Lisinopril').isVisible();
    if (hasMedications) {
      console.log('✓ Medications found');
    } else {
      console.log('❌ Medications NOT found');
    }

    // Check for allergies
    const hasAllergies = await page.locator('text=Aspirin').isVisible();
    if (hasAllergies) {
      console.log('✓ Allergies found');
    } else {
      console.log('❌ Allergies NOT found');
    }

    console.log('\n--- Checking Network Requests ---\n');

    // Intercept and log API calls
    page.on('response', async (response) => {
      const url = response.url();
      if (url.includes('/api/v1/ma/chat')) {
        console.log(`API Response: ${response.status()} - ${url}`);
        try {
          const body = await response.json();
          console.log('Response metadata:', JSON.stringify(body.metadata, null, 2));
        } catch (e) {
          console.log('Could not parse response body');
        }
      }
    });

    // Send another search to capture network traffic
    console.log('\n--- Sending second search to capture network traffic ---\n');
    await chatInput.fill('Look up patient cardiac-emergency-001');
    await chatInput.press('Enter');
    await page.waitForTimeout(5000);

    console.log('\n--- Taking screenshot ---');
    await page.screenshot({ path: 'patient-display-test.png', fullPage: true });
    console.log('✓ Screenshot saved as patient-display-test.png\n');

    // Keep browser open for inspection
    console.log('Browser will stay open for 30 seconds for manual inspection...');
    await page.waitForTimeout(30000);

  } catch (error) {
    console.error('Test failed with error:', error);
    await page.screenshot({ path: 'error-screenshot.png', fullPage: true });
  } finally {
    await browser.close();
    console.log('\nTest completed.');
  }
})();
