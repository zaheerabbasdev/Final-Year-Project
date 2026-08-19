export default function CustomerJobsLoading() {
  return (
    <div className="p-6 space-y-4 animate-pulse">
      <div className="h-6 w-40 rounded bg-zinc-200 dark:bg-zinc-700" />
      {[...Array(4)].map((_, i) => (
        <div key={i} className="rounded-2xl bg-zinc-100 dark:bg-zinc-800 p-5 space-y-3">
          <div className="flex items-start justify-between">
            <div className="space-y-2 flex-1">
              <div className="h-5 w-2/3 rounded bg-zinc-200 dark:bg-zinc-700" />
              <div className="h-3 w-1/4 rounded bg-zinc-200 dark:bg-zinc-700" />
            </div>
            <div className="h-6 w-16 rounded-full bg-zinc-200 dark:bg-zinc-700 ml-3" />
          </div>
          <div className="h-3 w-full rounded bg-zinc-200 dark:bg-zinc-700" />
          <div className="flex gap-3 pt-1">
            <div className="h-3 w-20 rounded bg-zinc-200 dark:bg-zinc-700" />
            <div className="h-3 w-20 rounded bg-zinc-200 dark:bg-zinc-700" />
          </div>
        </div>
      ))}
    </div>
  );
}
