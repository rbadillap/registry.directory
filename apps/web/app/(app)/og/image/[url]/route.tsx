import { readFile } from "node:fs/promises"
import { join } from "node:path"
import { ImageResponse } from "next/og"
import { ImageResponseOptions, type NextRequest } from "next/server"
import { getHostname, isValidUrl } from "@/lib/utils"
import type { DirectoryEntry } from "@/lib/types"
import urlMetadata from "url-metadata"
import { OGImage } from "@/components/og-image"
import sharp from "sharp"

// Force static generation
export const dynamic = 'force-static'

// registry.directory uses a custom user agent to fetch metadata
const USER_AGENT = 'Mozilla/5.0 (compatible; registry-directory/1.0; +https://registry.directory)'

// Unsupported image formats
const UNSUPPORTED_IMAGE_FORMATS = ['webp']

// Configuration constants
const METADATA_TIMEOUT = 10000
const MAX_REDIRECTS = 5
const DESCRIPTION_LENGTH = 200
const IMAGE_TIMEOUT = 10000
const OG_IMAGE_WIDTH = 1200
const OG_IMAGE_HEIGHT = 630
const CACHE_MAX_AGE = 3600
const CACHE_STALE_WHILE_REVALIDATE = 86400

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


// Fetch and extract metadata from URL using url-metadata
async function fetchRegistryMetadata(url: string): Promise<{
  image: string | null;
  title: string | null;
  description: string | null;
  favicon: string | null;
  siteName: string | null;
}> {
  try {
    const metadata = await urlMetadata(url, {
      timeout: METADATA_TIMEOUT,
      maxRedirects: MAX_REDIRECTS,
      descriptionLength: DESCRIPTION_LENGTH,
      ensureSecureImageRequest: true,
      requestHeaders: {
        'User-Agent': USER_AGENT
      }
    });

    return {
      image: metadata['og:image'] || metadata['twitter:image'] || null,
      title: metadata['og:title'] || metadata.title || null,
      description: metadata['og:description'] || metadata.description || null,
      favicon: metadata.favicons?.[0]?.href || null,
      siteName: metadata['og:site_name'] || null
    };
  } catch (error) {
    console.error('Error fetching metadata for URL:', url, error);
    return {
      image: null,
      title: null,
      description: null,
      favicon: null,
      siteName: null
    };
  }
}

async function convertUnsupportedImageToPng(imageUrl: string): Promise<string | null> {
  try {
    // Since we already filtered by extension, we can directly fetch and convert
    // But let's still verify the content-type to be safe
    const imageResponse = await fetch(imageUrl, {
      headers: { 'User-Agent': USER_AGENT },
      signal: AbortSignal.timeout(IMAGE_TIMEOUT)
    });

    if (!imageResponse.ok) {
      console.error(`Failed to fetch image: ${imageResponse.status}`);
      return null;
    }

    const contentType = imageResponse.headers.get('content-type');
    
    // Double-check: if content-type doesn't indicate unsupported format, return original URL
    if (!contentType || !UNSUPPORTED_IMAGE_FORMATS.some(format => contentType.includes(format))) {
      return imageUrl;
    }

    const imageBuffer = await imageResponse.arrayBuffer();
    
    // Convert to PNG using Sharp
    const convertedBuffer = await sharp(Buffer.from(imageBuffer))
      .png()
      .toBuffer();
    
    // Return as data URL
    return `data:image/png;base64,${convertedBuffer.toString('base64')}`;
  } catch (error) {
    console.error('Error converting unsupported image:', error);
    return null;
  }
}

// Validate if URL belongs to a known registry
async function isKnownRegistry(url: string): Promise<boolean> {
  const registries = await getRegistries();
  return registries.some((registry: DirectoryEntry) => {
    try {
      const registryUrl = new URL(registry.url);
      const inputUrl = new URL(url);
      return registryUrl.hostname === inputUrl.hostname;
    } catch {
      return false;
    }
  });
}

// Process image: convert unsupported formats if needed
async function processImage(imageUrl: string | null): Promise<string | null> {
  if (!imageUrl) return null;
  
  const fileExtension = imageUrl.split('.').pop() || '';
  if (UNSUPPORTED_IMAGE_FORMATS.includes(fileExtension)) {
    return await convertUnsupportedImageToPng(imageUrl);
  }
  
  return imageUrl;
}

// Load fonts for ImageResponse
async function loadFonts() {
  return Promise.all([
    readFile(join(process.cwd(), "assets/Geist-Regular.ttf")),
    readFile(join(process.cwd(), "assets/Geist-Medium.ttf")),
  ]);
}

// Create ImageResponse options
function createImageResponseOptions(fonts: [Buffer, Buffer]): ImageResponseOptions {
  const [geistSans, geistSansMedium] = fonts;
  
  return {
    width: OG_IMAGE_WIDTH,
    height: OG_IMAGE_HEIGHT,
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
    headers: {
      'Cache-Control': `public, max-age=${CACHE_MAX_AGE}, stale-while-revalidate=${CACHE_STALE_WHILE_REVALIDATE}`,
    },
  };
}

// Generate static params for all registries
export async function generateStaticParams() {
  const registries = await getRegistries();
  
  return registries.map((registry: DirectoryEntry) => ({
    url: encodeURIComponent(registry.url)
  }));
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ url: string }> }
) {
  try {
    // Decode and validate URL
    const resolvedParams = await params;
    const url = decodeURIComponent(resolvedParams.url);

    if (!url || !isValidUrl(url)) {
      return new Response(`Invalid URL provided`, { status: 400 });
    }

    if (!(await isKnownRegistry(url))) {
      return new Response('Registry not found', { status: 404 });
    }

    // Fetch metadata and process image
    const metadata = await fetchRegistryMetadata(url);
    const processedImage = await processImage(metadata.image);

    // Load fonts and create response
    const fonts = await loadFonts();
    const options = createImageResponseOptions(fonts);

    return new ImageResponse(
      <OGImage 
        img={processedImage} 
        hostname={getHostname(url)} 
      />,
      options,
    );
  } catch (error: unknown) {
    console.error(error);
    return new Response(`Failed to generate the image`, { status: 500 });
  }
}

