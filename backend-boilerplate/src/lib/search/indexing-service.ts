import { getSearchClient } from './index';
import { searchIndexMapping, type SearchDocument } from './config';

const INDEX_NAME = 'documents';

export class SearchIndexingService {
  async ensureIndex(): Promise<void> {
    const client = getSearchClient();
    const indexExists = await client.indices.exists({ index: INDEX_NAME });

    if (!indexExists) {
      await client.indices.create(searchIndexMapping as any);
      console.log(`✅ Index '${INDEX_NAME}' created`);
    }
  }

  async indexDocument(document: SearchDocument): Promise<void> {
    const client = getSearchClient();
    await client.index({
      index: INDEX_NAME,
      id: document.id,
      document: {
        ...document,
        createdAt: new Date(document.createdAt).toISOString(),
        updatedAt: new Date(document.updatedAt).toISOString(),
      },
      refresh: true,
    });
  }

  async bulkIndex(documents: SearchDocument[]): Promise<void> {
    if (documents.length === 0) return;

    const client = getSearchClient();
    const operations = documents.flatMap((doc) => [
      { index: { _index: INDEX_NAME, _id: doc.id } },
      {
        ...doc,
        createdAt: new Date(doc.createdAt).toISOString(),
        updatedAt: new Date(doc.updatedAt).toISOString(),
      },
    ]);

    const bulkResponse = await client.bulk({
      operations,
      refresh: true,
    });

    if (bulkResponse.errors) {
      const erroredDocuments: string[] = [];
      bulkResponse.items.forEach((action, i) => {
        if (action.index?.error) {
          erroredDocuments.push(`Position ${i}: ${action.index.error.reason}`);
        }
      });
      console.error('Bulk indexing errors:', erroredDocuments);
      throw new Error(`Bulk indexing failed for ${erroredDocuments.length} documents`);
    }
  }

  async updateDocument(id: string, partial: Partial<SearchDocument>): Promise<void> {
    const client = getSearchClient();
    await client.update({
      index: INDEX_NAME,
      id,
      doc: {
        ...partial,
        updatedAt: new Date().toISOString(),
      },
      refresh: true,
    });
  }

  async deleteDocument(id: string): Promise<void> {
    const client = getSearchClient();
    await client.delete({
      index: INDEX_NAME,
      id,
      refresh: true,
    });
  }

  async bulkDelete(ids: string[]): Promise<void> {
    if (ids.length === 0) return;

    const client = getSearchClient();
    const operations = ids.map((id) => ({ delete: { _index: INDEX_NAME, _id: id } }));

    await client.bulk({
      operations,
      refresh: true,
    });
  }

  async reindex(): Promise<void> {
    const client = getSearchClient();

    const indexExists = await client.indices.exists({ index: INDEX_NAME });
    if (indexExists) {
      await client.indices.delete({ index: INDEX_NAME });
    }

    await client.indices.create(searchIndexMapping as any);
    console.log(`✅ Index '${INDEX_NAME}' recreated`);
  }
}

export const searchIndexingService = new SearchIndexingService();
