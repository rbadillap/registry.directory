import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

export async function GET() {
    const [geistSans, geistSansMedium] = await Promise.all([
        readFile(join(process.cwd(), 'assets/Geist-Regular.ttf')),
        readFile(join(process.cwd(), 'assets/Geist-Medium.ttf'))
    ]);

    return new ImageResponse(
        (
            <div 
                tw="flex items-center justify-center w-full h-full"
                style={{
                    fontFamily: 'Geist',
                    background: 'linear-gradient(to bottom right, #000000, #111111)',
                }}
            >
                {/* Dot pattern overlay */}
                <div 
                    tw="absolute inset-0 opacity-10"
                    style={{
                        backgroundImage: 'radial-gradient(circle at 2px 2px, #666 1px, transparent 0)',
                        backgroundSize: '24px 24px',
                    }}
                />
                
                {/* Decorative borders */}
                <div tw="flex border absolute border-stone-700/50 border-dashed inset-y-0 left-16 w-[1px]" />
                <div tw="flex border absolute border-stone-700/50 border-dashed inset-y-0 right-16 w-[1px]" />
                <div tw="flex border absolute border-stone-700/50 inset-x-0 h-[1px] top-16" />
                <div tw="flex border absolute border-stone-700/50 inset-x-0 h-[1px] bottom-16" />

                {/* Main content */}
                <div tw="flex flex-col items-center">
                    <h1 tw="text-7xl font-medium text-white tracking-tight">
                        registry.directory
                    </h1>
                    <p tw="text-xl text-slate-300/90 mt-4">
                        the place where
                        <span tw="pl-2 inline-flex items-center">
                            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" width="20" height="20">
                                <path d="M21.0001 12.4286L12.4287 21" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"></path>
                                <path d="M19.2857 3L3 19.2857" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"></path>
                            </svg>
                        </span>
                        <span tw="text-white font-medium px-2">shadcn/ui</span>
                        registries live.
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
                }
            ],
        }
    );
}