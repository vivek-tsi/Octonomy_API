import { test as base, expect, APIRequestContext, APIResponse } from '@playwright/test';
import ENV from '../utility/env.ts';
import * as fs from 'fs';
import * as path from 'path';
import {loginData} from '../utility/data.ts';


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

export const test = base.extend<Fixtures>({
  token:[ async ({ browser }, use) => {
    if (!ENV.BASE_URL) throw new Error('BASE_URL is not defined in ENV');

    const context = await browser.newContext();
    const page = await context.newPage();

    await page.goto(ENV.BASE_URL);

    // adjust selectors/credentials as needed
    await page.click(loginData().selectors.msLink);
    await page.fill(loginData().selectors.emailField, loginData().user.email);
    await page.click(loginData().selectors.nextBtn);
    await page.fill(loginData().selectors.passwordField, loginData().user.password);
    await page.click(loginData().selectors.signInBtn);
    await page.click(loginData().selectors.yesBtn);

    await page.waitForTimeout(8000);

    // Prefer cookies from context
    const cookies = await context.cookies();
    const accessCookie = cookies.find(c => c.name === 'access_token');
    const token = accessCookie?.value ?? '';

    // persist token to env file if needed
    if (process.env.test_env && token) {
      const envPath = path.resolve(__dirname, `../env/.env.${process.env.test_env}`);
      let envContent = fs.readFileSync(envPath, 'utf-8');
      envContent = envContent.replace(/^TOKEN:.*/m, `TOKEN: "${token}"`);
      fs.writeFileSync(envPath, envContent);
    }

    await use(token);

    await context.close();
  },
  {scope:'worker'} as any,
],

  api: async ({ request, token }, use) => {
    const buildHeaders = (extra?: Record<string,string>) => ({
      'Content-Type': 'application/json',
      Authorization: token ? `Bearer ${token}` : '',
      ...(extra || {}),
    });

    const api: ApiHelper = {
      get: (p, options) => request.get(`${ENV.BASE_URL}${p}`, { ...(options || {}), headers: buildHeaders((options as any)?.headers) }),
      post: (p, data, options) => request.post(`${ENV.BASE_URL}${p}`, { ...(options || {}), headers: buildHeaders((options as any)?.headers), data }),
      put: (p, data, options) => request.put(`${ENV.BASE_URL}${p}`, { ...(options || {}), headers: buildHeaders((options as any)?.headers), data }),
      del: (p, options) => request.delete(`${ENV.BASE_URL}${p}`, { ...(options || {}), headers: buildHeaders((options as any)?.headers) }),
    };

    await use(api);
  },
  
});

export { expect };