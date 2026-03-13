import { Client } from '@opensearch-project/opensearch';
import { env } from './env';

let client: Client | null = null;

export function getSearchClient(): Client {
  if (!client) {
    client = new Client({
      node: env.OPENSEARCH_URL || 'http://localhost:9200',
      auth: env.OPENSEARCH_USERNAME && env.OPENSEARCH_PASSWORD
        ? {
            username: env.OPENSEARCH_USERNAME,
            password: env.OPENSEARCH_PASSWORD,
          }
        : undefined,
      ssl: env.OPENSEARCH_SSL ? { rejectUnauthorized: false } : undefined,
    });
  }
  return client;
}

export async function isSearchAvailable(): Promise<boolean> {
  try {
    const searchClient = getSearchClient();
    const health = await searchClient.cluster.health();
    return health.status !== 'red';
  } catch {
    return false;
  }
}
