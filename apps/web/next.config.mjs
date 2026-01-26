/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@workspace/ui"],
  async rewrites() {
    return [
      {
        source: "/:owner/:repo/:slug.md",
        destination: "/api/markdown/:owner/:repo/:slug",
      },
    ]
  },
}

export default nextConfig
