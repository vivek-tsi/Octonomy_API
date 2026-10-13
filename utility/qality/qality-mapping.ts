/**
 * Attach your Jira test case key on the test only:
 *
 *   test('...', qality('OI-15053'), async ({ api }) => { ... })
 *   test('...', qality(15053), async ({ api }) => { ... })  // same as OI-15053
 *
 * Requires in env/.env.test:
 *   JIRA_BASE_URL, JIRA_EMAIL, JIRA_API_TOKEN, JIRA_PROJECT_KEY (default OI)
 */

export const SANITY = '@sanity';
export const REGRESSION = '@regression';

/** Playwright test options — Jira key plus suite tags such as @sanity / @regression */
export function qality(jiraKeyOrNumber: number | string, suiteTags: string[] = []) {
  return {
    annotation: [{ type: 'qality', description: String(jiraKeyOrNumber) }],
    tag: [`@qality:${jiraKeyOrNumber}`, ...suiteTags],
  };
}

/** Read Jira key/id from test annotation or @qality: tag */
export function resolveQalityTestCaseRef(
  _title: string,
  annotations: Array<{ type: string; description?: string }> = [],
  tags: string[] = []
): string | undefined {
  const fromAnnotation = annotations.find(
    (a) => a.type === 'qality' || a.type === 'jira' || a.type === 'qalityTestCaseId'
  )?.description;

  if (fromAnnotation && fromAnnotation !== 'REPLACE_ME') {
    return String(fromAnnotation).trim();
  }

  const tag = tags.find((t) => t.startsWith('@qality:'));
  if (tag) return tag.replace(/^@qality:/, '').trim();

  return undefined;
}
