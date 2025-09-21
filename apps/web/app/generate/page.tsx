import { Metadata } from "next";
import Link from "next/link";
import { Upload } from "lucide-react";
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardContent, 
  CardDescription,
} from "@workspace/ui/components/card";
import { Button } from "@workspace/ui/components/button";

export const metadata: Metadata = {
  title: "Registry Generator - registry.directory",
  description: "Generate a shadcn/ui registry.json from your component files automatically.",
};

export default function GeneratePage() {
  return (
    <main className="min-h-screen py-20 px-4">
      {/* Header */}
      <div className="max-w-4xl mx-auto space-y-6 mb-16">
        <div className="space-y-2">
          <h1 className="text-2xl font-medium">
            Registry Generator
          </h1>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Generate a <Link href="https://ui.shadcn.com/docs/registry/introduction" target="_blank" className="text-xs text-neutral-300 leading-relaxed font-mono truncate hover:underline">shadcn/ui registry.json</Link> from your component files automatically. 
            Upload your components and we'll create the registry configuration for you.
          </p>
        </div>
      </div>

      {/* Main Card */}
      <div className="max-w-4xl mx-auto">
        <Card className="bg-black border border-stone-700/50 rounded-none shadow-lg">
          <CardHeader>
            <CardTitle className="text-white text-lg font-medium">Upload Component Files</CardTitle>
            <CardDescription className="text-neutral-300 text-sm">
              Select your <span className="font-bold">.tsx</span> and <span className="font-bold">.ts</span> component files to generate a registry
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Placeholder Upload Button */}
            <div className="w-full">
              <Button 
                variant="outline" 
                className="w-full h-32 border-dashed border-rose-700 bg-transparent hover:bg-rose-700/20 hover:border-rose-700 text-neutral-300 hover:text-white transition-all duration-150 rounded-none"
                disabled
              >
                <div className="flex flex-col items-center space-y-2">
                  <Upload className="w-8 h-8" />
                  <span className="text-sm">Upload Files</span>
                  <span className="text-xs text-muted-foreground">(Coming Soon)</span>
                </div>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
