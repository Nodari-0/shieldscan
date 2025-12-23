export type ParsedAPIEndpoint = {
  url: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  body?: string;
  authType?: 'none' | 'bearer' | 'api-key' | 'basic';
  authValue?: string;
};

/**
 * Parse an already-parsed OpenAPI object.
 */
export function parseOpenAPISpec(spec: any, baseUrl?: string): ParsedAPIEndpoint[] {
  if (!spec || typeof spec !== 'object') return [];

  const servers: string[] = [];
  if (Array.isArray(spec.servers)) {
    spec.servers.forEach((s: any) => {
      if (s?.url) servers.push(String(s.url));
    });
  }
  const serverUrl = baseUrl || servers[0] || '';

  const endpoints: ParsedAPIEndpoint[] = [];
  const paths = spec.paths || {};

  const METHODS = ['get', 'post', 'put', 'delete', 'patch'] as const;

  Object.entries(paths).forEach(([path, pathItem]) => {
    const item = pathItem as any;
    METHODS.forEach((m) => {
      if (item && item[m]) {
        const fullUrl = serverUrl ? joinUrl(serverUrl, path) : path;
        const consumesJson = Array.isArray(item.consumes)
          ? item.consumes.includes('application/json')
          : true;

        endpoints.push({
          url: fullUrl,
          method: m.toUpperCase() as ParsedAPIEndpoint['method'],
          headers: consumesJson ? { 'Content-Type': 'application/json' } : undefined,
        });
      }
    });
  });

  return endpoints;
}

/**
 * Parse OpenAPI JSON or YAML content string.
 * Tries JSON first, then YAML (if the yaml package is available).
 */
export async function parseOpenAPISpecFromString(input: string): Promise<ParsedAPIEndpoint[]> {
  let parsed: any;

  // Try JSON first
  try {
    parsed = JSON.parse(input);
    return parseOpenAPISpec(parsed);
  } catch {
    // continue to YAML
  }

  // Try YAML if dependency is present
  try {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const yaml = await import('yaml');
    parsed = yaml.parse(input);
    return parseOpenAPISpec(parsed);
  } catch (err) {
    console.error('Failed to parse OpenAPI spec as YAML', err);
    return [];
  }
}

function joinUrl(base: string, path: string): string {
  if (!base) return path;
  if (base.endsWith('/') && path.startsWith('/')) return base + path.slice(1);
  if (!base.endsWith('/') && !path.startsWith('/')) return `${base}/${path}`;
  return base + path;
}

