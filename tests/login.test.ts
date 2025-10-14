
import { test, expect } from '@playwright/test';
import ENV from '../utility/env.ts';
import { newToolCreateData } from '../utility/data.ts';




test.describe('Users API', () => {
  

    test('should get list of users', async ({ request }) => {

    const response = await request.get(ENV.BASE_URL + '/api/appconnect/users?role=SUPER_ADMIN&role=END_USER&role=SUPERVISOR&role=ANONYMOUS&page=1&limit=10');
    expect(response.status()).toBe(200);
    const data = await response.json();
    console.log(data);
  });

test('Create new tool', async ({ request }) => {

    const newTool= newToolCreateData();

    const response = await request.post(ENV.BASE_URL + '/api/appconnect/tools', { data: newTool });
    expect(response.status()).toBe(201);
    const data = await response.json();
    expect(data.name).toBe(newTool.name);
    console.log(data);
  });



















});