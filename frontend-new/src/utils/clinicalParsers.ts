/**
 * Clinical text parsers + lookup helpers shared between panels.
 *
 * These were inlined in DetailsPanel; lifted out so the new EPIC-styled
 * Triage/Orders panels can reuse the same logic without copy-paste.
 */

export interface TestRequirement {
  name: string;
  description: string;
  urgent: boolean;
}

/**
 * Parse the backend's `formatted_message` test list — one test per line in
 * the form `- Test Name: description (URGENT|RECOMMENDED)` — into structured
 * data. Tolerates extra blank lines and free-text headers.
 */
export function parseTestRequirements(message: string): TestRequirement[] {
  const tests: TestRequirement[] = [];
  if (!message) return tests;
  const lines = message.split('\n');
  for (const line of lines) {
    if (line.trim().startsWith('- ')) {
      const match = line.match(/- ([^:]+): (.+?) \((URGENT|RECOMMENDED)\)/);
      if (match) {
        tests.push({
          name: match[1].trim(),
          description: match[2].trim(),
          urgent: match[3] === 'URGENT',
        });
      }
    }
  }
  return tests;
}

/**
 * Color per order type — used for the 4px left border, urgent chip, and
 * checkbox tint so the MA can scan a stack of orders by category.
 */
export function getOrderColor(orderName: string): string {
  const name = orderName.toLowerCase();
  if (name.includes('ecg') || name.includes('ekg')) return '#e74c3c'; // red
  if (name.includes('troponin')) return '#9b59b6'; // purple
  if (name.includes('bnp') || name.includes('natriuretic')) return '#3498db'; // blue
  if (name.includes('x-ray') || name.includes('xray')) return '#f39c12'; // orange
  if (name.includes('chest')) return '#16a085'; // teal
  if (name.includes('lipid') || name.includes('cholesterol')) return '#27ae60'; // green
  if (name.includes('glucose') || name.includes('a1c')) return '#e67e22'; // dk orange
  if (name.includes('vitals') || name.includes('blood pressure')) return '#34495e'; // dk grey
  return '#95a5a6'; // default
}
