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
    '/\\[owner\\]/\\[repo\\]/\\[...slug\\]': ['./data/**'],
    '/\\[owner\\]/\\[repo\\]/opengraph-image': ['./data/**', './public/fonts/**/*'],
    '/api/og/item/\\[owner\\]/\\[repo\\]/\\[...slug\\]': ['./data/**', './public/fonts/**/*'],
    '/api/markdown/\\[owner\\]/\\[repo\\]': ['./data/**'],
    '/api/markdown/\\[owner\\]/\\[repo\\]/\\[...slug\\]': ['./data/**'],
    '/r/\\[...path\\]': ['./data/**'],
    '/sitemap.xml': ['./data/**'],
    '/llms.txt': ['./data/**'],
  },
  async rewrites() {
    return {
      // beforeFiles because the negotiating sources ARE existing pages — a
      // plain-array rewrite only runs after the filesystem, so `/` would
      // always win with HTML.
      beforeFiles: [
        // Content negotiation (acceptmarkdown.com): a client that asks for
        // text/markdown gets the machine view of the same URL. Only the home
        // and 3+ segment item pages negotiate — 2-segment paths are ambiguous
        // (github registry pages have no markdown view and must keep serving
        // HTML), so handle-based items negotiate only via the .md suffix.
        {
          source: "/",
          has: [{ type: "header", key: "accept", value: ".*text/markdown.*" }],
          destination: "/index.md",
        },
        {
          source: "/:owner/:repo/:slug+",
          has: [{ type: "header", key: "accept", value: ".*text/markdown.*" }],
          destination: "/api/markdown/:owner/:repo/:slug+",
        },
      ],
      afterFiles: [
        // `:slug*` because an item name may contain slashes, and each one
        // arrives as its own path segment.
        {
          source: "/:owner/:repo/:slug*.md",
          destination: "/api/markdown/:owner/:repo/:slug*",
        },
        // Handle-based item URLs (/{handle}/{item}.md) — must come after the
        // 3-segment rule so github-backed paths keep matching it first
        {
          source: "/:owner/:slug.md",
          destination: "/api/markdown/:owner/:slug",
        },
      ],
    }
  },
  async headers() {
    return [
      // The negotiating routes serve different bodies for different Accept
      // values; Vary keeps intermediary caches from mixing them up.
      {
        source: "/",
        headers: [{ key: "Vary", value: "Accept" }],
      },
      {
        source: "/:owner/:repo/:slug+",
        headers: [{ key: "Vary", value: "Accept" }],
      },
    ]
  },
}

export default nextConfig
