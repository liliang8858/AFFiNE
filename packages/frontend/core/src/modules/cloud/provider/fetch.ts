import { createIdentifier } from '@toeverything/infra';

import type { FetchInit } from '../services/fetch';

export interface FetchProvider {
  /**
   * standard fetch, in ios&android, we can use native fetch to implement this
   */
  fetch: (input: string | URL, init?: FetchInit) => Promise<Response>;
}

export const FetchProvider = createIdentifier<FetchProvider>('FetchProvider');

export const DefaultFetchProvider = {
  fetch: globalThis.fetch.bind(globalThis),
};
