import { describe, expect, test } from 'bun:test';
import { getProviderById } from './providers.js';

describe('providers', () => {
  test('uses upstream DeepSeek v4 defaults', () => {
    expect(getProviderById('deepseek')).toMatchObject({
      fastModel: 'deepseek-v4-flash',
      contextWindow: 1_000_000,
    });
  });
});
