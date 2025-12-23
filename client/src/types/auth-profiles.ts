// ==========================================
// AUTH PROFILE TYPES
// ==========================================
// One-Click Auth Scanning - Supports multiple auth methods

export type AuthType = 'jwt' | 'oauth2' | 'cookie' | 'api-key' | 'basic' | 'bearer' | 'custom';

export interface BaseAuthProfile {
  id: string;
  name: string;
  type: AuthType;
  createdAt: string;
  updatedAt: string;
  lastUsed?: string;
  isDefault?: boolean;
}

// JWT Authentication
export interface JWTAuthProfile extends BaseAuthProfile {
  type: 'jwt';
  config: {
    token: string;
    headerName: string; // Default: 'Authorization'
    prefix: string; // Default: 'Bearer'
    refreshToken?: string;
    refreshUrl?: string;
    expiresAt?: string;
  };
}

// OAuth2 Authentication
export interface OAuth2AuthProfile extends BaseAuthProfile {
  type: 'oauth2';
  config: {
    accessToken: string;
    refreshToken?: string;
    tokenUrl?: string;
    clientId?: string;
    clientSecret?: string; // Encrypted
    scope?: string;
    expiresAt?: string;
    grantType: 'client_credentials' | 'authorization_code' | 'password' | 'refresh_token';
  };
}

// Cookie Authentication
export interface CookieAuthProfile extends BaseAuthProfile {
  type: 'cookie';
  config: {
    cookies: Array<{
      name: string;
      value: string;
      domain?: string;
      path?: string;
      secure?: boolean;
      httpOnly?: boolean;
      expires?: string;
    }>;
    loginUrl?: string;
    loginMethod?: 'POST' | 'GET';
    loginBody?: Record<string, string>;
  };
}

// API Key Authentication
export interface APIKeyAuthProfile extends BaseAuthProfile {
  type: 'api-key';
  config: {
    key: string;
    headerName: string; // e.g., 'X-API-Key', 'Authorization'
    prefix?: string; // e.g., 'Api-Key', 'Bearer'
    location: 'header' | 'query' | 'body';
    paramName?: string; // For query/body location
  };
}

// Basic Authentication
export interface BasicAuthProfile extends BaseAuthProfile {
  type: 'basic';
  config: {
    username: string;
    password: string; // Encrypted
  };
}

// Bearer Token (Simple)
export interface BearerAuthProfile extends BaseAuthProfile {
  type: 'bearer';
  config: {
    token: string;
  };
}

// Custom Headers
export interface CustomAuthProfile extends BaseAuthProfile {
  type: 'custom';
  config: {
    headers: Record<string, string>;
  };
}

// Union type for all auth profiles
export type AuthProfile = 
  | JWTAuthProfile 
  | OAuth2AuthProfile 
  | CookieAuthProfile 
  | APIKeyAuthProfile 
  | BasicAuthProfile
  | BearerAuthProfile
  | CustomAuthProfile;

// Auth profile for scan requests
export interface ScanAuthConfig {
  profileId?: string;
  profile?: AuthProfile;
  headers?: Record<string, string>;
  cookies?: string;
}

// Helper to generate auth headers from profile
export function generateAuthHeaders(profile: AuthProfile): Record<string, string> {
  const headers: Record<string, string> = {};

  switch (profile.type) {
    case 'jwt':
      const jwtConfig = profile.config;
      const jwtValue = jwtConfig.prefix 
        ? `${jwtConfig.prefix} ${jwtConfig.token}`
        : jwtConfig.token;
      headers[jwtConfig.headerName || 'Authorization'] = jwtValue;
      break;

    case 'oauth2':
      headers['Authorization'] = `Bearer ${profile.config.accessToken}`;
      break;

    case 'api-key':
      const apiConfig = profile.config;
      if (apiConfig.location === 'header') {
        const apiValue = apiConfig.prefix 
          ? `${apiConfig.prefix} ${apiConfig.key}`
          : apiConfig.key;
        headers[apiConfig.headerName] = apiValue;
      }
      break;

    case 'basic':
      const basicConfig = profile.config;
      const encoded = Buffer.from(`${basicConfig.username}:${basicConfig.password}`).toString('base64');
      headers['Authorization'] = `Basic ${encoded}`;
      break;

    case 'bearer':
      headers['Authorization'] = `Bearer ${profile.config.token}`;
      break;

    case 'custom':
      Object.assign(headers, profile.config.headers);
      break;
  }

  return headers;
}

// Helper to generate cookie string from profile
export function generateCookieString(profile: CookieAuthProfile): string {
  return profile.config.cookies
    .map(c => `${c.name}=${c.value}`)
    .join('; ');
}

// Check if token is expired
export function isTokenExpired(profile: AuthProfile): boolean {
  let expiresAt: string | undefined;

  if (profile.type === 'jwt') {
    expiresAt = profile.config.expiresAt;
  } else if (profile.type === 'oauth2') {
    expiresAt = profile.config.expiresAt;
  }

  if (!expiresAt) return false;

  return new Date(expiresAt) < new Date();
}

// Decode JWT to check expiration (without validation)
export function decodeJWTExpiry(token: string): Date | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    
    const payload = JSON.parse(atob(parts[1]));
    if (payload.exp) {
      return new Date(payload.exp * 1000);
    }
    return null;
  } catch {
    return null;
  }
}

// Check if JWT is expired or expiring soon (within 5 minutes)
export function isJWTExpiringSoon(token: string, bufferMinutes: number = 5): boolean {
  const expiry = decodeJWTExpiry(token);
  if (!expiry) return false;
  
  const bufferMs = bufferMinutes * 60 * 1000;
  return expiry.getTime() - Date.now() < bufferMs;
}

// Refresh OAuth2 token
export async function refreshOAuth2Token(
  profile: OAuth2AuthProfile
): Promise<{ accessToken: string; expiresAt?: string } | null> {
  if (!profile.config.refreshToken || !profile.config.tokenUrl) {
    return null;
  }

  try {
    const response = await fetch(profile.config.tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: profile.config.refreshToken,
        ...(profile.config.clientId && { client_id: profile.config.clientId }),
        ...(profile.config.clientSecret && { client_secret: profile.config.clientSecret }),
      }),
    });

    if (!response.ok) {
      console.error('Token refresh failed:', response.status);
      return null;
    }

    const data = await response.json();
    
    return {
      accessToken: data.access_token,
      expiresAt: data.expires_in 
        ? new Date(Date.now() + data.expires_in * 1000).toISOString()
        : undefined,
    };
  } catch (error) {
    console.error('Token refresh error:', error);
    return null;
  }
}

// Refresh JWT token (if refresh URL is configured)
export async function refreshJWTToken(
  profile: JWTAuthProfile
): Promise<{ token: string; expiresAt?: string } | null> {
  if (!profile.config.refreshToken || !profile.config.refreshUrl) {
    return null;
  }

  try {
    const response = await fetch(profile.config.refreshUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        refreshToken: profile.config.refreshToken,
      }),
    });

    if (!response.ok) {
      console.error('JWT refresh failed:', response.status);
      return null;
    }

    const data = await response.json();
    
    // Try to decode new token for expiry
    const newExpiry = decodeJWTExpiry(data.token || data.accessToken);
    
    return {
      token: data.token || data.accessToken,
      expiresAt: newExpiry?.toISOString(),
    };
  } catch (error) {
    console.error('JWT refresh error:', error);
    return null;
  }
}

// Get display info for auth type
export function getAuthTypeInfo(type: AuthType): { label: string; icon: string; description: string } {
  const info: Record<AuthType, { label: string; icon: string; description: string }> = {
    'jwt': {
      label: 'JWT Token',
      icon: '🔐',
      description: 'JSON Web Token authentication',
    },
    'oauth2': {
      label: 'OAuth 2.0',
      icon: '🔑',
      description: 'OAuth 2.0 access token',
    },
    'cookie': {
      label: 'Session Cookie',
      icon: '🍪',
      description: 'Cookie-based session authentication',
    },
    'api-key': {
      label: 'API Key',
      icon: '🗝️',
      description: 'API key in header or query',
    },
    'basic': {
      label: 'Basic Auth',
      icon: '👤',
      description: 'Username and password',
    },
    'bearer': {
      label: 'Bearer Token',
      icon: '🎫',
      description: 'Simple bearer token',
    },
    'custom': {
      label: 'Custom Headers',
      icon: '⚙️',
      description: 'Custom authentication headers',
    },
  };

  return info[type];
}

