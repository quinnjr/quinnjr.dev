import 'reflect-metadata';
import { describe, it, expect, afterEach } from 'vitest';

import { initializeContainer } from '../../../src/server/container';
import { createYogaMiddleware } from '../../../src/server/graphql/yoga';

const ORIGINAL_NODE_ENV = process.env['NODE_ENV'];

afterEach(() => {
  process.env['NODE_ENV'] = ORIGINAL_NODE_ENV;
});

function graphiqlRequest(handler: ReturnType<typeof createYogaMiddleware>) {
  return handler.fetch('http://localhost/graphql', {
    method: 'GET',
    headers: { accept: 'text/html' },
  });
}

describe('yoga middleware', () => {
  it('answers a POST /graphql request with 200 and a data payload', async () => {
    initializeContainer();
    const handler = createYogaMiddleware();

    const response = await handler.fetch('http://localhost/graphql', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ query: '{ __typename }' }),
    });

    expect(response.status).toBe(200);
    const body = (await response.json()) as { data?: unknown; errors?: unknown };
    expect(body.errors).toBeUndefined();
    expect(body.data).toEqual({ __typename: 'Query' });
  });

  it('serves GraphiQL outside production', async () => {
    process.env['NODE_ENV'] = 'development';
    initializeContainer();

    const response = await graphiqlRequest(createYogaMiddleware());

    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('text/html');
  });

  it('disables GraphiQL when NODE_ENV=production', async () => {
    process.env['NODE_ENV'] = 'production';
    initializeContainer();

    const response = await graphiqlRequest(createYogaMiddleware());

    expect(response.headers.get('content-type') ?? '').not.toContain('text/html');
    expect(await response.text()).not.toContain('<!DOCTYPE html>');
  });
});
