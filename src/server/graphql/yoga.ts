import type { Request, Response } from 'express';
import { createYoga } from 'graphql-yoga';

import { createContext } from './context';
import { schema } from './schema';

export function createYogaMiddleware() {
  return createYoga<{ req: Request; res: Response }>({
    schema,
    graphqlEndpoint: '/graphql',
    graphiql: process.env['NODE_ENV'] !== 'production',
    maskedErrors: process.env['NODE_ENV'] === 'production',
    context: ({ request }) => createContext(request.headers.get('authorization')),
  });
}
