import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        // Read-only, agent-facing endpoints (/api/markdown, /llms.txt) stay
        // open. Only write/internal endpoints are disallowed.
        disallow: ['/api/feedback', '/api/rebuild', '/_next/'],
      },
    ],
    sitemap: 'https://registry.directory/sitemap.xml',
  }
}
