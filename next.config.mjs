/** @type {import('next').NextConfig} */
const nextConfig = {
  // ESLint actif en build (retire ignoreDuringBuilds pour voir les vrais warnings)
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        // Hostname dynamique — ne plus hardcoder l'ID du projet Supabase
        hostname: new URL(
          process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://placeholder.supabase.co'
        ).hostname,
      },
    ],
  },
}

export default nextConfig
