export default function CustomerDashboardLoading() {
  return (
    <div className="p-6 space-y-6 animate-pulse">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="w-14 h-14 rounded-full bg-zinc-200 dark:bg-zinc-700" />
        <div className="space-y-2">
          <div className="h-4 w-40 rounded bg-zinc-200 dark:bg-zinc-700" />
          <div className="h-3 w-28 rounded bg-zinc-200 dark:bg-zinc-700" />
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="rounded-2xl bg-zinc-100 dark:bg-zinc-800 p-4 space-y-2">
            <div className="h-3 w-16 rounded bg-zinc-200 dark:bg-zinc-700" />
            <div className="h-6 w-10 rounded bg-zinc-200 dark:bg-zinc-700" />
          </div>
        ))}
      </div>

      {/* Recent jobs */}
      <div className="space-y-3">
        <div className="h-4 w-32 rounded bg-zinc-200 dark:bg-zinc-700" />
        {[...Array(3)].map((_, i) => (
          <div key={i} className="rounded-2xl bg-zinc-100 dark:bg-zinc-800 p-4 space-y-2">
            <div className="h-4 w-3/4 rounded bg-zinc-200 dark:bg-zinc-700" />
            <div className="h-3 w-1/2 rounded bg-zinc-200 dark:bg-zinc-700" />
          </div>
        ))}
      </div>
    </div>
  );
}
