import { describe, expect, test } from 'bun:test';
import { formatScreenCompaniesCriteriaError } from './screen-companies.js';

describe('formatScreenCompaniesCriteriaError', () => {
  test('explains structured-output incompatibility for provider errors', () => {
    const result = formatScreenCompaniesCriteriaError(
      new Error('[OpenRouter API] 400 Provider returned error'),
      'openrouter:tencent/hy3-preview:free',
    );

    expect(result.error).toBe('Current model could not build screening criteria');
    expect(result.details).toContain('structured-output step');
    expect(result.details).toContain('EDINET DB screener request was not sent');
    expect(result.suggestion).toContain('reliable structured output support');
  });

  test('preserves auth guidance for real API key failures', () => {
    const result = formatScreenCompaniesCriteriaError(
      new Error('[OpenAI API] Incorrect API key provided'),
      'gpt-5.4',
    );

    expect(result.error).toBe('Failed to parse screening criteria');
    expect(result.details).toContain('API key is invalid or expired');
  });
});