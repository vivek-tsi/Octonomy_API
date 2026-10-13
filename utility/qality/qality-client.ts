/**
 * QAlity Plus client — report pass/fail for test cases already in a test cycle.
 * Tests pass Jira keys (OI-15053); those are resolved via Jira REST to issue ids.
 */

export type QalityStatus = 'passed' | 'failed' | 'in_progress' | 'blocked' | 'unexecuted';

export type TestCaseInCycle = {
  id: number;
  testCaseId: number;
  testCycleId?: number;
  testExecution?: { id?: number; [key: string]: unknown };
  [key: string]: unknown;
};

export type TestExecution = {
  id: number;
  name?: string;
  status?: string;
  testCaseId?: number;
  testCaseInCycleId?: number;
  comment?: string;
  testSteps?: unknown[];
  [key: string]: unknown;
};

function stripQuotes(value?: string): string {
  return (value || '').replace(/^["']|["']$/g, '').trim();
}

function normalizeBaseUrl(raw: string): string {
  const url = raw.replace(/\/$/, '');
  return url.endsWith('/api') ? url : `${url}/api`;
}

export function isQalityEnabled(): boolean {
  return Boolean(
    stripQuotes(process.env.QALITY_API_TOKEN) &&
    stripQuotes(process.env.QALITY_TEST_CYCLE_ID)
  );
}

export class QalityClient {
  private readonly baseUrl: string;
  private readonly token: string;
  private readonly cycleId: number;
  private statusPassedId?: number;
  private statusFailedId?: number;
  private assignmentByTestCaseId = new Map<number, TestCaseInCycle>();
  private executionByTestCaseId = new Map<number, number>();
  private cycleLoaded = false;
  private issueIdCache = new Map<string, number>();

  constructor() {
    this.baseUrl = normalizeBaseUrl(
      stripQuotes(process.env.QALITY_BASE_URL) || 'https://apps-qalityplus.soldevelo.com/api'
    );
    this.token = stripQuotes(process.env.QALITY_API_TOKEN);
    this.cycleId = Number(stripQuotes(process.env.QALITY_TEST_CYCLE_ID));
    this.statusPassedId = Number(stripQuotes(process.env.QALITY_STATUS_PASSED_ID)) || undefined;
    this.statusFailedId = Number(stripQuotes(process.env.QALITY_STATUS_FAILED_ID)) || undefined;

    if (!this.token) throw new Error('QALITY_API_TOKEN is not configured');
    if (!this.cycleId) throw new Error('QALITY_TEST_CYCLE_ID is not configured');
  }

  private headers(): Record<string, string> {
    return {
      Authorization: `Bearer ${this.token}`,
      Accept: 'application/json',
      'Content-Type': 'application/json',
    };
  }

  private async request<T>(method: string, path: string, body?: unknown): Promise<T> {
    const response = await fetch(`${this.baseUrl}${path}`, {
      method,
      headers: this.headers(),
      body: body === undefined ? undefined : JSON.stringify(body),
    });

    const text = await response.text();
    let json: any = undefined;
    try {
      json = text ? JSON.parse(text) : undefined;
    } catch {
      json = text;
    }

    if (!response.ok) {
      throw new Error(
        `QAlity ${method} ${path} failed (${response.status}): ${typeof json === 'string' ? json : JSON.stringify(json)}`
      );
    }

    return json as T;
  }

  async getCycle(cycleId = this.cycleId): Promise<any> {
    return this.request<any>('GET', `/testCycles/${cycleId}`);
  }

  async ensureCycleLoaded(): Promise<void> {
    if (this.cycleLoaded) return;

    const cycle = await this.getCycle();
    const assignments: TestCaseInCycle[] = Array.isArray(cycle?.testCases) ? cycle.testCases : [];

    if (Array.isArray(cycle?.statuses)) {
      for (const entry of cycle.statuses) {
        const name = String(entry?.status?.name || '').toLowerCase();
        const id = Number(entry?.status?.id);
        if (!id) continue;
        if (name === 'passed' && !this.statusPassedId) this.statusPassedId = id;
        if (name === 'failed' && !this.statusFailedId) this.statusFailedId = id;
      }
    }

    this.assignmentByTestCaseId.clear();
    this.executionByTestCaseId.clear();

    for (const item of assignments) {
      const testCaseId = Number(item.testCaseId ?? (item as any).testCase?.id ?? (item as any).issueId);
      if (!testCaseId) continue;
      this.assignmentByTestCaseId.set(testCaseId, item);
      const executionId = Number(item.testExecution?.id);
      if (executionId) this.executionByTestCaseId.set(testCaseId, executionId);
    }

    this.cycleLoaded = true;
    console.log(
      `[QAlity] Loaded cycle ${this.cycleId}: ${this.assignmentByTestCaseId.size} test case(s), ` +
      `passedStatusId=${this.statusPassedId}, failedStatusId=${this.statusFailedId}`
    );
  }

  private statusId(passed: boolean): number | undefined {
    return passed ? this.statusPassedId : this.statusFailedId;
  }

  /**
   * Resolve Jira key to numeric issue id (what QAlity uses as testCaseId).
   * Accepts: 'OI-15053' | 15053 | already-resolved numeric id if in cycle.
   */
  async resolveTestCaseId(idOrKey: string | number): Promise<number> {
    const raw = String(idOrKey).trim();
    const cached = this.issueIdCache.get(raw.toUpperCase());
    if (cached) return cached;

    // Already the real Jira issue id and present in cycle
    if (/^\d+$/.test(raw) && this.assignmentByTestCaseId.has(Number(raw))) {
      return Number(raw);
    }

    const projectKey = stripQuotes(process.env.JIRA_PROJECT_KEY) || 'OI';
    const issueKey = /^[A-Z][A-Z0-9]+-\d+$/i.test(raw)
      ? raw.toUpperCase()
      : /^\d+$/.test(raw)
        ? `${projectKey}-${raw}`
        : raw;

    const jiraBase = stripQuotes(process.env.JIRA_BASE_URL) || 'https://quickstep.atlassian.net';
    const email = stripQuotes(process.env.JIRA_EMAIL);
    const jiraToken = stripQuotes(process.env.JIRA_API_TOKEN);

    if (!email || !jiraToken) {
      throw new Error(
        `Cannot resolve Jira id "${raw}" as ${issueKey}. ` +
        `Fill JIRA_EMAIL and JIRA_API_TOKEN in env/.env.test ` +
        `(https://id.atlassian.com/manage-profile/security/api-tokens).`
      );
    }

    const auth = Buffer.from(`${email}:${jiraToken}`).toString('base64');
    const response = await fetch(
      `${jiraBase.replace(/\/$/, '')}/rest/api/3/issue/${encodeURIComponent(issueKey)}?fields=id,key`,
      {
        headers: {
          Authorization: `Basic ${auth}`,
          Accept: 'application/json',
        },
      }
    );

    const body = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(`Jira lookup failed for ${issueKey} (${response.status}): ${JSON.stringify(body)}`);
    }

    const id = Number(body.id);
    if (!Number.isFinite(id) || id <= 0) {
      throw new Error(`Jira issue ${issueKey} did not return a valid numeric id`);
    }

    this.issueIdCache.set(raw.toUpperCase(), id);
    this.issueIdCache.set(issueKey, id);
    console.log(`[QAlity] Jira ${issueKey} → issue id ${id}`);
    return id;
  }

  async updateExecution(executionId: number, passed: boolean, comment?: string): Promise<TestExecution> {
    const statusId = this.statusId(passed);
    if (!statusId) {
      throw new Error('Missing QAlity status id for passed/failed (could not read from cycle)');
    }

    return this.request<TestExecution>('PATCH', `/testExecutions/${executionId}`, {
      fields: {
        statusId,
        comment: comment || '',
      },
    });
  }

  async createExecution(params: {
    name: string;
    testCaseId: number;
    testCaseInCycleId: number;
    passed: boolean;
    comment?: string;
  }): Promise<TestExecution> {
    const statusId = this.statusId(params.passed);
    const body: Record<string, unknown> = {
      name: params.name,
      testCaseId: params.testCaseId,
      testCaseInCycleId: params.testCaseInCycleId,
      testSteps: [],
      comment: params.comment || '',
    };

    if (statusId) {
      body.statusId = statusId;
    } else {
      body.status = params.passed ? 'passed' : 'failed';
    }

    try {
      return await this.request<TestExecution>('POST', '/testExecutions', body);
    } catch {
      return await this.request<TestExecution>('POST', '/testExecution', body);
    }
  }

  async reportTestResult(params: {
    testCaseId: string | number;
    testName: string;
    passed: boolean;
    comment?: string;
  }): Promise<TestExecution | null> {
    await this.ensureCycleLoaded();

    const testCaseId = await this.resolveTestCaseId(params.testCaseId);
    const assignment = this.assignmentByTestCaseId.get(testCaseId);
    if (!assignment) {
      console.log(
        `[QAlity] Jira "${params.testCaseId}" → issue id ${testCaseId} is not in cycle ${this.cycleId}. ` +
        `Add that test case to the cycle in QAlity, then re-run.`
      );
      return null;
    }

    const existingExecutionId = this.executionByTestCaseId.get(testCaseId);
    if (existingExecutionId) {
      return this.updateExecution(existingExecutionId, params.passed, params.comment);
    }

    return this.createExecution({
      name: params.testName,
      testCaseId,
      testCaseInCycleId: Number(assignment.id),
      passed: params.passed,
      comment: params.comment,
    });
  }
}
