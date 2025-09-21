import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@workspace/ui/components/card"
import { FileUploader } from "./file-uploader"
import type { FileConfiguration } from "@/lib/schemas"

interface UploadSectionProps {
  files: File[]
  onFilesChange: (files: File[]) => void
  configurations: FileConfiguration[]
  onConfigurationsChange: (configs: FileConfiguration[]) => void
}

export function UploadSection({ 
  onFilesChange, 
  onConfigurationsChange 
}: UploadSectionProps) {
  return (
    <Card className="bg-black border border-stone-700/50 rounded-none shadow-lg">
      <CardHeader>
        <CardTitle className="text-white text-lg font-medium">Upload Component Files</CardTitle>
        <CardDescription className="text-neutral-300 text-sm">
          Select your <span className="font-bold">.tsx</span> and <span className="font-bold">.ts</span> component files to generate a registry
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <FileUploader 
          onFilesChange={onFilesChange}
          onConfigurationsChange={onConfigurationsChange}
          maxFiles={20}
        />
      </CardContent>
    </Card>
  )
}
