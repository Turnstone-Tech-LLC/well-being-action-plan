/**
 * API Security Middleware
 *
 * Provides CSRF protection, rate limiting, and request validation
 * for API endpoints
 */

import { NextRequest, NextResponse } from 'next/server';

// Rate limiting configuration
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 10; // Max requests per window

// In-memory rate limit store (consider Redis for production)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

/**
 * Get client identifier for rate limiting
 */
function getClientId(request: NextRequest): string {
  // Try to get IP from various headers
  const forwardedFor = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  const ip = forwardedFor?.split(',')[0] || realIp || 'unknown';

  // Combine with user agent for better fingerprinting
  const userAgent = request.headers.get('user-agent') || 'unknown';

  return `${ip}:${userAgent}`;
}

/**
 * Check rate limit for a client
 */
export function checkRateLimit(request: NextRequest): {
  allowed: boolean;
  remaining: number;
  resetTime: number;
} {
  const clientId = getClientId(request);
  const now = Date.now();

  // Clean up expired entries
  for (const [key, value] of rateLimitStore.entries()) {
    if (value.resetTime < now) {
      rateLimitStore.delete(key);
    }
  }

  // Get or create rate limit entry
  let entry = rateLimitStore.get(clientId);

  if (!entry || entry.resetTime < now) {
    entry = {
      count: 0,
      resetTime: now + RATE_LIMIT_WINDOW,
    };
    rateLimitStore.set(clientId, entry);
  }

  // Increment count
  entry.count++;

  const allowed = entry.count <= RATE_LIMIT_MAX_REQUESTS;
  const remaining = Math.max(0, RATE_LIMIT_MAX_REQUESTS - entry.count);

  return {
    allowed,
    remaining,
    resetTime: entry.resetTime,
  };
}

/**
 * Validate origin for CSRF protection
 */
export function validateOrigin(request: NextRequest): boolean {
  const origin = request.headers.get('origin');
  const referer = request.headers.get('referer');

  // In production, check against allowed origins
  const allowedOrigins = [
    process.env.NEXT_PUBLIC_APP_URL,
    'http://localhost:3000',
    'https://localhost:3000',
  ].filter(Boolean);

  // Check origin header
  if (origin && allowedOrigins.some((allowed) => allowed && origin.startsWith(allowed))) {
    return true;
  }

  // Fallback to referer check
  if (referer && allowedOrigins.some((allowed) => allowed && referer.startsWith(allowed))) {
    return true;
  }

  // Allow same-origin requests (no origin/referer headers)
  if (!origin && !referer) {
    return true;
  }

  return false;
}

/**
 * Generate CSRF token
 */
export async function generateCSRFToken(): Promise<string> {
  const randomBytes = crypto.getRandomValues(new Uint8Array(32));
  const token = btoa(String.fromCharCode.apply(null, Array.from(randomBytes)));
  return token.replace(/[+/=]/g, ''); // Make URL-safe
}

/**
 * Validate CSRF token
 */
export function validateCSRFToken(token: string | null, sessionToken: string | null): boolean {
  if (!token || !sessionToken) return false;

  // In a real implementation, you'd validate against a stored token
  // For now, we'll do basic validation
  return token.length >= 32 && token === sessionToken;
}

/**
 * Apply security middleware to API route
 */
export async function withApiSecurity(
  request: NextRequest,
  handler: (request: NextRequest) => Promise<NextResponse>
): Promise<NextResponse> {
  // 1. Check rate limiting
  const { allowed, remaining, resetTime } = checkRateLimit(request);

  if (!allowed) {
    return NextResponse.json(
      {
        error: 'Too many requests',
        message: 'Please try again later',
      },
      {
        status: 429,
        headers: {
          'X-RateLimit-Limit': RATE_LIMIT_MAX_REQUESTS.toString(),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': resetTime.toString(),
          'Retry-After': Math.ceil((resetTime - Date.now()) / 1000).toString(),
        },
      }
    );
  }

  // 2. Validate origin for CSRF protection
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    const isValidOrigin = validateOrigin(request);

    if (!isValidOrigin) {
      return NextResponse.json(
        {
          error: 'Invalid origin',
          message: 'Cross-origin requests are not allowed',
        },
        {
          status: 403,
        }
      );
    }
  }

  // 3. Add security headers to response
  try {
    const response = await handler(request);

    // Add rate limit headers
    response.headers.set('X-RateLimit-Limit', RATE_LIMIT_MAX_REQUESTS.toString());
    response.headers.set('X-RateLimit-Remaining', remaining.toString());
    response.headers.set('X-RateLimit-Reset', resetTime.toString());

    // Add security headers
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('X-XSS-Protection', '1; mode=block');
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

    return response;
  } catch (error) {
    console.error('API handler error:', error);

    return NextResponse.json(
      {
        error: 'Internal server error',
        message: 'An unexpected error occurred',
      },
      {
        status: 500,
      }
    );
  }
}

/**
 * Validate request body against expected schema
 */
export function validateRequestBody<T extends Record<string, unknown>>(
  body: unknown,
  requiredFields: (keyof T)[]
): { valid: boolean; errors?: string[] } {
  if (!body || typeof body !== 'object') {
    return {
      valid: false,
      errors: ['Invalid request body'],
    };
  }

  const errors: string[] = [];
  const bodyObj = body as Record<string, unknown>;

  for (const field of requiredFields) {
    if (!(field in bodyObj) || bodyObj[field as string] === undefined) {
      errors.push(`Missing required field: ${String(field)}`);
    }
  }

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  return { valid: true };
}

/**
 * Sanitize user input to prevent XSS
 */
export function sanitizeInput(input: string): string {
  // Basic HTML entity encoding
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
    .replace(/\//g, '&#x2F;');
}
