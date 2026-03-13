import { z } from 'zod';

export const documentIndexSchema = z.object({
  id: z.string(),
  title: z.string(),
  content: z.string(),
  description: z.string().optional(),
  type: z.enum(['project', 'task', 'user', 'document', 'comment']),
  status: z.enum(['active', 'archived', 'draft']).optional(),
  tags: z.array(z.string()).default([]),
  category: z.string().optional(),
  author: z.object({
    id: z.string(),
    name: z.string().optional(),
    email: z.string(),
  }),
  location: z.object({
    lat: z.number(),
    lon: z.number(),
    address: z.string().optional(),
  }).optional(),
  metadata: z.record(z.any()).optional(),
  createdAt: z.string().or(z.date()),
  updatedAt: z.string().or(z.date()),
});

export type SearchDocument = z.infer<typeof documentIndexSchema>;

export const searchIndexMapping = {
  index: 'documents',
  body: {
    settings: {
      number_of_shards: 1,
      number_of_replicas: 0,
      analysis: {
        analyzer: {
          document_analyzer: {
            type: 'standard',
            stopwords: '_portuguese_',
          },
          autocomplete_analyzer: {
            tokenizer: 'standard',
            filter: ['lowercase', 'asciifolding'],
          },
        },
      },
    },
    mappings: {
      properties: {
        id: { type: 'keyword' },
        title: {
          type: 'text',
          analyzer: 'document_analyzer',
          fields: {
            keyword: { type: 'keyword' },
            suggest: {
              type: 'search_as_you_type',
            },
          },
        },
        content: {
          type: 'text',
          analyzer: 'document_analyzer',
        },
        description: {
          type: 'text',
          analyzer: 'document_analyzer',
        },
        type: { type: 'keyword' },
        status: { type: 'keyword' },
        tags: { type: 'keyword' },
        category: { type: 'keyword' },
        author: {
          properties: {
            id: { type: 'keyword' },
            name: { type: 'keyword' },
            email: { type: 'keyword' },
          },
        },
        location: {
          properties: {
            lat: { type: 'float' },
            lon: { type: 'float' },
            address: { type: 'text' },
          },
        },
        metadata: { type: 'object', enabled: false },
        createdAt: { type: 'date' },
        updatedAt: { type: 'date' },
      },
    },
  },
};
