import { describe, expect, test } from 'bun:test';
import { formatTokensCompact, formatTurnDuration } from './format.js';

describe('formatTurnDuration', () => {
  test('formats short durations in seconds', () => {
    expect(formatTurnDuration(22_000)).toBe('22s');
  });

  test('formats longer durations in minutes and seconds', () => {
    expect(formatTurnDuration(246_000)).toBe('4m 6s');
  });
});

describe('formatTokensCompact', () => {
  test('formats large token counts with compact lowercase suffixes', () => {
    expect(formatTokensCompact(880)).toBe('880');
    expect(formatTokensCompact(3_200)).toBe('3.2k');
    expect(formatTokensCompact(1_500_000)).toBe('1.5m');
  });
});
