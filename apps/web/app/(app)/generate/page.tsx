'use client'

// import { Metadata } from "next"
import { PageHeader } from "@/components/page-header"
import { UploadSection } from "@/components/upload-section"
import { OutputSection } from "@/components/output-section"
import { useRegistryGenerator } from "@/hooks/use-registry-generator"

export default function GeneratePage() {
  const {
    files,
    setFiles,
    configurations,
    setConfigurations,
    generatedRegistry,
    generateRegistry,
    isGenerating,
    error,
    canGenerate
  } = useRegistryGenerator()

  return (
    <main className="min-h-screen py-20 px-4">
      <PageHeader />
      
      <div className="max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8">
        <UploadSection 
          files={files}
          onFilesChange={setFiles}
          configurations={configurations}
          onConfigurationsChange={setConfigurations}
        />
        
        <OutputSection 
          registry={generatedRegistry}
          onGenerate={generateRegistry}
          isGenerating={isGenerating}
          error={error}
          canGenerate={canGenerate}
        />
      </div>
    </main>
  )
}
