/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@workspace/ui"],
  // next dev and next build corrupt each other when they share .next —
  // separate dirs let a production build run while the dev server is up
  distDir: process.env.NODE_ENV === "development" ? ".next-dev" : ".next",
  outputFileTracingIncludes: {
    // data/ is read by path at request time (registry views for on-demand
    // item pages, the whole set for the /r catalog). Next's tracer cannot
    // follow a filename built at runtime, so the files are named explicitly
    // — without this the deployed functions find an empty data directory.
    '/**': ['./data/**'],
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
