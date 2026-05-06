import { customFetch, getHeaders, handleResponse } from './apiClient';

export type DemoSeedResponse = {
  success: boolean;
  message: string;
  before: Record<string, number>;
  created: Record<string, number>;
  after: Record<string, number>;
};

export const demoService = {
  seed: (): Promise<DemoSeedResponse> =>
    customFetch('/demo/seed', {
      method: 'POST',
      headers: getHeaders(),
    }).then(handleResponse),

  testEmail: (to: string): Promise<{ success: boolean; message: string }> =>
    customFetch('/demo/test-email', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ to }),
    }).then(handleResponse),
};

