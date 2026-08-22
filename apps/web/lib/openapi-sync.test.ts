// public/openapi.json is a published contract, and lib/submissions.ts is the
// code that enforces it. Nothing ties them together at runtime, so they can
// only drift apart silently — an agent reading the spec would then build
// payloads the API rejects. These tests fail the suite the moment the two
// disagree on fields, requiredness, or the constraints agents actually hit.
//
// Run with: pnpm test

import { readFileSync } from "node:fs"
import { join } from "node:path"
import { strict as assert } from "node:assert"
import { describe, it } from "node:test"
import type { z } from "zod"
import { submissionSchema } from "./submissions.ts"

const spec = JSON.parse(
  readFileSync(join(process.cwd(), "public/openapi.json"), "utf8")
)

interface SpecSchema {
  $ref?: string
  maxLength?: number
  maxItems?: number
  required?: string[]
  properties?: Record<string, SpecSchema>
  [key: string]: unknown
}

function resolveRef(node: SpecSchema): SpecSchema {
  if (!node.$ref) return node
  const path = node.$ref.replace(/^#\//, "").split("/")
  let current: unknown = spec
  for (const segment of path) {
    current = (current as Record<string, unknown>)[segment]
  }
  return current as SpecSchema
}

// ZodOptional wraps the real type; everything the tests inspect lives on the
// inner type.
function unwrap(field: z.ZodTypeAny): z.ZodTypeAny {
  return field.isOptional() ? field._def.innerType : field
}

function maxCheck(field: z.ZodTypeAny, kind: "max"): number | undefined {
  const checks = unwrap(field)._def.checks as
    | Array<{ kind: string; value: number }>
    | undefined
  return checks?.find((c) => c.kind === kind)?.value
}

const requestSchema = resolveRef(
  spec.paths["/api/submit"].post.requestBody.content["application/json"].schema
)
const specProperties = requestSchema.properties as Record<string, SpecSchema>
const zodShape = submissionSchema.shape

function specProperty(name: string): SpecSchema {
  const property = specProperties[name]
  assert.ok(property, `openapi.json documents no "${name}" property`)
  return property
}

describe("openapi.json stays in sync with submissionSchema", () => {
  it("documents exactly the fields the API accepts", () => {
    assert.deepEqual(
      Object.keys(specProperties).sort(),
      Object.keys(zodShape).sort()
    )
  })

  it("agrees on which fields are required", () => {
    const zodRequired = Object.entries(zodShape)
      .filter(([, field]) => !field.isOptional())
      .map(([name]) => name)
      .sort()
    assert.deepEqual([...(requestSchema.required as string[])].sort(), zodRequired)
  })

  it("agrees on the length limits agents actually hit", () => {
    assert.equal(specProperty("name").maxLength, maxCheck(zodShape.name, "max"))
    assert.equal(
      specProperty("description").maxLength,
      maxCheck(zodShape.description, "max")
    )
  })

  it("agrees on the featured cap", () => {
    const featured = unwrap(zodShape.featured)
    assert.equal(
      specProperty("featured").maxItems,
      (featured._def.maxLength as { value: number }).value
    )
  })

  it("agrees on the pro offering booleans", () => {
    const proSpec = resolveRef(specProperty("pro"))
    const proZod = unwrap(zodShape.pro) as z.ZodObject<z.ZodRawShape>
    assert.deepEqual(
      Object.keys(proSpec.properties as object).sort(),
      Object.keys(proZod.shape).sort()
    )
    assert.deepEqual(
      [...(proSpec.required as string[])].sort(),
      Object.keys(proZod.shape).sort()
    )
  })

  it("documents every status code the submit handler can return", () => {
    // The list mirrors app/api/submit/route.ts; if the handler grows a new
    // status, the spec must document it before this list is updated.
    const documented = Object.keys(spec.paths["/api/submit"].post.responses).sort()
    assert.deepEqual(documented, [
      "200",
      "201",
      "400",
      "403",
      "409",
      "413",
      "422",
      "500",
      "503",
    ])
  })
})
