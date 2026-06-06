import { InjectionToken, inject } from '@angular/core';
import { HttpLink } from 'apollo-angular/http';
import { ApolloClient, InMemoryCache } from '@apollo/client/core';

/** Absolute GraphQL endpoint for SSR; defaults to relative for the browser. */
export const GRAPHQL_URI = new InjectionToken<string>('GRAPHQL_URI', {
  factory: () => '/graphql',
});

export function apolloOptionsFactory(): ApolloClient.Options {
  const httpLink = inject(HttpLink);
  const uri = inject(GRAPHQL_URI);
  return {
    link: httpLink.create({ uri }),
    cache: new InMemoryCache(),
  };
}
