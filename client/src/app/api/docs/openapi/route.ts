import { NextResponse } from 'next/server';

export async function GET() {
  const spec = {
    openapi: '3.0.3',
    info: {
      title: 'ShieldScan Developer API',
      version: '1.0.0',
      description: 'Programmatic access to queue and retrieve website security scans.',
    },
    servers: [{ url: '/' }],
    components: {
      securitySchemes: {
        ApiKeyAuth: {
          type: 'apiKey',
          in: 'header',
          name: 'X-API-Key',
        },
      },
      schemas: {
        ScanRequest: {
          type: 'object',
          required: ['url'],
          properties: {
            url: { type: 'string', example: 'https://example.com' },
            tags: {
              type: 'array',
              items: { type: 'string' },
              example: ['api'],
            },
          },
        },
        ScanQueued: {
          type: 'object',
          properties: {
            scanId: { type: 'string', example: 'job_123' },
            status: { type: 'string', example: 'queued' },
          },
        },
        ScanItem: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            userId: { type: 'string' },
            url: { type: 'string' },
            score: { type: 'number' },
            grade: { type: 'string' },
            checksCount: { type: 'number' },
            passed: { type: 'number' },
            warnings: { type: 'number' },
            failed: { type: 'number' },
            duration: { type: 'number' },
            tags: { type: 'array', items: { type: 'string' } },
            createdAt: { type: 'string', example: '2024-01-01T12:00:00Z' },
          },
        },
        ScanList: {
          type: 'object',
          properties: {
            scans: {
              type: 'array',
              items: { $ref: '#/components/schemas/ScanItem' },
            },
            nextCursor: { type: 'string', nullable: true },
          },
        },
        Error: {
          type: 'object',
          properties: {
            error: { type: 'string' },
            retryAfter: { type: 'number', nullable: true },
          },
        },
      },
    },
    security: [{ ApiKeyAuth: [] }],
    paths: {
      '/api/v1/scan': {
        post: {
          summary: 'Queue a new scan',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ScanRequest' },
              },
            },
          },
          responses: {
            '200': {
              description: 'Scan queued',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ScanQueued' },
                },
              },
            },
            '4XX': { description: 'Client error', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
            '5XX': { description: 'Server error', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          },
          security: [{ ApiKeyAuth: [] }],
        },
      },
      '/api/v1/scan/{id}': {
        get: {
          summary: 'Get a scan by ID',
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: { type: 'string' },
            },
          ],
          responses: {
            '200': {
              description: 'Scan found',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ScanItem' },
                },
              },
            },
            '404': { description: 'Not found' },
          },
          security: [{ ApiKeyAuth: [] }],
        },
      },
      '/api/v1/scans': {
        get: {
          summary: 'List scans',
          parameters: [
            {
              name: 'limit',
              in: 'query',
              schema: { type: 'integer', default: 20, maximum: 50 },
            },
            {
              name: 'cursor',
              in: 'query',
              schema: { type: 'string' },
              description: 'ISO timestamp cursor for pagination',
            },
          ],
          responses: {
            '200': {
              description: 'Scan list',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ScanList' },
                },
              },
            },
          },
          security: [{ ApiKeyAuth: [] }],
        },
      },
    },
  };

  return NextResponse.json(spec);
}

