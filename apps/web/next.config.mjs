/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@workspace/ui"],
  outputFileTracingIncludes: {
    '/[owner]/[repo]/opengraph-image': ['./public/fonts/**/*'],
    '/[owner]/[repo]/[slug]/opengraph-image': ['./public/fonts/**/*'],
  },
  async rewrites() {
    return [
      {
        source: "/:owner/:repo/:slug.md",
        destination: "/api/markdown/:owner/:repo/:slug",
      },
      // Handle-based item URLs (/{handle}/{item}.md) — must come after the
      // 3-segment rule so github-backed paths keep matching it first
      {
        source: "/:owner/:slug.md",
        destination: "/api/markdown/:owner/:slug",
      },
    ]
  },
}

export default nextConfig
