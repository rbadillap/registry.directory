/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@workspace/ui"],
  async rewrites() {
    return [
      {
        source: "/:owner/:repo/:category/:item.md",
        destination: "/api/markdown/:owner/:repo/:category/:item",
      },
    ]
  },
}

export default nextConfig
