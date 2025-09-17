import { ImageResponse } from "next/og"
import { type NextRequest } from "next/server"
import { readFile } from "node:fs/promises"
import { join } from "node:path"
import { getHostname, isValidUrl } from "@/lib/utils"

// Force static generation
export const dynamic = 'force-static'

// Load registries data for validation
async function getRegistries() {
  try {
    const filePath = join(process.cwd(), "public/registries.json");
    const fileContents = await readFile(filePath, "utf8");
    return JSON.parse(fileContents);
  } catch (error) {
    console.error("Error reading registries.json:", error);
    return [];
  }
}

// Generate static params for all registries
export async function generateStaticParams() {
  const registries = await getRegistries();
  
  return registries.map((registry: any) => ({
    url: encodeURIComponent(registry.url)
  }));
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ url: string }> }
) {
  try {
    // Decode the URL parameter
    const resolvedParams = await params;
    const url = decodeURIComponent(resolvedParams.url);

    // Validate URL
    if (!url || !isValidUrl(url)) {
      throw new Error("Invalid URL provided")
    }

    // Validate that URL belongs to a known registry
    const registries = await getRegistries();
    const isValidRegistry = registries.some((registry: any) => {
      try {
        const registryUrl = new URL(registry.url);
        const inputUrl = new URL(url);
        return registryUrl.hostname === inputUrl.hostname;
      } catch {
        return false;
      }
    });

    if (!isValidRegistry) {
      throw new Error("URL does not belong to a known registry")
    }

    // Fetch the HTML content
    const ogImage = await fetchOgImage(url)
    
    // Use fallback if no OG image found
    const imageToUse = ogImage || null

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
            {/* OG Image or Fallback */}
            {imageToUse ? (
              <img
                src={imageToUse}
                tw="w-full max-h-96 rounded-lg"
              />
            ) : (
              <div tw="flex flex-col items-center justify-center w-full max-h-96 bg-stone-900 rounded-lg border border-stone-700/50 p-8">
                {/* Registry.directory logo */}
                <div tw="flex items-center mb-4">
                  <div tw="w-12 h-12 bg-rose-700 rounded-lg flex items-center justify-center mr-3">
                    <span tw="text-white text-xl font-bold">r</span>
                  </div>
                  <div tw="text-white text-2xl font-medium">registry.directory</div>
                </div>
                
                {/* Fallback message */}
                <div tw="text-neutral-300 text-lg mb-2">Preview not available</div>
                <div tw="text-neutral-400 text-sm">Click to visit the registry</div>
              </div>
            )}
            
            {/* Site info */}
            <div tw="flex items-center mt-6">
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
      console.error(`Failed to fetch URL: ${response.status}: ${response.statusText}`)
      return null // Return null instead of throwing
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
      console.error("Request timeout for URL:", url)
      return null
    }
    console.error("Error fetching OG image for URL:", url, error)
    return null // Return null instead of throwing
  }
}
