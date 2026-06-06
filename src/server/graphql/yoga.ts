import { createYoga } from 'graphql-yoga';
import type { Request, Response } from 'express';
import { schema } from './schema';
import { createContext } from './context';

export function createYogaMiddleware() {
  return createYoga<{ req: Request; res: Response }>({
    schema,
    graphqlEndpoint: '/graphql',
    graphiql: process.env['NODE_ENV'] !== 'production',
    maskedErrors: process.env['NODE_ENV'] === 'production',
    // Disable schema introspection in production.
    ...(process.env['NODE_ENV'] === 'production' ? { introspection: false } : {}),
    context: ({ request }) => createContext(request.headers.get('authorization')),
  });
}
