import { afterEach, describe, expect, test } from 'bun:test';
import { getConfiguredEnvValue, hasConfiguredEnvValue, isConfiguredEnvValue } from './env.js';

const TEST_ENV_KEY = 'DEXTER_TEST_API_KEY';

afterEach(() => {
  delete process.env[TEST_ENV_KEY];
});

describe('configured env helpers', () => {
  test('treat placeholder values as unset', () => {
    process.env[TEST_ENV_KEY] = 'your-openai-api-key';

    expect(isConfiguredEnvValue(process.env[TEST_ENV_KEY])).toBe(false);
    expect(getConfiguredEnvValue(TEST_ENV_KEY)).toBeUndefined();
    expect(hasConfiguredEnvValue(TEST_ENV_KEY)).toBe(false);
  });

  test('returns real values after trimming', () => {
    process.env[TEST_ENV_KEY] = '  sk-real-key  ';

    expect(isConfiguredEnvValue(process.env[TEST_ENV_KEY])).toBe(true);
    expect(getConfiguredEnvValue(TEST_ENV_KEY)).toBe('sk-real-key');
    expect(hasConfiguredEnvValue(TEST_ENV_KEY)).toBe(true);
  });
});