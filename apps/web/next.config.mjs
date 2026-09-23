/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@workspace/ui"],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'ui.shadcn.com',
      },
      {
        protocol: 'https',
        hostname: 'uipub.com',
      },
      {
        protocol: 'https',
        hostname: 'magicui.design',
      }
    ]
  }
}

export default nextConfig
