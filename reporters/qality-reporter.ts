import type {
  FullConfig,
  FullResult,
  Reporter,
  TestCase,
  TestResult,
} from '@playwright/test/reporter';
import dotenv from 'dotenv';
import { QalityClient, isQalityEnabled } from '../utility/qality/qality-client.ts';
import { resolveQalityTestCaseRef } from '../utility/qality/qality-mapping.ts';

function loadEnvForReporter(): void {
  const envName = process.env.test_env || 'test';
  dotenv.config({
    path: `./env/.env.${envName}`,
    override: false,
  });
}

/**
 * Updates QAlity Plus / Jira test case execution status after each Playwright test.
 */
class QalityReporter implements Reporter {
  private client: QalityClient | null = null;
  private enabled = false;

  onBegin(_config: FullConfig, _suite: unknown): void {
    loadEnvForReporter();

    this.enabled = isQalityEnabled();
    if (!this.enabled) {
      console.log(
        `[QAlity] Skipped — QALITY_API_TOKEN or QALITY_TEST_CYCLE_ID missing ` +
        `(test_env=${process.env.test_env || 'unset'}, ` +
        `token=${process.env.QALITY_API_TOKEN ? 'set' : 'empty'}, ` +
        `cycle=${process.env.QALITY_TEST_CYCLE_ID || 'empty'})`
      );
      return;
    }

    try {
      this.client = new QalityClient();
      console.log(
        `[QAlity] Enabled — reporting results to test cycle ${process.env.QALITY_TEST_CYCLE_ID}`
      );
    } catch (error) {
      this.enabled = false;
      console.warn('[QAlity] Failed to initialize client:', error);
    }
  }

  async onTestEnd(test: TestCase, result: TestResult): Promise<void> {
    if (!this.enabled || !this.client) return;
    if (result.retry !== test.retries) return;

    const testCaseRef = resolveQalityTestCaseRef(
      test.title,
      test.annotations.map((a) => ({ type: a.type, description: a.description })),
      test.tags || []
    );

    if (!testCaseRef) {
      console.log(`[QAlity] No mapping for "${test.title}" — skip`);
      return;
    }

    const passed = result.status === 'passed';
    const comment = passed
      ? `Automated run passed (${result.duration}ms)`
      : `Automated run ${result.status}: ${result.error?.message || 'see Playwright report'}`.slice(0, 1000);

    try {
      const execution = await this.client.reportTestResult({
        testCaseId: testCaseRef,
        testName: test.title,
        passed,
        comment,
      });
      if (!execution) return;
      console.log(
        `[QAlity] ${passed ? 'PASSED' : 'FAILED'} → ${testCaseRef} (executionId=${execution.id}) for "${test.title}"`
      );
    } catch (error) {
      console.warn(`[QAlity] Failed to update ${testCaseRef} for "${test.title}":`, error);
    }
  }

  async onEnd(_result: FullResult): Promise<void> {
    if (this.enabled) {
      console.log('[QAlity] Finished reporting execution results');
    }
  }
}

export default QalityReporter;
