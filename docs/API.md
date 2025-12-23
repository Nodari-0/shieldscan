# ShieldScan Developer API

Programmatic access for Business and Enterprise plans. Auth uses API keys hashed in Firestore. Rate limits are enforced per key.

## Base URL

- Local: `http://localhost:3000`
- Production: `https://<your-domain>`

## Authentication

- Header: `X-API-Key: <your-api-key>`
- Keys are created in the dashboard at `/dashboard/api-keys` and shown once.

## Rate Limits (per key)

- Business: 10 req/min
- Enterprise: 100 req/min

Headers returned when limited:
```
Retry-After: <seconds>
X-RateLimit-Remaining: 0
X-RateLimit-Reset: <timestamp_ms>
```

## Endpoints

Interactive docs: `/api-docs` (Redoc viewer for OpenAPI).

### POST /api/v1/scan
Queue a new scan.

Request:
```json
{
  "url": "https://example.com",
  "tags": ["api"]
}
```

Response:
```json
{
  "scanId": "job_...",
  "status": "queued"
}
```

### GET /api/v1/scan/:id
Fetch a single scan result (owner-only).

Response:
```json
{
  "id": "...",
  "userId": "...",
  "url": "...",
  "score": 92,
  "grade": "A",
  "checksCount": 45,
  "passed": 38,
  "warnings": 5,
  "failed": 2,
  "duration": 2840,
  "tags": ["api"],
  "createdAt": "..."
}
```

### GET /api/v1/scans?limit=20&cursor=<iso_date>
Paginated list of scans (owner-only).

Response:
```json
{
  "scans": [ ... ],
  "nextCursor": "2024-01-10T12:00:00.000Z" // null if no more
}
```

## Creating API Keys

1) Go to `/dashboard/api-keys` (Business/Enterprise).  
2) Click "Generate" — copy the key immediately (only shown once).  
3) Use it in the `X-API-Key` header.

## Queue & Processing

- BullMQ + Redis if `UPSTASH_REDIS_URL` or `REDIS_URL` is set.  
- Falls back to in-memory queue in dev.  
- Concurrency: 5, retries with exponential backoff.

## Error Codes
- 401: Missing/invalid API key
- 403: Forbidden (not owner)
- 404: Not found
- 429: Rate limit exceeded
- 500: Internal error

