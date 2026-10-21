import { nextJsConfig } from "@workspace/eslint-config/next-js"

/** @type {import("eslint").Linter.Config} */
export default [
  ...nextJsConfig,
  {
    // Affiliate "Visit" links send the referrer on purpose, so the vendor
    // sees where a visit came from. noopener is still required on every
    // target="_blank" link; only noreferrer becomes optional.
    rules: {
      "react/jsx-no-target-blank": ["warn", { allowReferrer: true }],
    },
  },
]
