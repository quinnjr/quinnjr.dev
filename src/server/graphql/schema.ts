// src/server/graphql/schema.ts
import './types';
import './resolvers/blog.queries';
import { builder } from './builder';

export const schema = builder.toSchema();
