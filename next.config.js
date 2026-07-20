/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ['@libsql/client', '@prisma/adapter-libsql'],
}
module.exports = nextConfig
