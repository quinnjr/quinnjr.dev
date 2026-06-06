import { describe, it, expect } from 'vitest';
import 'reflect-metadata';
import { initializeContainer } from '../../../src/server/container';
import { createYogaMiddleware } from '../../../src/server/graphql/yoga';

describe('yoga middleware', () => {
  it('creates a request handler', () => {
    initializeContainer();
    const handler = createYogaMiddleware();
    expect(typeof handler).toBe('function');
  });
});
