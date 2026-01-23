/**
 * Generate CSS content from cssVars object
 */
export function generateGlobalsCss(cssVars: {
  theme?: Record<string, string>
  light?: Record<string, string>
  dark?: Record<string, string>
}): string {
  const lines: string[] = ['@layer base {']

  // Add theme variables (if any)
  if (cssVars.theme && Object.keys(cssVars.theme).length > 0) {
    lines.push('  :root {')
    for (const [key, value] of Object.entries(cssVars.theme)) {
      lines.push(`    --${key}: ${value};`)
    }
    lines.push('  }')
    lines.push('')
  }

  // Add light mode variables
  if (cssVars.light && Object.keys(cssVars.light).length > 0) {
    lines.push('  :root {')
    for (const [key, value] of Object.entries(cssVars.light)) {
      lines.push(`    --${key}: ${value};`)
    }
    lines.push('  }')
    lines.push('')
  }

  // Add dark mode variables
  if (cssVars.dark && Object.keys(cssVars.dark).length > 0) {
    lines.push('  .dark {')
    for (const [key, value] of Object.entries(cssVars.dark)) {
      lines.push(`    --${key}: ${value};`)
    }
    lines.push('  }')
  }

  lines.push('}')
  return lines.join('\n')
}
