interface OGImageProps {
  img: string | null;
  hostname: string;
}

export function OGImage({ img, hostname }: OGImageProps) {
  return (
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
        {img ? (
          <img
            src={img}
            alt="Registry image"
            tw="w-full h-96 rounded-lg"
            style={{ 
              background: '#000',
              objectFit: 'cover',
              objectPosition: 'center',
            }}
            width="100%"
            height="24rem"
          />
        ) : (
          <div tw="flex flex-col items-center justify-center w-full max-h-96 p-8">
            {/* Fallback message */}
            <div tw="text-neutral-300 text-2xl mb-2 text-rose-700">Preview Unavailable</div>
            <div tw="text-neutral-400 text-lg">Click to visit the registry</div>
          </div>
        )}
        
        {/* Site info */}
        <div tw="flex flex-col items-center mt-6">
          <h2 tw="text-4xl text-white font-medium">
            {hostname}
          </h2>
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
  );
}
