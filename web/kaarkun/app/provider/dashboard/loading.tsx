export default function ProviderDashboardLoading() {
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

      {/* Stats cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="rounded-2xl bg-zinc-100 dark:bg-zinc-800 p-5 space-y-2">
            <div className="h-3 w-20 rounded bg-zinc-200 dark:bg-zinc-700" />
            <div className="h-7 w-12 rounded bg-zinc-200 dark:bg-zinc-700" />
          </div>
        ))}
      </div>

      {/* Bookings list */}
      <div className="space-y-3">
        <div className="h-4 w-36 rounded bg-zinc-200 dark:bg-zinc-700" />
        {[...Array(4)].map((_, i) => (
          <div key={i} className="rounded-2xl bg-zinc-100 dark:bg-zinc-800 p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-zinc-200 dark:bg-zinc-700 flex-shrink-0" />
            <div className="space-y-2 flex-1">
              <div className="h-4 w-3/4 rounded bg-zinc-200 dark:bg-zinc-700" />
              <div className="h-3 w-1/2 rounded bg-zinc-200 dark:bg-zinc-700" />
            </div>
            <div className="h-6 w-20 rounded-full bg-zinc-200 dark:bg-zinc-700" />
          </div>
        ))}
      </div>
    </div>
  );
}
