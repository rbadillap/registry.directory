import { ImageResponse } from "next/og"
import { type NextRequest } from "next/server"
import { readFile } from "node:fs/promises"
import { join } from "node:path"

// Simple validation for URL
function isValidUrl(url: string): boolean {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

function getHostname(url: string): string {
  try {
    return new URL(url).hostname
  } catch {
    return url
  }
}

// // Allowed domains for security (whitelist approach)
// const ALLOWED_DOMAINS = [
//   "ui.shadcn.com",
//   "github.com",
//   "vercel.com",
//   "nextjs.org",
//   "registry.directory",
//   // Add more trusted domains as needed
// ]

export async function GET(request: NextRequest) {
  try {
    // Get URL from query parameters
    const { searchParams } = new URL(request.url)
    const url = searchParams.get("url")

    // Validate URL
    if (!url || !isValidUrl(url)) {
      throw new Error("Invalid URL provided")
    }

    // Check if domain is allowed
    // const urlObj = new URL(url)
    // const domain = urlObj.hostname

    // if (!ALLOWED_DOMAINS.some((allowedDomain) => domain === allowedDomain || domain.endsWith(`.${allowedDomain}`))) {
    //   throw new Error("Domain not allowed for security reasons")
    // }

    // Fetch the HTML content
    const ogImage = await fetchOgImage(url)
    if (!ogImage) {
      throw new Error("No OG image found")
    }

    // Load fonts
    const [geistSans, geistSansMedium] = await Promise.all([
      readFile(join(process.cwd(), "assets/Geist-Regular.ttf")),
      readFile(join(process.cwd(), "assets/Geist-Medium.ttf")),
    ])

    return new ImageResponse(
      (
        <div
          tw="flex flex-col items-center justify-center w-full h-full bg-black"
          style={{
            fontFamily: "Geist",
          }}
        >
          {/* top left logo r.d */}
          <div tw="absolute top-4 left-4 text-white text-2xl font-medium">r.d</div>

          {/* Decorative borders */}
          <div tw="flex border absolute border-stone-700/50 border-dashed inset-y-0 left-16 w-[1px]" />
          <div tw="flex border absolute border-stone-700/50 border-dashed inset-y-0 right-16 w-[1px]" />
          <div tw="flex border absolute border-stone-700/50 inset-x-0 h-[1px] top-16" />
          <div tw="flex border absolute border-stone-700/50 inset-x-0 h-[1px] bottom-16" />

          {/* Main content */}
          <div tw="flex flex-col items-center justify-center w-full max-w-4xl px-8">
            {/* OG Image */}
            <img
              src={ogImage}
              tw="w-full max-h-96 object-contain rounded-lg"
            />
            
            {/* Site info */}
            <div tw="flex items-center">
              <h2 tw="text-4xl text-white font-medium">{getHostname(url)}</h2>
            </div>
          </div>

          {/* Subtle glow effect */}
          <div
            tw="absolute inset-0"
            style={{
              background: "radial-gradient(circle at center, rgba(255,255,255,0.03) 0%, transparent 70%)",
            }}
          />
        </div>
      ),
      {
        width: 1200,
        height: 630,
        fonts: [
          {
            name: "Geist",
            data: geistSans,
            style: "normal",
            weight: 400,
          },
          {
            name: "Geist",
            data: geistSansMedium,
            style: "normal",
            weight: 500,
          },
        ],
      },
    )
  } catch (error: unknown) {
    console.error(error)
    return new Response(`Failed to generate the image`, {
      status: 500,
    })    
  }
}

// Fetch and extract og:image from URL
async function fetchOgImage(url: string): Promise<string | null> {
  try {
    // Set timeout to prevent hanging requests
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5000)

    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; registry-directory/1.0; +https://registry.directory)",
      },
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      throw new Error(`Failed to fetch URL: ${response.status}`)
    }

    const html = await response.text()

    // Extract og:image using regex
    const ogImageMatch =
      html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["'][^>]*>/i) ||
      html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:image["'][^>]*>/i)

    if (ogImageMatch && ogImageMatch[1]) {
      // Validate and normalize the image URL
      try {
        // Handle relative URLs
        const imageUrl = new URL(ogImageMatch[1], url).toString()
        return imageUrl
      } catch (error) {
        console.error("Invalid og:image URL:", error)
        return null
      }
    }

    // Fallback to Twitter image if og:image is not available
    const twitterImageMatch =
      html.match(/<meta[^>]*name=["']twitter:image["'][^>]*content=["']([^"']+)["'][^>]*>/i) ||
      html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*name=["']twitter:image["'][^>]*>/i)

    if (twitterImageMatch && twitterImageMatch[1]) {
      // Validate and normalize the image URL
      try {
        const imageUrl = new URL(twitterImageMatch[1], url).toString()
        return imageUrl
      } catch (error) {
        console.error("Invalid twitter:image URL:", error)
        return null
      }
    }

    return null
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error("Request timeout")
    }
    throw error
  }
}
