import { chromium } from 'playwright';

async function testSchedulingFlow() {
  console.log('🧪 Testing MediChat Scheduling Flow...\n');

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // Step 1: Navigate to app
    console.log('1️⃣ Loading application...');
    await page.goto('http://localhost:5173');
    await page.waitForTimeout(2000);
    console.log('   ✅ Page loaded\n');

    // Step 2: Fill in MA context selection
    console.log('2️⃣ Starting MA shift...');

    // Check if we're on login page or already logged in
    const loginVisible = await page.locator('text=Start Your Shift').isVisible().catch(() => false);

    if (loginVisible) {
      await page.fill('input[name="maName"]', 'Test MA');
      await page.waitForTimeout(500);

      // Select facility
      await page.click('div[role="combobox"]:has-text("Facility")');
      await page.waitForTimeout(500);
      await page.click('li:has-text("Salt Lake Heart Center")');
      await page.waitForTimeout(500);

      // Select specialty
      await page.click('div[role="combobox"]:has-text("Specialty")');
      await page.waitForTimeout(500);
      await page.click('li:has-text("Cardiology")');
      await page.waitForTimeout(500);

      // Start shift
      await page.click('button:has-text("Start Shift")');
      await page.waitForTimeout(2000);
      console.log('   ✅ Shift started\n');
    } else {
      console.log('   ℹ️  Already logged in\n');
    }

    // Step 3: Load patient
    console.log('3️⃣ Loading patient 232...');
    const chatInput = page.locator('textarea, input[type="text"]').last();
    await chatInput.fill('I have patient ID 232');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(5000); // Wait for response

    // Check for patient loaded
    const patientSummary = await page.locator('text=Jane').isVisible({ timeout: 5000 }).catch(() => false);
    if (patientSummary) {
      console.log('   ✅ Patient loaded successfully\n');
    } else {
      console.log('   ❌ Patient NOT loaded\n');

      // Check what response we got
      const lastMessage = await page.locator('[role="article"], .MuiCard-root').last().textContent();
      console.log('   Last message:', lastMessage.substring(0, 200));
    }

    // Step 4: Describe symptoms (trigger triage)
    console.log('4️⃣ Describing symptoms...');
    await page.waitForTimeout(1000);
    await chatInput.fill('Patient has chest pain radiating to left arm, 7/10 severity, started 2 hours ago');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(8000); // Wait for triage + testing check

    // Check for triage result
    const triageVisible = await page.locator('text=EMERGENCY, text=URGENT').isVisible({ timeout: 5000 }).catch(() => false);
    if (triageVisible) {
      console.log('   ✅ Triage completed\n');
    } else {
      console.log('   ⚠️  Triage status unclear\n');
    }

    // Step 5: Request appointments
    console.log('5️⃣ Requesting appointments...');
    await page.waitForTimeout(1000);
    await chatInput.fill('Find available appointments');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(8000); // Wait for scheduling

    // Check for appointment slots
    const slotsVisible = await page.locator('text=Available Appointment Slots, text=Dr. Rodriguez, text=Dr. Kim').isVisible({ timeout: 5000 }).catch(() => false);

    if (slotsVisible) {
      console.log('   ✅ Appointment slots displayed!\n');

      // Take screenshot of slots
      await page.screenshot({ path: 'appointment-slots.png', fullPage: true });
      console.log('   📸 Screenshot saved: appointment-slots.png\n');

      // Step 6: Book appointment
      console.log('6️⃣ Booking appointment...');
      await page.waitForTimeout(1000);

      // Try clicking the first "Book" button
      const bookButton = page.locator('button:has-text("Book")').first();
      const bookButtonVisible = await bookButton.isVisible().catch(() => false);

      if (bookButtonVisible) {
        await bookButton.click();
        await page.waitForTimeout(5000);

        // Check for confirmation
        const confirmationVisible = await page.locator('text=Confirmation Number, text=Appointment Successfully Booked').isVisible({ timeout: 5000 }).catch(() => false);

        if (confirmationVisible) {
          console.log('   ✅ Appointment BOOKED successfully!\n');
          await page.screenshot({ path: 'appointment-confirmation.png', fullPage: true });
          console.log('   📸 Screenshot saved: appointment-confirmation.png\n');
        } else {
          console.log('   ❌ Booking confirmation NOT shown\n');
        }
      } else {
        console.log('   ⚠️  Book button not found, trying text command...\n');
        await chatInput.fill('Book the first slot');
        await page.keyboard.press('Enter');
        await page.waitForTimeout(5000);
      }
    } else {
      console.log('   ❌ Appointment slots NOT displayed\n');

      // Check what we got instead
      const lastMessage = await page.locator('[role="article"], .MuiCard-root').last().textContent();
      console.log('   Last message:', lastMessage.substring(0, 300));

      // Take screenshot of error state
      await page.screenshot({ path: 'scheduling-error.png', fullPage: true });
      console.log('   📸 Screenshot saved: scheduling-error.png\n');
    }

    // Final screenshot
    await page.screenshot({ path: 'final-state.png', fullPage: true });
    console.log('📸 Final screenshot: final-state.png\n');

    console.log('✅ Test completed! Check screenshots for results.\n');

    // Keep browser open for inspection
    console.log('Browser will stay open for 30 seconds for inspection...');
    await page.waitForTimeout(30000);

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    await page.screenshot({ path: 'test-error.png', fullPage: true });
  } finally {
    await browser.close();
  }
}

testSchedulingFlow();
