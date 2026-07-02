import 'reflect-metadata';
import { writeFileSync } from 'node:fs';

import { printSchema } from 'graphql';

import { initializeContainer } from '../src/server/container';
import { schema } from '../src/server/graphql/schema';

initializeContainer();
writeFileSync('schema.graphql', printSchema(schema));
console.log('Wrote schema.graphql');
