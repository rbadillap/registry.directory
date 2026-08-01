// Serialises schema.org nodes into the <script type="application/ld+json">
// tag crawlers read. Accepts one node or several; multiple nodes are emitted
// as a single JSON array, which is valid JSON-LD and keeps the DOM to one tag.

type JsonLdNode = Record<string, unknown>

/**
 * Registry names and item descriptions are third-party strings from
 * directory.json and remote registry.json files, so they reach this component
 * untrusted. Escaping `<` closes the `</script>` breakout, and the JSON-LD
 * parser resolves the < escape back to the original character.
 */
function serialise(payload: JsonLdNode | JsonLdNode[]): string {
  return JSON.stringify(payload).replace(/</g, "\\u003c")
}

export function JsonLd({ data }: { data: JsonLdNode | JsonLdNode[] }) {
  if (Array.isArray(data) && data.length === 0) return null

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: serialise(data) }}
    />
  )
}
