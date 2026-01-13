#!/usr/bin/env node

/**
 * Test Script: Intelligent Triage Loop Fix
 *
 * This script verifies:
 * 1. Intelligent triage only triggers ONCE per message (no infinite loop)
 * 2. "Mark as completed" button works correctly
 * 3. Workflow state updates properly
 */

import { chromium } from 'playwright';

const BASE_URL = 'http://localhost:5173';

async function testTriageLoopFix() {
  console.log('\n🧪 Starting Intelligent Triage Loop Fix Test\n');

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Track console messages to detect loops
  const consoleLogs = [];
  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('[Intelligent Triage]')) {
      consoleLogs.push({
        timestamp: Date.now(),
        message: text
      });
      console.log('📋', text);
    }
  });

  try {
    // Step 1: Login as MA
    console.log('\n✅ Step 1: Login as MA');
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');

    await page.fill('input[name="employee_id"]', 'MA001');
    await page.fill('input[name="pin"]', '1234');
    await page.click('button:has-text("Start Shift")');

    await page.waitForSelector('text=MediChat MA Assistant', { timeout: 10000 });
    console.log('   ✓ Login successful');

    // Step 2: Look up patient
    console.log('\n✅ Step 2: Looking up patient Jane Doe');
    await page.fill('textarea[placeholder*="Type a message"]', 'Look up patient Jane Doe born 12/13/1966');
    await page.click('button[type="submit"]');

    // Wait for patient to load
    await page.waitForSelector('text=Jane Marie Doe', { timeout: 15000 });
    console.log('   ✓ Patient found');

    // Step 3: Trigger chest pain triage
    console.log('\n✅ Step 3: Triggering chest pain protocol');

    // Clear console logs before triggering triage
    consoleLogs.length = 0;

    const symptomMessage = 'Patient is experiencing chest pain, shortness of breath, and nausea';
    await page.fill('textarea[placeholder*="Type a message"]', symptomMessage);
    await page.click('button[type="submit"]');

    // Wait for triage to complete
    await page.waitForSelector('text=CHEST PAIN PROTOCOL', { timeout: 30000 });
    console.log('   ✓ Chest Pain Protocol activated');

    // Step 4: Wait and check for infinite loop (should NOT see repeated triggers)
    console.log('\n✅ Step 4: Checking for infinite loop (waiting 5 seconds)...');
    await page.waitForTimeout(5000);

    // Count how many times "Triggering" appears (should be 1)
    const triggerCount = consoleLogs.filter(log =>
      log.message.includes('Triggering with patient') ||
      log.message.includes('Processing new message')
    ).length;

    const duplicateCount = consoleLogs.filter(log =>
      log.message.includes('Already processed message')
    ).length;

    console.log(`\n   📊 Triage Trigger Analysis:`);
    console.log(`      - New message processed: ${triggerCount} times`);
    console.log(`      - Duplicate skipped: ${duplicateCount} times`);

    if (triggerCount === 1) {
      console.log('   ✅ PASS: Triage triggered exactly once (no loop!)');
    } else if (triggerCount > 1) {
      console.log('   ❌ FAIL: Triage triggered multiple times - INFINITE LOOP DETECTED!');
      console.log('   Last 10 console logs:');
      consoleLogs.slice(-10).forEach(log => console.log('     ', log.message));
    } else {
      console.log('   ⚠️  WARNING: Triage did not trigger');
    }

    // Step 5: Test "Mark as completed" functionality
    console.log('\n✅ Step 5: Testing "Mark as Completed" button');

    // Find the first immediate action checkbox
    const firstActionCheckbox = await page.locator('div[role="button"]:has-text("Obtain 12-lead EKG")').first();

    if (await firstActionCheckbox.isVisible()) {
      console.log('   ✓ Found action item: Obtain 12-lead EKG');

      // Click to mark as complete
      await firstActionCheckbox.click();
      await page.waitForTimeout(1000);

      // Check if it's marked as completed (look for CheckIcon or line-through)
      const isCompleted = await page.locator('text=Obtain 12-lead EKG').first().evaluate(el => {
        const style = window.getComputedStyle(el);
        return style.textDecoration.includes('line-through');
      });

      if (isCompleted) {
        console.log('   ✅ PASS: Action marked as completed successfully!');
      } else {
        console.log('   ❌ FAIL: Action NOT marked as completed');
      }
    } else {
      console.log('   ⚠️  WARNING: Could not find action item checkbox');
    }

    // Step 6: Check workflow state
    console.log('\n✅ Step 6: Verifying workflow state');

    // Check if Test Ordering Timeline is visible
    const testOrderingVisible = await page.locator('text=Required Pre-Appointment Labs').isVisible().catch(() => false);

    if (testOrderingVisible) {
      console.log('   ✓ Test Ordering Timeline is visible');
    } else {
      console.log('   ⚠️  Test Ordering Timeline not visible yet');
    }

    // Take screenshot
    await page.screenshot({
      path: '/Users/karthi/GA_ML_COURSE/CS-6440-O01/project/frontend-new/test-screenshots/triage-loop-fix-result.png',
      fullPage: true
    });
    console.log('\n📸 Screenshot saved to: frontend-new/test-screenshots/triage-loop-fix-result.png');

    // Final summary
    console.log('\n' + '='.repeat(80));
    console.log('🎯 TEST SUMMARY');
    console.log('='.repeat(80));
    console.log(`✅ Triage Loop Fix: ${triggerCount === 1 ? 'PASS' : 'FAIL'}`);
    console.log(`   - Expected: 1 trigger`);
    console.log(`   - Actual: ${triggerCount} trigger(s)`);
    console.log(`   - Duplicates skipped: ${duplicateCount}`);
    console.log('='.repeat(80));

    // Keep browser open for manual inspection
    console.log('\n⏸️  Browser will remain open for 30 seconds for manual inspection...');
    await page.waitForTimeout(30000);

  } catch (error) {
    console.error('\n❌ Test failed with error:', error.message);
    await page.screenshot({
      path: '/Users/karthi/GA_ML_COURSE/CS-6440-O01/project/frontend-new/test-screenshots/triage-loop-fix-error.png',
      fullPage: true
    });
  } finally {
    await browser.close();
    console.log('\n✅ Test complete');
  }
}

testTriageLoopFix().catch(console.error);
