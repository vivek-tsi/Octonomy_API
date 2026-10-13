import { test as base, expect, APIRequestContext, APIResponse } from '@playwright/test';
import ENV from '../utility/env.ts';

type ApiHelper = {
  get(path: string, options?: Parameters<APIRequestContext['get']>[1]): Promise<APIResponse>;
  post(path: string, data?: any, options?: Omit<Parameters<APIRequestContext['post']>[1], 'data'>): Promise<APIResponse>;
  put(path: string, data?: any, options?: Omit<Parameters<APIRequestContext['put']>[1], 'data'>): Promise<APIResponse>;
  del(path: string, options?: Parameters<APIRequestContext['delete']>[1]): Promise<APIResponse>;
};

type Fixtures = {
  token: string;
  api: ApiHelper;
};

function stripQuotes(value: string): string {
  return value.replace(/^["']|["']$/g, '').trim();
}

/** Service account token for the active environment (env/.env.test | .env.stg | .env.prod). */
function serviceAccountToken(): string {
  return stripQuotes(process.env.SERVICE_ACCOUNT_TOKEN || process.env.TOKEN || '');
}

export const test = base.extend<Fixtures>({
  token: [async ({}, use) => {
    const envName = process.env.test_env || 'test';
    const token = serviceAccountToken();

    if (!token) {
      throw new Error(
        `SERVICE_ACCOUNT_TOKEN is empty for "${envName}". Set it in env/.env.${envName}`
      );
    }

    console.log(`Using service account token from env/.env.${envName}`);
    await use(token);
  }, { scope: 'worker' } as any],

  api: async ({ request, token }, use) => {
    const buildHeaders = (extra?: Record<string, string>) => ({
      'Content-Type': 'application/json',
      'x-api-key': token,
      ...(extra || {}),
    });

    const api: ApiHelper = {
      get: (p, options) =>
        request.get(`${ENV.BASE_URL}${p}`, {
          ...(options || {}),
          headers: buildHeaders((options as any)?.headers),
        }),
      post: (p, data, options) =>
        request.post(`${ENV.BASE_URL}${p}`, {
          ...(options || {}),
          headers: buildHeaders((options as any)?.headers),
          data,
        }),
      put: (p, data, options) =>
        request.put(`${ENV.BASE_URL}${p}`, {
          ...(options || {}),
          headers: buildHeaders((options as any)?.headers),
          data,
        }),
      del: (p, options) =>
        request.delete(`${ENV.BASE_URL}${p}`, {
          ...(options || {}),
          headers: buildHeaders((options as any)?.headers),
        }),
    };

    await use(api);
  },
});

export { expect };
