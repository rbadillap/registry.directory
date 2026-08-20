/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@workspace/ui"],
  // next dev and next build corrupt each other when they share .next —
  // separate dirs let a production build run while the dev server is up
  distDir: process.env.NODE_ENV === "development" ? ".next-dev" : ".next",
  outputFileTracingIncludes: {
    // data/ is read by a path built at request time, which the tracer cannot
    // follow, so the files are named explicitly — without this the deployed
    // functions find an empty data directory. Scoped to the routes that
    // actually read it: everything else ships without the 16 MB.
    // The brackets are escaped because these keys are globs, not literals:
    // Next matches them with picomatch, where an unescaped `[owner]` is a
    // character class and `/robots.txt` matches it on the `r`.
    '/\\[owner\\]': ['./data/**'],
    '/\\[owner\\]/\\[repo\\]': ['./data/**'],
    '/\\[owner\\]/\\[repo\\]/\\[slug\\]': ['./data/**'],
    '/\\[owner\\]/\\[repo\\]/opengraph-image': ['./data/**', './public/fonts/**/*'],
    '/\\[owner\\]/\\[repo\\]/\\[slug\\]/opengraph-image': ['./data/**', './public/fonts/**/*'],
    '/api/markdown/\\[owner\\]/\\[repo\\]': ['./data/**'],
    '/api/markdown/\\[owner\\]/\\[repo\\]/\\[slug\\]': ['./data/**'],
    '/r/\\[...path\\]': ['./data/**'],
    '/sitemap.xml': ['./data/**'],
    '/llms.txt': ['./data/**'],
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
