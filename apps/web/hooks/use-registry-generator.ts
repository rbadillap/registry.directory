'use client'

import { useState } from 'react'
import { generateRegistryItem, formatRegistryJson } from '@/lib/registry-generator'
import type { FileConfiguration, RegistryMetadata } from '@/lib/schemas'

export function useRegistryGenerator() {
  const [files, setFiles] = useState<File[]>([])
  const [configurations, setConfigurations] = useState<FileConfiguration[]>([])
  const [generatedRegistry, setGeneratedRegistry] = useState<string | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const generateRegistry = async (metadata: RegistryMetadata) => {
    setIsGenerating(true)
    setError(null)
    
    try {
      const registryItem = await generateRegistryItem(configurations, files, metadata)
      const json = formatRegistryJson(registryItem)
      setGeneratedRegistry(json)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Generation failed')
      setGeneratedRegistry(null)
    } finally {
      setIsGenerating(false)
    }
  }

  const resetRegistry = () => {
    setGeneratedRegistry(null)
    setError(null)
  }

  // Helper to check if generation is possible
  const canGenerate = () => {
    const configuredFiles = configurations.filter(
      fc => fc.status === 'configured' && fc.config
    )
    return configuredFiles.length > 0
  }

  return {
    // State
    files,
    configurations,
    generatedRegistry,
    isGenerating,
    error,
    
    // Actions
    setFiles,
    setConfigurations,
    generateRegistry,
    resetRegistry,
    
    // Computed
    canGenerate: canGenerate()
  }
}
