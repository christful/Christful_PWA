import withPWAInit from 'next-pwa';

const isDev = process.env.NODE_ENV === 'development';

const withPWA = withPWAInit({
  dest: 'public', // Output directory for service worker files
  disable: isDev, // Disable PWA in development to avoid caching issues
  register: true, // Auto-register service worker
  skipWaiting: true, // Activate new service worker immediately
  sw: 'service-worker.js', // Custom service worker filename
  buildExcludes: [/middleware-manifest.json$/], // Exclude unnecessary files
});

export default withPWA({
  // Your other Next.js config options here (e.g., images, etc.)
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '**.cloudinary.com',
        pathname: '/**',
      },
    ],
  },
});