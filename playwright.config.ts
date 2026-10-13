import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';

// Load env in every Playwright process (config + workers). globalSetup alone does not share process.env with workers.
if (process.env.test_env) {
  dotenv.config({
    path: `./env/.env.${process.env.test_env}`,
    override: false,
  });
}

export default defineConfig({
  testDir: './tests',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  // One worker so the suite shares one service-account token
  workers: 1,
  reporter: [
    ['html'],
    ['allure-playwright'],
    ['./reporters/qality-reporter.ts'],
  ],
  globalSetup:'utility/globalsetup.ts',
  timeout:30000,
  
/* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    
    //baseURL: 'https://localhost:3000',
    
  //  extraHTTPHeaders: {
  //     'Content-Type': 'application/json',
  //     'Authorization': `Bearer ${process.env.TOKEN}`,
  //   },
   

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chrome',
      use: { ...devices['Desktop Chrome'] ,
        headless:false
      },
    },

    // {
    //   name: 'firefox',
    //   use: { ...devices['Desktop Firefox'],
    //     headless:false,

    //    },
    // },

    // {
    //   name: 'webkit',
    //   use: { ...devices['Desktop Safari'] },
    // },

    /* Test against mobile viewports. */
    // {
    //   name: 'Mobile Chrome',
    //   use: { ...devices['Pixel 5'] },
    // },
    // {
    //   name: 'Mobile Safari',
    //   use: { ...devices['iPhone 12'] },
    // },

    /* Test against branded browsers. */
    // {
    //   name: 'Microsoft Edge',
    //   use: { ...devices['Desktop Edge'], channel: 'msedge' },
    // },
    // {
    //   name: 'Google Chrome',
    //   use: { ...devices['Desktop Chrome'], channel: 'chrome' },
    // },
  ],

  /* Run your local dev server before starting the tests */
  // webServer: {
  //   command: 'npm run start',
  //   url: 'http://localhost:3000',
  //   reuseExistingServer: !process.env.CI,
  // },
});
