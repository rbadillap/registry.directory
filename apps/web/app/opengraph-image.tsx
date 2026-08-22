/* eslint-disable react/no-unknown-property */
import { ImageResponse } from "next/og"
import { readFile } from "node:fs/promises"
import { join } from "node:path"

export const runtime = 'nodejs'
export const alt = '"submit my registry to registry.directory" — the prompt is the interface'
export const size = {
  width: 1200,
  height: 630,
}
export const contentType = 'image/png'

// The card IS the product pitch: the one prompt an agent needs. Anyone who
// shares the link is distributing the executable instruction.
export default async function Image() {
  const [dmSansRegular, dmSansMedium, plexMono] = await Promise.all([
    readFile(join(process.cwd(), 'public/fonts/DMSans-Regular.ttf')),
    readFile(join(process.cwd(), 'public/fonts/DMSans-Medium.ttf')),
    readFile(join(process.cwd(), 'public/fonts/IBMPlexMono-Regular.ttf')),
  ])

  return new ImageResponse(
    (
      <div
        tw="flex items-center justify-center w-full h-full bg-black"
        style={{
          fontFamily: 'DM Sans',
          background: 'linear-gradient(to bottom right, #000000, #111111)',
        }}
      >
        {/* Decorative borders */}
        <div tw="flex border absolute border-stone-700/50 border-dashed inset-y-0 left-16 w-[1px]" />
        <div tw="flex border absolute border-stone-700/50 border-dashed inset-y-0 right-16 w-[1px]" />
        <div tw="flex border absolute border-stone-700/50 inset-x-0 h-[1px] top-16" />
        <div tw="flex border absolute border-stone-700/50 inset-x-0 h-[1px] bottom-16" />

        {/* Main content */}
        <div tw="flex flex-col items-center">
          <p
            tw="text-4xl text-white"
            style={{ fontFamily: 'IBM Plex Mono' }}
          >
            <span tw="text-stone-500 pr-3">&gt;</span>
            &quot;submit my registry to registry.directory&quot;
          </p>

          <p tw="text-lg text-slate-300/90 mt-8">
            Say it to your agent. That&apos;s the whole flow.
          </p>

          <p tw="flex items-center text-xl mt-10 text-white font-medium">
            registry
            <span tw="text-stone-400 font-medium">.directory</span>
            <span
              tw="text-xs text-white rounded-full border bg-rose-700 px-2 py-0.5 flex items-center ml-2"
              style={{ fontWeight: 500, fontFamily: 'DM Sans' }}
            >
              beta
            </span>
          </p>
        </div>

        {/* Subtle glow effect */}
        <div
          tw="absolute inset-0"
          style={{
            background: 'radial-gradient(circle at center, rgba(255,255,255,0.03) 0%, transparent 70%)',
          }}
        />
      </div>
    ),
    {
      ...size,
      fonts: [
        {
          name: "DM Sans",
          data: dmSansRegular,
          style: "normal",
          weight: 400,
        },
        {
          name: "DM Sans",
          data: dmSansMedium,
          style: "normal",
          weight: 500,
        },
        {
          name: "IBM Plex Mono",
          data: plexMono,
          style: "normal",
          weight: 400,
        },
      ],
    }
  )
}
