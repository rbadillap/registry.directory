export function Slogan() {
  return (
    <p className="text-sm mt-10 px-4 text-center font-mono">
      <span className="text-muted-foreground">discover, preview, copy </span>
      <span className="text-foreground">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="inline-flex size-4 text-muted-foreground"
        >
          <path
            d="M21.0001 12.4286L12.4287 21"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          ></path>
          <path
            d="M19.2857 3L3 19.2857"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          ></path>
        </svg>
      </span>
      <span className="ml-1 font-mono font-bold">shadcn/ui</span>
      <span className="text-muted-foreground"> registries</span>
    </p>
  )
}
