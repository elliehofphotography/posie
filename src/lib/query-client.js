import { QueryClient } from '@tanstack/react-query';
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister';

export const queryClientInstance = new QueryClient({
	defaultOptions: {
		queries: {
			refetchOnWindowFocus: false,
			retry: 1,
			gcTime: 1000 * 60 * 60 * 24, // 24 hours — keep cache for offline use
			staleTime: 1000 * 60 * 5, // 5 minutes
		},
	},
});

export const localPersister = createSyncStoragePersister({
	storage: typeof window !== 'undefined' ? window.localStorage : undefined,
});