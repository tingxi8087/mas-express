import 'module-alias/register';
import { test, expect, describe } from 'bun:test';

describe('debug test', () => {
  test('test', async () => {
    expect(true).toBe(true);
  });
});
