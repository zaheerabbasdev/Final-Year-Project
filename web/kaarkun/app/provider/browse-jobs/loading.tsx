export default function BrowseJobsLoading() {
  return (
    <div className="p-6 space-y-4 animate-pulse">
      {/* Search bar */}
      <div className="h-11 rounded-xl bg-zinc-100 dark:bg-zinc-800" />

      {/* Filter chips */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-8 w-24 rounded-full bg-zinc-100 dark:bg-zinc-800 flex-shrink-0" />
        ))}
      </div>

      {/* Job cards */}
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="rounded-2xl bg-zinc-100 dark:bg-zinc-800 p-5 space-y-3">
            <div className="flex items-start justify-between">
              <div className="space-y-2 flex-1">
                <div className="h-5 w-3/4 rounded bg-zinc-200 dark:bg-zinc-700" />
                <div className="h-3 w-1/3 rounded bg-zinc-200 dark:bg-zinc-700" />
              </div>
              <div className="h-6 w-20 rounded-full bg-zinc-200 dark:bg-zinc-700 ml-3" />
            </div>
            <div className="h-3 w-full rounded bg-zinc-200 dark:bg-zinc-700" />
            <div className="h-3 w-2/3 rounded bg-zinc-200 dark:bg-zinc-700" />
            <div className="flex gap-4 pt-1">
              <div className="h-3 w-24 rounded bg-zinc-200 dark:bg-zinc-700" />
              <div className="h-3 w-24 rounded bg-zinc-200 dark:bg-zinc-700" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
