import Link from "next/link"

export function AffiliateDisclosure() {
  if (process.env.NEXT_PUBLIC_AFFILIATES_ENABLED === "false") {
    return null
  }

  return (
    <div className="text-center py-6">
      <p className="text-[11px] font-mono text-neutral-600">
        Some links are affiliate links.{" "}
        <Link
          href="/disclosure"
          className="underline underline-offset-2 hover:text-neutral-400 transition-colors"
        >
          Learn more
        </Link>
      </p>
    </div>
  )
}
