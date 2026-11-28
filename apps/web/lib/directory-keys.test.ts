// A team handle equal to a directory key would hide that registry while both
// /r live side by side, so every key a registry answers to must be listed.
//
// Run with: pnpm test

import { strict as assert } from "node:assert"
import { describe, it } from "node:test"
import { readFileSync } from "node:fs"
import { join } from "node:path"
import { directoryKeys } from "./directory-keys.ts"

describe("directoryKeys", () => {
  it("lists the handle and the GitHub owner of each entry, lowercased", () => {
    const keys = directoryKeys([
      { name: "A", description: "", url: "", namespace: "@Efferd" },
      { name: "B", description: "", url: "", github_url: "https://github.com/Acme/ui" },
      { name: "Some Thing", description: "", url: "" },
    ])
    assert.deepEqual([...keys].sort(), ["acme", "efferd", "some-thing"])
  })

  it("covers every registry in the directory", () => {
    const file = join(import.meta.dirname, "../public/directory.json")
    const { registries } = JSON.parse(readFileSync(file, "utf8"))
    const keys = directoryKeys(registries)
    assert.ok(keys.has("shadcn"))
    assert.ok(keys.size >= registries.length * 0.9)
  })
})
