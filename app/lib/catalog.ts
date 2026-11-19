import { unstable_cache } from 'next/cache';
import { fetchLiveCatalog } from './store';

export const getCatalog = unstable_cache(
  async () => {
    return fetchLiveCatalog();
  },
  ['catalog-cache-key'], 
  { tags: ['catalog'] }
);