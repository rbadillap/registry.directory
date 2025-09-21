'use client'

import { useState, useEffect } from 'react'
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { Badge } from "@workspace/ui/components/badge"
import { Upload, X, Settings } from "lucide-react"
import { FileUploadSchema, type FileConfiguration, type FileConfig } from '@/lib/schemas'
import { FileConfigDialog } from '@/components/file-config-dialog'

interface FileUploaderProps {
  onFilesChange: (files: File[]) => void
  onConfigurationsChange?: (configurations: FileConfiguration[]) => void
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
  onConfigurationsChange,
  maxFiles = 20, 
  disabled = false 
}: FileUploaderProps) {
  const [files, setFiles] = useState<ProcessedFile[]>([])
  const [fileConfigurations, setFileConfigurations] = useState<FileConfiguration[]>([])

  // localStorage key for persistence
  const STORAGE_KEY = 'registry-generator-file-configs'

  // Load configurations from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      try {
        setFileConfigurations(JSON.parse(saved))
      } catch (error) {
        console.error('Failed to load configurations:', error)
      }
    }
  }, [])

  // Save configurations to localStorage when they change
  useEffect(() => {
    if (fileConfigurations.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(fileConfigurations))
    }
    // Notify parent component of configuration changes
    onConfigurationsChange?.(fileConfigurations)
  }, [fileConfigurations, onConfigurationsChange])

  // Clean up configurations when files are removed
  useEffect(() => {
    const currentFileIds = files.map(f => f.id)
    setFileConfigurations(prev => 
      prev.filter(config => currentFileIds.includes(config.fileId))
    )
  }, [files])

  // Get configuration for a file
  const getFileConfiguration = (fileId: string): FileConfiguration | undefined => {
    return fileConfigurations.find(config => config.fileId === fileId)
  }

  // Initialize configuration for new files
  useEffect(() => {
    const newConfigurations: FileConfiguration[] = []
    
    files.forEach(file => {
      const existingConfig = getFileConfiguration(file.id)
      if (!existingConfig && !file.error) {
        newConfigurations.push({
          fileId: file.id,
          fileName: file.file.name,
          status: 'pending',
        })
      }
    })

    if (newConfigurations.length > 0) {
      setFileConfigurations(prev => [...prev, ...newConfigurations])
    }
  }, [files])

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

  const handleSaveConfiguration = (fileId: string) => (config: FileConfig) => {
    setFileConfigurations(prev => 
      prev.map(fileConfig => 
        fileConfig.fileId === fileId
          ? { ...fileConfig, status: 'configured' as const, config, error: undefined }
          : fileConfig
      )
    )
  }

  const getBadgeVariant = (status: FileConfiguration['status']) => {
    return {
      configured: 'default',
      error: 'destructive',
      pending: 'secondary'
    }[status] as any
  }

  const getBadgeText = (status: FileConfiguration['status']) => {
    return {
      configured: '✓ Configured',
      error: '⚠ Error',
      pending: 'Pending'
    }[status] as any
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
          {files.map(({ file, id, error }) => {
            const configuration = getFileConfiguration(id)
            const status = error ? 'error' : (configuration?.status || 'pending')
            
            return (
              <div key={id} className="flex items-center justify-between p-3 bg-black border border-stone-700/50 rounded-md">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="text-sm font-medium truncate">
                      {file.name}
                    </div>
                    <Badge variant={getBadgeVariant(status)} className="text-xs">
                      {getBadgeText(status)}
                    </Badge>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {(file.size / 1024).toFixed(1)} KB
                  </div>
                  {error && (
                    <div className="text-xs text-red-500 mt-1">
                      {error}
                    </div>
                  )}
                  {configuration?.error && (
                    <div className="text-xs text-red-500 mt-1">
                      {configuration.error}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-1 ml-2">
                  {!error && (
                    <FileConfigDialog
                      fileName={file.name}
                      onSave={handleSaveConfiguration(id)}
                      initialConfig={configuration?.config}
                      trigger={
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-muted-foreground hover:text-foreground"
                        >
                          <Settings className="w-4 h-4" />
                        </Button>
                      }
                    />
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFile(id)}
                    className="text-muted-foreground hover:text-red-500"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      )}

    </div>
  )
}
