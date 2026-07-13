const path = require('node:path')

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  experimental: {
    outputFileTracingRoot: path.join(__dirname, '../../'),
  },
  transpilePackages: ['@clube/ui', '@clube/shared-types'],
}

module.exports = nextConfig
