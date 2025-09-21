'use client'

import { useState } from 'react'
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { Upload, X } from "lucide-react"
import { FileUploadSchema } from '@/lib/schemas'

interface FileUploaderProps {
  onFilesChange: (files: File[]) => void
  maxFiles?: number
  disabled?: boolean
}

interface ProcessedFile {
  file: File
  id: string
  error?: string
}

export function FileUploader({ 
  onFilesChange, 
  maxFiles = 20, 
  disabled = false 
}: FileUploaderProps) {
  const [files, setFiles] = useState<ProcessedFile[]>([])

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files || [])
    
    // Convert new files to validation format
    const newFileData = selectedFiles.map(file => ({
      name: file.name,
      size: file.size
    }))
    
    // Combine with existing files for validation
    const existingFileData = files.map(f => ({
      name: f.file.name,
      size: f.file.size
    }))
    
    const allFileData = [...existingFileData, ...newFileData]
    
    // Validate all files together with Zod
    const validation = FileUploadSchema.safeParse({ files: allFileData })
    
    // Process new files
    const newProcessedFiles: ProcessedFile[] = selectedFiles.map(file => {
      let error: string | undefined
      
      if (!validation.success) {
        // Find specific error for this file
        const fileIndex = existingFileData.length + selectedFiles.indexOf(file)
        const fieldError = validation.error.flatten().fieldErrors.files?.[fileIndex]
        const formError = validation.error.flatten().formErrors[0]
        
        error = fieldError || formError || "Invalid file"
      }
      
      return {
        file,
        id: crypto.randomUUID(),
        error
      }
    })
    
    // Add to existing files
    const updatedFiles = [...files, ...newProcessedFiles]
    setFiles(updatedFiles)
    
    // Only pass valid files to parent
    const validFiles = updatedFiles
      .filter(pf => !pf.error)
      .map(pf => pf.file)
    
    onFilesChange(validFiles)
    
    // Clear the input so same file can be selected again
    event.target.value = ''
  }

  const removeFile = (id: string) => {
    const updatedFiles = files.filter(f => f.id !== id)
    setFiles(updatedFiles)
    
    const validFiles = updatedFiles
      .filter(pf => !pf.error)
      .map(pf => pf.file)
    
    onFilesChange(validFiles)
  }

  return (
    <div className="space-y-4">
      {/* Requirements */}
      <div className="text-sm text-muted-foreground">
        Select .tsx and .ts files (max {maxFiles})
      </div>

      {/* File Input */}
      <div className="flex items-center gap-4">
        <Input
          type="file"
          multiple
          accept=".tsx,.ts"
          onChange={handleFileChange}
          disabled={disabled}
          className="file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:bg-muted file:text-foreground"
        />
      </div>

      {/* File List */}
      {files.length > 0 && (
        <div className="space-y-2">
          {files.map(({ file, id, error }) => (
            <div key={id} className="flex items-center justify-between p-3 bg-muted rounded-md">
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">
                  {file.name}
                </div>
                <div className="text-xs text-muted-foreground">
                  {(file.size / 1024).toFixed(1)} KB
                </div>
                {error && (
                  <div className="text-xs text-red-500 mt-1">
                    {error}
                  </div>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeFile(id)}
                className="ml-2"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
