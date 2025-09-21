import { useState } from "react"
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@workspace/ui/components/card"
import { Button } from "@workspace/ui/components/button"
import { Textarea } from "@workspace/ui/components/textarea"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import { Loader2, Download, Copy, Check } from "lucide-react"
import type { RegistryMetadata } from "@/lib/schemas"

interface OutputSectionProps {
  registry: string | null
  onGenerate: (metadata: RegistryMetadata) => Promise<void>
  isGenerating: boolean
  error: string | null
  canGenerate: boolean
}

export function OutputSection({ 
  registry, 
  onGenerate, 
  isGenerating, 
  error,
  canGenerate 
}: OutputSectionProps) {
  const [metadata, setMetadata] = useState<RegistryMetadata>({
    name: '',
    description: ''
  })
  const [isCopied, setIsCopied] = useState(false)

  const handleGenerate = () => {
    if (!metadata.name.trim()) {
      // TODO: Show validation error
      return
    }
    onGenerate(metadata)
  }

  const handleCopyToClipboard = async () => {
    if (!registry) return
    
    try {
      await navigator.clipboard.writeText(registry)
      setIsCopied(true)
      
      // Reset after 2 seconds (following Vercel Guidelines for feedback duration)
      setTimeout(() => {
        setIsCopied(false)
      }, 2000)
    } catch (err) {
      console.error('Failed to copy to clipboard:', err)
      // TODO: Show error toast
    }
  }

  return (
    <Card className="bg-black border border-stone-700/50 rounded-none shadow-lg">
      <CardHeader>
        <CardTitle className="text-white text-lg font-medium">Generated Registry</CardTitle>
        <CardDescription className="text-neutral-300 text-sm">
          Configure your registry and generate the JSON
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Registry Metadata Form */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="registry-name" className="text-white">Registry Name *</Label>
            <Input
              id="registry-name"
              value={metadata.name}
              onChange={(e) => setMetadata(prev => ({ ...prev, name: e.target.value }))}
              placeholder="my-awesome-registry"
              className="bg-muted border-stone-600"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="registry-description" className="text-white">Description</Label>
            <Input
              id="registry-description"
              value={metadata.description || ''}
              onChange={(e) => setMetadata(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Beautiful components for your next project"
              className="bg-muted border-stone-600"
            />
          </div>

          <Button 
            onClick={handleGenerate}
            disabled={!canGenerate || isGenerating || !metadata.name.trim()}
            className="w-full"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              'Generate Registry'
            )}
          </Button>
        </div>

        {/* Error Display */}
        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-md">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        {/* Registry Output */}
        {registry ? (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-white">Registry JSON</Label>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleCopyToClipboard}
                  disabled={!registry}
                  className={isCopied ? 'border-green-600 bg-green-600/10' : ''}
                >
                  {isCopied ? (
                    <Check className="w-4 h-4 text-green-400" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </Button>
                <Button variant="outline" size="sm" disabled>
                  <Download className="w-4 h-4" />
                </Button>
              </div>
            </div>
            <Textarea
              value={registry}
              readOnly
              className="font-mono text-xs bg-muted border-stone-600 min-h-[300px]"
            />
          </div>
        ) : (
          <div className="h-32 bg-muted rounded-md flex items-center justify-center">
            <p className="text-muted-foreground text-sm">Registry JSON will appear here</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
