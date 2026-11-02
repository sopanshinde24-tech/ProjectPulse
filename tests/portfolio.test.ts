import { runAllQAVerificationSuites } from '../src/utils/qaSuite';

console.log('===================================================================');
console.log(' PROJECTPULSE AI — AUTOMATED QA & DATA INTEGRITY TEST SUITE');
console.log('===================================================================\n');

const results = runAllQAVerificationSuites();
let failedCount = 0;

for (const check of results) {
  const badge = check.passed ? 'PASS' : 'FAIL';
  console.log(`[${badge}] ${check.suite}: ${check.title}`);
  console.log(`       Expected : ${check.expected}`);
  console.log(`       Actual   : ${check.actual}`);
  console.log(`       Evidence : ${check.evidenceNote}\n`);
  if (!check.passed) failedCount++;
}

console.log('-------------------------------------------------------------------');
console.log(`Summary: ${results.length - failedCount}/${results.length} test suites passed.`);
console.log('-------------------------------------------------------------------');

if (failedCount > 0) {
  process.exit(1);
}
