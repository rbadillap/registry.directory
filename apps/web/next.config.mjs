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
    ]
  },
}

export default nextConfig
