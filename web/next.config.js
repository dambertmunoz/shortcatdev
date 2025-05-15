/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['firebase'],
  swcMinify: false,
  images: {
    domains: ['firebasestorage.googleapis.com'],
  },
  experimental: {
    serverComponentsExternalPackages: ['undici'],
  },
  webpack: (config) => {
    // Add a rule to handle the private class fields syntax
    config.module.rules.push({
      test: /\.js$/,
      include: /node_modules[\\/](undici|firebase)/,
      use: {
        loader: 'babel-loader',
        options: {
          presets: ['@babel/preset-env'],
          plugins: ['@babel/plugin-proposal-private-methods', '@babel/plugin-proposal-class-properties']
        }
      }
    });
    return config;
  }
}

module.exports = nextConfig
