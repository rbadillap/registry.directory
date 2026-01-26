/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@workspace/ui"],
  async redirects() {
    return [
      // Redirect old URLs: /{owner}/{repo}/{category}/{item} → /{owner}/{repo}/{item}
      {
        source: "/:owner/:repo/:category/:item",
        destination: "/:owner/:repo/:item",
        permanent: true,
      },
    ]
  },
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
