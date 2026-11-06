import { expect, type APIRequestContext } from '@playwright/test';

/** Wait for the API as well as the frontend webServer readiness gate. */
export async function waitForApi(request: APIRequestContext): Promise<void> {
  const apiUrl = process.env.E2E_API_URL ?? 'http://127.0.0.1:3001/api';
  await expect.poll(async () => {
    try { return (await request.get(`${apiUrl}/health`)).status(); }
    catch { return 0; }
  }, { timeout: 15000 }).toBe(200);
}
