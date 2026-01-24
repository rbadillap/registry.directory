export type PreviewRegistry = {
  name: string
  previewUrl: string
}

export type PreviewConfig = {
  registries: Record<string, PreviewRegistry>
}
