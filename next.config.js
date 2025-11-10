/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // Webpack configuration for Solana dependencies
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Fixes for browser compatibility with Solana libraries
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
      };
    }

    return config;
  },

  // Environment variables exposed to the browser
  env: {
    NEXT_PUBLIC_NETWORK: process.env.NEXT_PUBLIC_NETWORK,
    NEXT_PUBLIC_USDC_DEVNET: process.env.NEXT_PUBLIC_USDC_DEVNET,
    NEXT_PUBLIC_USDC_MAINNET: process.env.NEXT_PUBLIC_USDC_MAINNET,
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  },

  // Enable experimental features if needed
  experimental: {
    serverActions: true,
  },
};

module.exports = nextConfig;
