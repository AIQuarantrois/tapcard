/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'ijapjidqajcxjqoxexgj.supabase.co' },
    ],
  },
}

export default nextConfig
