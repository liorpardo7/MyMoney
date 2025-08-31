/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['libsodium-wrappers', 'pdf-parse']
  }
}

module.exports = nextConfig