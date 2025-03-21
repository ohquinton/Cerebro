/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    swcMinify: true,
    // Enable statically exporting pages as needed
    // output: 'export', // Uncomment this if you want to statically export pages
  
    // Configure redirects if needed
    async redirects() {
      return [
        {
          source: '/donate',
          destination: '/donate', // Keep this the same to make the route accessible
          permanent: true,
        },
      ];
    },
  
    // Configure environment variables to be available at build time
    env: {
      NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
    },
  };
  
  module.exports = nextConfig;