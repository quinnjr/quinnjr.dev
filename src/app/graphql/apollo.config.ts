import { InjectionToken, TransferState, inject, makeStateKey } from '@angular/core';
import { type ApolloClient, InMemoryCache, type NormalizedCacheObject } from '@apollo/client/core';
import { HttpLink } from 'apollo-angular/http';

/** Absolute GraphQL endpoint for SSR; defaults to relative for the browser. */
export const GRAPHQL_URI = new InjectionToken<string>('GRAPHQL_URI', {
  factory: () => '/graphql',
});

/** Carries the server-rendered Apollo cache into the browser bootstrap. */
const APOLLO_STATE = makeStateKey<NormalizedCacheObject>('apollo.cache');

function createApolloOptions(ssrMode: boolean): ApolloClient.Options {
  const httpLink = inject(HttpLink);
  const uri = inject(GRAPHQL_URI);
  const transferState = inject(TransferState);
  const cache = new InMemoryCache();

  if (ssrMode) {
    // Serialization runs after rendering completes, so the extract reflects
    // everything the server-rendered routes fetched.
    transferState.onSerialize(APOLLO_STATE, () => cache.extract());
  } else {
    const state = transferState.get(APOLLO_STATE, null);
    if (state) {
      cache.restore(state);
      // Drop it once consumed so a client-side cache reset cannot resurrect
      // stale server state.
      transferState.remove(APOLLO_STATE);
    }
  }

  return {
    link: httpLink.create({ uri }),
    cache,
    ssrMode,
  };
}

/** Browser client: hydrates its cache from the transferred SSR state. */
export function apolloOptionsFactory(): ApolloClient.Options {
  return createApolloOptions(false);
}

/** Server client: renders in `ssrMode` and transfers its cache to the browser. */
export function serverApolloOptionsFactory(): ApolloClient.Options {
  return createApolloOptions(true);
}
