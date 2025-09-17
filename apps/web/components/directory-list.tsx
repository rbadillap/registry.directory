import Image from "next/image";
import { Plus, ExternalLink as ExternalLinkIcon } from "lucide-react";
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardContent, 
  CardFooter 
} from "@workspace/ui/components/card";
import { 
  Button,
} from "@workspace/ui/components/button";
import { getHostname } from "@/lib/utils";

export type DirectoryEntry = {
  name: string;
  description: string;
  url: string;
};

const addUtmReference = (url: string) => {
  const u = new URL(url)
  u.searchParams.set("utm_source", "registry.directory")
  return u.toString()
}

export function DirectoryList({ entries }: { entries: DirectoryEntry[] }) {
  return (
    <>
      <div className="w-full max-w-5xl mx-auto mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 px-2">
        {entries.map((entry) => (
          <div key={encodeURIComponent(entry.url)} className="h-full">
            <Card className="bg-black border border-stone-700/50 rounded-none overflow-hidden shadow-none hover:shadow-lg transition-shadow h-full flex flex-col !pt-0">
              <div className="w-full aspect-[16/7] bg-transparent flex items-center justify-center ">
                <Image
                  src={`/og/image/${encodeURIComponent(entry.url)}`}
                  alt={entry.name + ' preview'}
                  className="object-cover w-full h-full max-h-32 sm:max-h-40 md:max-h-48 rounded-t-xl"
                  loading="lazy"
                  width={320}
                  height={112}
                  style={{ background: '#18181b' }}
                />
              </div>
              <CardHeader className="flex flex-row items-start justify-between gap-2 bg-black">
                <div className="flex-1 min-w-0">
                  <a
                    href={addUtmReference(entry.url)}
                    target="_blank"
                    rel="noopener"
                    aria-label={`Open ${entry.name}`}
                    className="block group"
                  >
                    <CardTitle className="text-base text-white truncate group-hover:underline">
                      {entry.name}
                    </CardTitle>
                  </a>
                </div>
                <Button
                  asChild
                  size="icon"
                  variant="ghost"
                  className="text-neutral-400 hover:text-white p-1"
                  tabIndex={0}
                >
                  <a
                    href={addUtmReference(entry.url)}
                    target="_blank"
                    rel="noopener"
                    aria-label={`Open ${entry.name}`}
                  >
                    <ExternalLinkIcon className="w-4 h-4" />
                  </a>
                </Button>
              </CardHeader>
              <CardContent className="px-4 pb-5 pt-0 bg-black flex-1 flex flex-col justify-between">
                <CardDescription className="text-sm text-neutral-300 min-h-[40px]">
                  {entry.description}
                </CardDescription>
              </CardContent>
              <CardFooter className="px-4 pb-4 pt-0 bg-black">
                <a href={entry.url} target="_blank" rel="noopener" className="text-xs text-neutral-300 leading-relaxed font-mono truncate hover:underline">
                  {getHostname(entry.url)}
                </a>
              </CardFooter>
            </Card>
          </div>
        ))}
      </div>
      {/* Fixed floating button */}
      <a
        href="https://github.com/rbadillap/registry.directory"
        target="_blank"
        rel="noopener"
        aria-label="Suggest a registry"
        className="fixed z-50 top-6 right-6 sm:top-8 sm:right-8 flex items-center gap-2 px-4 py-3 rounded-none bg-black border border-rose-700 shadow-lg hover:bg-rose-700/80 hover:scale-105 active:scale-95 transition-all duration-150 group focus-visible:ring-2 focus-visible:ring-rose-700"
      >
        <Plus className="w-6 h-6 text-neutral-100" />
        <span className="hidden md:inline font-mono text-xs text-neutral-100">Add a new registry</span>
      </a>
    </>
  );
} 