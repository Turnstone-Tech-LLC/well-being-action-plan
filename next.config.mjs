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
    runtimeCaching: [
      {
        // Cache page navigations (documents) with network-first strategy
        urlPattern: /^https?:\/\/[^/]+\/(?!api\/).*$/,
        handler: 'NetworkFirst',
        options: {
          cacheName: 'pages-cache',
          expiration: {
            maxEntries: 32,
            maxAgeSeconds: 24 * 60 * 60, // 24 hours
          },
          networkTimeoutSeconds: 10,
        },
      },
      {
        // Cache static assets (JS, CSS) with cache-first strategy
        urlPattern: /\.(js|css|woff2?|ttf|eot)$/i,
        handler: 'CacheFirst',
        options: {
          cacheName: 'static-assets-cache',
          expiration: {
            maxEntries: 64,
            maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
          },
        },
      },
      {
        // Cache images with cache-first strategy
        urlPattern: /\.(png|jpg|jpeg|svg|gif|webp|ico)$/i,
        handler: 'CacheFirst',
        options: {
          cacheName: 'image-cache',
          expiration: {
            maxEntries: 64,
            maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
          },
        },
      },
      {
        // Cache fonts with cache-first strategy
        urlPattern: /^https:\/\/fonts\.(?:googleapis|gstatic)\.com\/.*/i,
        handler: 'CacheFirst',
        options: {
          cacheName: 'google-fonts-cache',
          expiration: {
            maxEntries: 20,
            maxAgeSeconds: 365 * 24 * 60 * 60, // 1 year
          },
        },
      },
    ],
  },
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  staticPageGenerationTimeout: 120,
  typescript: {
    // Allow build to succeed even with type errors
    ignoreBuildErrors: false,
  },
  eslint: {
    // Allow build to succeed even with ESLint errors
    ignoreDuringBuilds: false,
  },
  // Skip static generation for error pages to work around Next.js 15 issue
  skipTrailingSlashRedirect: true,
  skipMiddlewareUrlNormalize: true,
};

export default withPWA(nextConfig);
