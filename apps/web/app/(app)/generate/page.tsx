'use client'

import { useState } from "react"
import { Metadata } from "next"
import Link from "next/link"
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@workspace/ui/components/card"
import { Button } from "@workspace/ui/components/button"
import { 
  Dialog, 
  DialogClose, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@workspace/ui/components/dialog"
import { FileUploader } from "@/components/file-uploader"
import { Label } from "@workspace/ui/components/label"
import { Input } from "@workspace/ui/components/input"

export default function GeneratePage() {
  const [files, setFiles] = useState<File[]>([])

  const handleFilesChange = (newFiles: File[]) => {
    setFiles(newFiles)
  }

  return (
    <main className="min-h-screen py-20 px-4">
      {/* Header */}
      <div className="max-w-4xl mx-auto space-y-6 mb-16">
        <div className="space-y-2">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-medium">
              Registry Generator
            </h1>
          </div>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Generate a <Link href="https://ui.shadcn.com/docs/registry/introduction" target="_blank" className="text-xs text-neutral-300 leading-relaxed font-mono truncate hover:underline">shadcn/ui registry.json</Link> from your component files automatically. 
            Upload your components and we'll create the registry configuration for you.
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Upload Section */}
        <Card className="bg-black border border-stone-700/50 rounded-none shadow-lg">
          <CardHeader>
            <CardTitle className="text-white text-lg font-medium">Upload Component Files</CardTitle>
            <CardDescription className="text-neutral-300 text-sm">
              Select your <span className="font-bold">.tsx</span> and <span className="font-bold">.ts</span> component files to generate a registry
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <FileUploader 
              onFilesChange={handleFilesChange}
              maxFiles={20}
            />
          </CardContent>
        </Card>

        {/* Preview Section */}
        <Card className="bg-black border border-stone-700/50 rounded-none shadow-lg">
          <CardHeader>
            <CardTitle className="text-white text-lg font-medium">Generated Registry</CardTitle>
            <CardDescription className="text-neutral-300 text-sm">
              Registry preview will appear here
            </CardDescription>
          </CardHeader>
          <CardContent>
            {files.length > 0 ? (
              <div className="space-y-2">
                <div className="text-sm text-muted-foreground">
                  {files.length} file{files.length !== 1 ? 's' : ''} selected:
                </div>
                <div className="bg-muted rounded-md p-3 font-mono text-xs">
                  {files.map(file => (
                    <div key={file.name} className="text-neutral-300">
                      {file.name}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="h-32 bg-muted rounded-md flex items-center justify-center">
                <p className="text-muted-foreground text-sm">Registry preview will appear here</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
