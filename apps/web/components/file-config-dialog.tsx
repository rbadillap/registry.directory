'use client'

import { useState } from 'react'
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter,
  DialogTrigger 
} from "@workspace/ui/components/dialog"
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@workspace/ui/components/select"
import { FileConfigSchema, type FileConfig } from '@/lib/schemas'
import { Settings } from 'lucide-react'

interface FileConfigDialogProps {
  fileName: string
  onSave: (config: FileConfig) => void
  initialConfig?: FileConfig
  trigger: React.ReactNode
}

export function FileConfigDialog({ 
  fileName, 
  onSave, 
  initialConfig,
  trigger 
}: FileConfigDialogProps) {
  // Generate defaults from filename
  const getDefaultName = (filename: string) => {
    return filename.replace(/\.(tsx|ts)$/, '').toLowerCase()
  }
  
  const getDefaultPath = (filename: string) => {
    return `components/ui/${filename}`
  }

  const [formData, setFormData] = useState<FileConfig>(() => ({
    type: initialConfig?.type || 'components:ui',
    name: initialConfig?.name || getDefaultName(fileName),
    path: initialConfig?.path || getDefaultPath(fileName)
  }))
  
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [open, setOpen] = useState(false)

  const validateField = (field: keyof FileConfig, value: string) => {
    try {
      // Create proper pick object for Zod
      const pickObj = field === 'type' ? { type: true } : 
                     field === 'name' ? { name: true } : 
                     { path: true }
      FileConfigSchema.pick(pickObj as any).parse({ [field]: value })
      setErrors(prev => ({ ...prev, [field]: '' }))
    } catch (error: any) {
      const fieldError = error.flatten().fieldErrors[field]?.[0]
      setErrors(prev => ({ ...prev, [field]: fieldError || '' }))
    }
  }

  const handleFieldChange = (field: keyof FileConfig, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    validateField(field, value)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const validatedConfig = FileConfigSchema.parse(formData)
      onSave(validatedConfig)
      setOpen(false) // Close dialog
      setErrors({}) // Clear errors
    } catch (error: any) {
      const fieldErrors = error.flatten().fieldErrors
      setErrors(fieldErrors)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Configure {fileName}
          </DialogTitle>
          <DialogDescription>
            Set the component type, name, and file path for this component.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Component Type */}
          <div className="space-y-2">
            <Label htmlFor="component-type">Component Type</Label>
            <Select 
              value={formData.type} 
              onValueChange={(value) => handleFieldChange('type', value)}
              name="component-type"
            >
              <SelectTrigger id="component-type">
                <SelectValue placeholder="Select component type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="components:ui">UI Component</SelectItem>
                <SelectItem value="components:component">Component</SelectItem>
                <SelectItem value="components:example">Example</SelectItem>
              </SelectContent>
            </Select>
            {errors.type && (
              <p className="text-sm text-red-500">{errors.type}</p>
            )}
          </div>

          {/* Component Name */}
          <div className="space-y-2">
            <Label htmlFor="component-name">Component Name</Label>
            <Input
              id="component-name"
              name="component-name"
              value={formData.name}
              onChange={(e) => handleFieldChange('name', e.target.value)}
              onBlur={(e) => validateField('name', e.target.value)}
              placeholder="button"
              className={errors.name ? 'border-red-500' : ''}
            />
            {errors.name && (
              <p className="text-sm text-red-500">{errors.name}</p>
            )}
          </div>

          {/* File Path */}
          <div className="space-y-2">
            <Label htmlFor="file-path">File Path</Label>
            <Input
              id="file-path"
              name="file-path"
              value={formData.path}
              onChange={(e) => handleFieldChange('path', e.target.value)}
              onBlur={(e) => validateField('path', e.target.value)}
              placeholder="components/ui/button.tsx"
              className={errors.path ? 'border-red-500' : ''}
            />
            {errors.path && (
              <p className="text-sm text-red-500">{errors.path}</p>
            )}
          </div>
        </form>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} type="button">
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={isSubmitting}
            type="submit"
          >
            {isSubmitting ? 'Saving...' : 'Save Configuration'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
