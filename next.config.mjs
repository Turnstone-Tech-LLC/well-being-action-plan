import withPWAInit from '@ducanh2912/next-pwa';

const withPWA = withPWAInit({
  dest: 'public',
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: true,
  swcMinify: true,
  disable: process.env.NODE_ENV === 'development',
  workboxOptions: {
    disableDevLogs: true,
    // Runtime caching strategies
    runtimeCaching: [
      {
        // Cache API calls with network-first strategy
        urlPattern: /^https:\/\/.*\.supabase\.co\/.*$/,
        handler: 'NetworkFirst',
        options: {
          cacheName: 'api-cache',
          expiration: {
            maxEntries: 100,
            maxAgeSeconds: 24 * 60 * 60, // 24 hours
          },
          networkTimeoutSeconds: 10,
        },
      },
      {
        // Cache pages with stale-while-revalidate
        urlPattern: ({ request }) => request.mode === 'navigate',
        handler: 'NetworkFirst',
        options: {
          cacheName: 'pages-cache',
          expiration: {
            maxEntries: 50,
            maxAgeSeconds: 7 * 24 * 60 * 60, // 7 days
          },
          networkTimeoutSeconds: 10,
        },
      },
      {
        // Cache static assets (images, fonts) with cache-first
        urlPattern: ({ request }) =>
          request.destination === 'image' ||
          request.destination === 'font' ||
          request.destination === 'style',
        handler: 'CacheFirst',
        options: {
          cacheName: 'static-assets-cache',
          expiration: {
            maxEntries: 200,
            maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
          },
        },
      },
      {
        // Cache JavaScript and CSS with stale-while-revalidate
        urlPattern: ({ request }) =>
          request.destination === 'script' ||
          (request.destination === 'style' &&
            !request.url.includes('fonts')),
        handler: 'StaleWhileRevalidate',
        options: {
          cacheName: 'js-css-cache',
          expiration: {
            maxEntries: 100,
            maxAgeSeconds: 7 * 24 * 60 * 60, // 7 days
          },
        },
      },
      {
        // Cache other resources with stale-while-revalidate
        urlPattern: ({ url }) => url.origin === self.location.origin,
        handler: 'StaleWhileRevalidate',
        options: {
          cacheName: 'same-origin-cache',
          expiration: {
            maxEntries: 100,
            maxAgeSeconds: 7 * 24 * 60 * 60, // 7 days
          },
        },
      },
    ],
  },
  // Fallback pages for offline support
  fallbacks: {
    document: '/offline',
  },
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // Empty turbopack config to silence webpack config warning
  turbopack: {},
};

export default withPWA(nextConfig);
