import type { RegistryItem } from "./registry-types"
import type { DirectoryEntry } from "./types"
import { getTargetPath } from "./path-utils"

export function generateMarkdownForItem(
  item: RegistryItem,
  registry: DirectoryEntry,
  owner: string,
  repo: string,
  category: string
): string {
  const markdown: string[] = []

  // Header
  markdown.push(`# ${item.name}`)
  markdown.push('')

  // Description
  if (item.description) {
    markdown.push(item.description)
    markdown.push('')
  }

  // Metadata
  markdown.push('## Metadata')
  markdown.push('')
  markdown.push(`- **Type**: \`${item.type}\``)
  markdown.push(`- **Registry**: [${registry.name}](${registry.url})`)
  if (registry.github_url) {
    markdown.push(`- **Repository**: [${owner}/${repo}](${registry.github_url})`)
  }
  markdown.push(`- **Files**: ${item.files?.length || 0}`)

  // Dependencies
  if (item.registryDependencies && item.registryDependencies.length > 0) {
    markdown.push(`- **Registry Dependencies**: ${item.registryDependencies.join(', ')}`)
  }
  if (item.dependencies && Object.keys(item.dependencies).length > 0) {
    markdown.push(`- **NPM Dependencies**: ${Object.entries(item.dependencies).map(([pkg, ver]) => `${pkg}@${ver}`).join(', ')}`)
  }
  if (item.devDependencies && Object.keys(item.devDependencies).length > 0) {
    markdown.push(`- **Dev Dependencies**: ${Object.entries(item.devDependencies).map(([pkg, ver]) => `${pkg}@${ver}`).join(', ')}`)
  }

  markdown.push('')
  markdown.push('---')
  markdown.push('')

  // Files
  if (item.files && item.files.length > 0) {
    markdown.push('## Files')
    markdown.push('')

    for (const file of item.files) {
      const targetPath = getTargetPath(file)
      const content = file.content || ''

      // Determine language for syntax highlighting
      const ext = targetPath.split('.').pop()?.toLowerCase()
      const lang = getLanguageFromExtension(ext || '')

      markdown.push(`### ${targetPath}`)
      markdown.push('')

      if (file.target && file.target !== targetPath) {
        markdown.push(`**Install path**: \`${file.target}\``)
        markdown.push('')
      }

      if (content) {
        markdown.push('```' + lang)
        markdown.push(content)
        markdown.push('```')
        markdown.push('')
      } else {
        markdown.push('_No content available_')
        markdown.push('')
      }
    }
  }

  // Footer
  markdown.push('---')
  markdown.push('')
  markdown.push(`Generated from [registry.directory](https://registry.directory/${owner}/${repo}/${category}/${item.name})`)

  return markdown.join('\n')
}

function getLanguageFromExtension(ext: string): string {
  const langMap: Record<string, string> = {
    'ts': 'typescript',
    'tsx': 'tsx',
    'js': 'javascript',
    'jsx': 'jsx',
    'json': 'json',
    'css': 'css',
    'scss': 'scss',
    'html': 'html',
    'md': 'markdown',
    'yaml': 'yaml',
    'yml': 'yaml',
    'sh': 'bash',
    'bash': 'bash',
  }
  return langMap[ext] || 'text'
}
