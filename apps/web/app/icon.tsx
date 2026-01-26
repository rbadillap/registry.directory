import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

export const size = {
  width: 32,
  height: 32,
};

export const contentType = 'image/png'

export default async function Icon() {
  const ibmPlexMono = await readFile(
    join(process.cwd(), 'public/fonts/IBMPlexMono-Regular.ttf')
  );

  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 18,
          fontFamily: 'IBM Plex Mono',
          background: 'black',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          letterSpacing: '-0.5px',
        }}
      >
        r.d
      </div>
    ),
    {
      ...size,
      fonts: [
        {
          name: 'IBM Plex Mono',
          data: ibmPlexMono,
          style: 'normal',
          weight: 400,
        },
      ],
    }
  )
}