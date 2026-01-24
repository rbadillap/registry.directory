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
  async headers() {
    return [
      {
        // Required for WebContainers (SharedArrayBuffer)
        source: "/:path*",
        headers: [
          {
            key: "Cross-Origin-Embedder-Policy",
            value: "require-corp",
          },
          {
            key: "Cross-Origin-Opener-Policy",
            value: "same-origin",
          },
        ],
      },
    ]
  },
}

export default nextConfig
