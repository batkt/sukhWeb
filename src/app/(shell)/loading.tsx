/**
 * Streaming fallback for every section in the shell.
 *
 * These pages are large client bundles, so there is a real gap between the
 * click and the first paint while the chunk downloads. Showing the page's
 * shape immediately reads as far faster than the old blocking spinner, and it
 * keeps the sidebar interactive throughout.
 */
export default function ShellLoading() {
  return (
    <div className="space-y-4 p-4" aria-busy="true" aria-live="polite">
      <span className="sr-only">Уншиж байна</span>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="h-7 w-48 animate-pulse rounded-md bg-[color:var(--panel-text)]/10" />
        <div className="ml-auto flex gap-2">
          <div className="h-9 w-28 animate-pulse rounded-lg bg-[color:var(--panel-text)]/8" />
          <div className="h-9 w-24 animate-pulse rounded-lg bg-[color:var(--panel-text)]/8" />
        </div>
      </div>

      {/* Stat row */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="h-20 animate-pulse rounded-xl bg-[color:var(--panel-text)]/6"
          />
        ))}
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-[color:var(--panel-text)]/10">
        <div className="h-11 bg-[color:var(--panel-text)]/8" />
        <div className="divide-y divide-[color:var(--panel-text)]/8">
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 px-4 py-3.5">
              <div
                className="h-3.5 animate-pulse rounded bg-[color:var(--panel-text)]/8"
                style={{ width: `${18 + ((i * 7) % 14)}%` }}
              />
              <div
                className="h-3.5 animate-pulse rounded bg-[color:var(--panel-text)]/6"
                style={{ width: `${24 + ((i * 11) % 18)}%` }}
              />
              <div className="ml-auto h-3.5 w-16 animate-pulse rounded bg-[color:var(--panel-text)]/6" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
