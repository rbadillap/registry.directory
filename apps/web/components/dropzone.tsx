'use client'

import React, { useState, useCallback, useRef } from 'react'
import { Button } from "@workspace/ui/components/button"
import { Badge } from "@workspace/ui/components/badge"
import { X, Settings, Upload, FileText } from "lucide-react"
import { FileUploadSchema, type FileConfiguration, type FileConfig } from '@/lib/schemas'
import { FileConfigDialog } from '@/components/file-config-dialog'
import { cn } from "@workspace/ui/lib/utils"

interface DropzoneProps {
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

type DragState = 'idle' | 'dragover' | 'dragenter' | 'drop'

export function Dropzone({ 
  onFilesChange, 
  onConfigurationsChange,
  maxFiles = 20, 
  disabled = false 
}: DropzoneProps) {
  const [files, setFiles] = useState<ProcessedFile[]>([])
  const [fileConfigurations, setFileConfigurations] = useState<FileConfiguration[]>([])
  const [dragState, setDragState] = useState<DragState>('idle')
  const fileInputRef = useRef<HTMLInputElement>(null)

  // localStorage key for persistence
  const STORAGE_KEY = 'registry-generator-file-configs'

  // Load configurations from localStorage on mount
  React.useEffect(() => {
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
  React.useEffect(() => {
    if (fileConfigurations.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(fileConfigurations))
    }
    onConfigurationsChange?.(fileConfigurations)
  }, [fileConfigurations, onConfigurationsChange])

  // Clean up configurations when files are removed
  React.useEffect(() => {
    const currentFileIds = files.map(f => f.id)
    setFileConfigurations(prev => 
      prev.filter(config => currentFileIds.includes(config.fileId))
    )
  }, [files])

  // Get configuration for a file
  const getFileConfiguration = useCallback((fileId: string): FileConfiguration | undefined => {
    return fileConfigurations.find(config => config.fileId === fileId)
  }, [fileConfigurations])

  // Initialize configuration for new files
  React.useEffect(() => {
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
  }, [files, getFileConfiguration])

  const processFiles = useCallback((newFiles: File[]) => {
    // Convert new files to validation format
    const newFileData = newFiles.map(file => ({
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
    const newProcessedFiles: ProcessedFile[] = newFiles.map(file => {
      let error: string | undefined
      
      if (!validation.success) {
        // Find specific error for this file
        const fileIndex = existingFileData.length + newFiles.indexOf(file)
        const fieldError = validation.error.flatten().fieldErrors.files?.[fileIndex]
        const formError = validation.error.flatten().formErrors[0]
        
        // console.log('fieldError',fieldError)
        // console.log('formError',formError)
        // console.log('validation',validation)
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
  }, [files, onFilesChange])

  const handleFileInput = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files || [])
    processFiles(selectedFiles)
    
    // Clear the input so same file can be selected again
    event.target.value = ''
  }

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragState('dragenter')
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragState('dragover')
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    // Only set to idle if we're leaving the dropzone entirely
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setDragState('idle')
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragState('drop')
    
    const droppedFiles = Array.from(e.dataTransfer.files)
    // Process all files - validation happens in processFiles
    processFiles(droppedFiles)
    
    // Reset drag state after a short delay
    setTimeout(() => setDragState('idle'), 200)
  }, [processFiles])

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

  const openFileDialog = () => {
    fileInputRef.current?.click()
  }

  const isDragActive = dragState === 'dragover' || dragState === 'dragenter'
  const hasFiles = files.length > 0

  return (
    <div className="space-y-4">
      {/* Requirements */}
      <div className="text-sm text-muted-foreground">
        Select .tsx and .ts files (max {maxFiles})
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept=".tsx,.ts"
        onChange={handleFileInput}
        disabled={disabled}
        className="hidden"
      />

      {/* Dropzone Area */}
      <div
        className={cn(
          "relative border-2 border-dashed rounded-none p-8 text-center transition-all duration-200 cursor-pointer",
          "hover:border-rose-700/50 hover:bg-rose-700/5",
          isDragActive && "border-rose-700 bg-rose-700/10 scale-[1.02]",
          disabled && "opacity-50 cursor-not-allowed",
          hasFiles && "border-solid border-stone-700/50 bg-stone-900/20"
        )}
        draggable
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={openFileDialog}
      >
        <div className="flex flex-col items-center gap-4">
          {/* Icon */}
          <div className={cn(
            "p-4 rounded-none transition-colors",
            isDragActive && "bg-rose-700/20 text-rose-700",
            !isDragActive && "bg-muted text-muted-foreground"
          )}>
            <Upload className="w-8 h-8" />
          </div>

          {/* Text Content */}
          <div className="space-y-2">
            <h3 className="text-lg font-medium text-foreground">
              {isDragActive && "Drop your files here"}
              {!isDragActive && hasFiles && "Add more files"}
              {!isDragActive && !hasFiles && "Drag & drop your component files"}
            </h3>
            
            <p className="text-sm text-muted-foreground">
              {isDragActive && "Release to upload"}
              {!isDragActive && "or click to browse"}
            </p>
          </div>

          {/* File type indicators */}
          {!isDragActive && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono">
              <FileText className="w-4 h-4" />
              <span>.tsx, .ts files only</span>
            </div>
          )}
        </div>
      </div>

      {/* File List */}
      {files.length > 0 && (
        <div className="space-y-2">
          <div className="text-sm font-medium text-foreground">
            Uploaded Files <span className="text-rose-700 font-mono">({files.length})</span>
          </div>
          {files.map(({ file, id, error }) => {
            const configuration = getFileConfiguration(id)
            const status = error ? 'error' : (configuration?.status || 'pending')
            
            return (
              <div key={id} className="flex items-center justify-between p-3 bg-black border border-stone-700/50 rounded-none">
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
