export function DirectoryTabsSkeleton() {
  return (
    <div className="w-full max-w-7xl mx-auto px-4">
      {/* Tabs bar + search bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-6 mb-4 md:mb-6">
        <div className="inline-flex items-center gap-8">
          <div className="h-5 w-20 bg-surface-elevated rounded-sm" />
          <div className="h-5 w-12 bg-surface-elevated rounded-sm" />
        </div>
        <div className="flex-1 w-full sm:w-auto">
          <div className="h-10 w-full bg-surface border border-border rounded-md" />
        </div>
      </div>

      {/* Ghost card grid */}
      <div className="mt-6">
        <div className="w-full max-w-7xl mx-auto mt-6 md:mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-5 px-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-[140px] bg-background border border-border rounded-lg" />
          ))}
        </div>
      </div>
    </div>
  );
}
