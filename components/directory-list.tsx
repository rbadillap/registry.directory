'use client'

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Plus, ExternalLink as ExternalLinkIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

export type DirectoryEntry = {
  name: string;
  description: string;
  url: string;
};

export function DirectoryList({ entries }: { entries: DirectoryEntry[] }) {
  return (
    <div className="w-full max-w-2xl mx-auto mt-12 grid grid-cols-1 md:grid-cols-2 gap-4">
      {entries.map((entry) => (
        <div key={entry.url} className="h-full">
          <Card className="transition-shadow hover:shadow-md h-full">
            <CardHeader className="flex flex-row items-start justify-between gap-2 px-4 py-2">
              <CardTitle className="font-mono text-base">
                {entry.name}
              </CardTitle>
              <Button
                asChild
                size="icon"
                variant="ghost"
                className="text-muted-foreground hover:text-primary p-1"
                tabIndex={0}
                onClick={e => { e.stopPropagation(); }}
              >
                <a
                  href={entry.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Open ${entry.name}`}
                >
                  <ExternalLinkIcon className="w-4 h-4" />
                </a>
              </Button>
            </CardHeader>
            <CardContent className="px-4 pb-4 pt-0">
              <CardDescription className="font-mono text-xs">
                {entry.description}
              </CardDescription>
            </CardContent>
          </Card>
        </div>
      ))}
      {/* Placeholder Card */}
      <a
        href="https://github.com/rbadillap/registry.directory"
        target="_blank"
        rel="noopener noreferrer"
        className="block h-full"
      >
        <Card className="border-dashed border-2 border-muted-foreground/40 bg-muted/40 hover:bg-muted/60 flex items-center justify-center min-h-[80px] transition-colors h-full">
          <CardContent className="flex flex-col items-center justify-center py-6">
            <Plus className="w-6 h-6 text-muted-foreground mb-2" />
            <span className="font-mono text-xs text-muted-foreground">Suggest a registry</span>
          </CardContent>
        </Card>
      </a>
    </div>
  );
} 