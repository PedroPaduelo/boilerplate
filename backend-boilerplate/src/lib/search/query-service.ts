import { getSearchClient } from './index';
import { z } from 'zod';

const INDEX_NAME = 'documents';

export const searchQuerySchema = z.object({
  query: z.string().optional(),
  type: z.enum(['project', 'task', 'user', 'document', 'comment']).optional(),
  status: z.enum(['active', 'archived', 'draft']).optional(),
  tags: z.array(z.string()).optional(),
  category: z.string().optional(),
  authorId: z.string().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  fuzzy: z.coerce.boolean().default(true),
  fuzziness: z.coerce.number().min(0).max(2).default(1),
  page: z.coerce.number().min(1).default(1),
  size: z.coerce.number().min(1).max(100).default(20),
  sort: z.enum(['relevance', 'date_desc', 'date_asc']).default('relevance'),
});

export const geoSearchSchema = z.object({
  query: z.string().optional(),
  lat: z.coerce.number().min(-90).max(90),
  lon: z.coerce.number().min(-180).max(180),
  radius: z.coerce.number().default(50),
  unit: z.enum(['km', 'miles']).default('km'),
  page: z.coerce.number().min(1).default(1),
  size: z.coerce.number().min(1).max(100).default(20),
});

export const autocompleteSchema = z.object({
  prefix: z.string().min(1),
  field: z.enum(['title', 'content', 'tags']).default('title'),
  size: z.coerce.number().min(1).max(20).default(10),
});

export type SearchQuery = z.infer<typeof searchQuerySchema>;
export type GeoSearchQuery = z.infer<typeof geoSearchSchema>;
export type AutocompleteQuery = z.infer<typeof autocompleteSchema>;

export interface SearchHit {
  id: string;
  title: string;
  content: string;
  description?: string;
  type: string;
  status?: string;
  tags: string[];
  category?: string;
  author: { id: string; name?: string; email: string };
  location?: { lat: number; lon: number; address?: string };
  score: number;
  createdAt: string;
  updatedAt: string;
}

export interface SearchResult {
  hits: SearchHit[];
  total: number;
  page: number;
  size: number;
  took: number;
}

export interface AggregationResult {
  types: { key: string; count: number }[];
  statuses: { key: string; count: number }[];
  tags: { key: string; count: number }[];
  categories: { key: string; count: number }[];
  authors: { key: string; count: number }[];
  dateHistogram: { date: string; count: number }[];
}

export interface GeoSearchResult {
  hits: SearchHit[];
  total: number;
  took: number;
}

export interface AutocompleteResult {
  suggestions: { text: string; score: number }[];
}

export class SearchQueryService {
  async search(params: SearchQuery): Promise<SearchResult> {
    const client = getSearchClient();
    const { query, type, status, tags, category, authorId, dateFrom, dateTo, fuzzy, fuzziness, page, size, sort } = params;

    const must: any[] = [];
    const filter: any[] = [];

    if (query) {
      if (fuzzy) {
        must.push({
          multi_match: {
            query,
            fields: ['title^3', 'content', 'description^2', 'tags^2'],
            fuzziness: fuzziness,
            prefix_length: 1,
            operator: 'or',
          },
        });
      } else {
        must.push({
          multi_match: {
            query,
            fields: ['title^3', 'content', 'description^2', 'tags^2'],
            operator: 'or',
          },
        });
      }
    }

    if (type) {
      filter.push({ term: { type } });
    }

    if (status) {
      filter.push({ term: { status } });
    }

    if (tags && tags.length > 0) {
      filter.push({ terms: { tags } });
    }

    if (category) {
      filter.push({ term: { category } });
    }

    if (authorId) {
      filter.push({ term: { 'author.id': authorId } });
    }

    if (dateFrom || dateTo) {
      const range: any = {};
      if (dateFrom) range.gte = dateFrom;
      if (dateTo) range.lte = dateTo;
      filter.push({ range: { createdAt: range } });
    }

    const sortOptions: any[] = [];
    if (sort === 'date_desc') {
      sortOptions.push({ createdAt: { order: 'desc' } });
    } else if (sort === 'date_asc') {
      sortOptions.push({ createdAt: { order: 'asc' } });
    } else if (sort === 'relevance' && query) {
      sortOptions.push({ _score: { order: 'desc' } });
      sortOptions.push({ createdAt: { order: 'desc' } });
    } else {
      sortOptions.push({ createdAt: { order: 'desc' } });
    }

    const from = (page - 1) * size;

    const response = await client.search({
      index: INDEX_NAME,
      body: {
        query: {
          bool: {
            must: must.length > 0 ? must : [{ match_all: {} }],
            filter,
          },
        },
        sort: sortOptions,
        from,
        size,
        highlight: {
          fields: {
            title: {},
            content: { fragment_size: 150, number_of_fragments: 3 },
            description: {},
          },
          pre_tags: ['<mark>'],
          post_tags: ['</mark>'],
        },
      },
    });

    const hits = response.hits.hits.map((hit: any) => ({
      id: hit._id,
      ...hit._source,
      score: hit._score,
      highlighted: hit.highlight,
    })) as SearchHit[];

    const total = typeof response.hits.total === 'number'
      ? response.hits.total
      : response.hits.total?.value || 0;

    return {
      hits,
      total,
      page,
      size,
      took: response.took,
    };
  }

  async aggregate(): Promise<AggregationResult> {
    const client = getSearchClient();

    const response = await client.search({
      index: INDEX_NAME,
      body: {
        size: 0,
        aggs: {
          types: {
            terms: { field: 'type', size: 20 },
          },
          statuses: {
            terms: { field: 'status', size: 20 },
          },
          tags: {
            terms: { field: 'tags', size: 50 },
          },
          categories: {
            terms: { field: 'category', size: 30 },
          },
          authors: {
            terms: { field: 'author.id', size: 20 },
          },
          dateHistogram: {
            date_histogram: {
              field: 'createdAt',
              calendar_interval: 'day',
            },
          },
        },
      },
    });

    const aggs = response.aggregations as any;

    return {
      types: aggs.types.buckets.map((b: any) => ({ key: b.key, count: b.doc_count })),
      statuses: aggs.statuses.buckets.map((b: any) => ({ key: b.key, count: b.doc_count })),
      tags: aggs.tags.buckets.map((b: any) => ({ key: b.key, count: b.doc_count })),
      categories: aggs.categories.buckets.map((b: any) => ({ key: b.key, count: b.doc_count })),
      authors: aggs.authors.buckets.map((b: any) => ({ key: b.key, count: b.doc_count })),
      dateHistogram: aggs.dateHistogram.buckets.map((b: any) => ({ date: b.key_as_string, count: b.doc_count })),
    };
  }

  async geoSearch(params: GeoSearchQuery): Promise<GeoSearchResult> {
    const client = getSearchClient();
    const { query, lat, lon, radius, unit, page, size } = params;

    const unitKm = unit === 'miles' ? 'mi' : 'km';

    const must: any[] = [
      {
        geo_distance: {
          distance: `${radius}${unitKm}`,
          location: {
            lat,
            lon,
          },
        },
      },
    ];

    if (query) {
      must.push({
        multi_match: {
          query,
          fields: ['title^3', 'content', 'description^2'],
        },
      });
    }

    const from = (page - 1) * size;

    const response = await client.search({
      index: INDEX_NAME,
      body: {
        query: {
          bool: {
            must,
          },
        },
        sort: [
          {
            _geo_distance: {
              location: { lat, lon },
              order: 'asc',
              unit: unitKm,
            },
          },
        ],
        from,
        size,
      },
    });

    const hits = response.hits.hits.map((hit: any) => ({
      id: hit._id,
      ...hit._source,
      score: hit._score,
      sortValues: hit.sort,
    })) as SearchHit[];

    const total = typeof response.hits.total === 'number'
      ? response.hits.total
      : response.hits.total?.value || 0;

    return {
      hits,
      total,
      took: response.took,
    };
  }

  async autocomplete(params: AutocompleteQuery): Promise<AutocompleteResult> {
    const client = getSearchClient();
    const { prefix, field, size } = params;

    const fieldPath = field === 'tags' ? 'tags' : field;

    const response = await client.search({
      index: INDEX_NAME,
      body: {
        size: size,
        query: {
          bool: {
            should: [
              {
                match_phrase_prefix: {
                  [fieldPath]: {
                    query: prefix,
                    boost: 3,
                  },
                },
              },
              {
                match: {
                  [fieldPath]: {
                    query: prefix,
                    fuzziness: 'AUTO',
                    boost: 1,
                  },
                },
              },
            ],
          },
        },
        _source: [fieldPath],
      },
    });

    const suggestionsMap = new Map<string, number>();

    response.hits.hits.forEach((hit: any) => {
      const value = hit._source[fieldPath];
      if (typeof value === 'string') {
        const current = suggestionsMap.get(value) || 0;
        suggestionsMap.set(value, Math.max(current, hit._score || 1));
      } else if (Array.isArray(value)) {
        value.forEach((v) => {
          if (v.toLowerCase().includes(prefix.toLowerCase())) {
            const current = suggestionsMap.get(v) || 0;
            suggestionsMap.set(v, Math.max(current, hit._score || 1));
          }
        });
      }
    });

    const suggestions = Array.from(suggestionsMap.entries())
      .map(([text, score]) => ({ text, score }))
      .sort((a, b) => b.score - a.score)
      .slice(0, size);

    return { suggestions };
  }
}

export const searchQueryService = new SearchQueryService();
