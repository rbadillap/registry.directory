import { GET as getLlmsTxt } from "../llms.txt/route"

// The markdown view of the home page, for clients that negotiate with
// Accept: text/markdown (rewritten here by next.config.mjs). Same content as
// /llms.txt — one generator, two content types.
export const dynamic = "force-static"
export const revalidate = 86400

export async function GET() {
  const response = await getLlmsTxt()
  const body = await response.text()

  return new Response(body, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=86400",
    },
  })
}
