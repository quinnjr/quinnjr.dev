import { createYoga } from 'graphql-yoga';
import type { Request, Response } from 'express';
import { schema } from './schema';
import { createAnonymousContext } from './context';

export function createYogaMiddleware() {
  return createYoga<{ req: Request; res: Response }>({
    schema,
    graphqlEndpoint: '/graphql',
    graphiql: process.env['NODE_ENV'] !== 'production',
    maskedErrors: process.env['NODE_ENV'] === 'production',
    context: () => createAnonymousContext(),
  });
}
