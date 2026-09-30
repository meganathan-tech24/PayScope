// Shown only for the very first load; later loads keep the previous rows on screen.
// Mirrors the real layout: table rows from md up, cards below.
export function EmployeeListSkeleton() {
  return (
    <div role="status" aria-label="Loading employees">
      <span className="sr-only">Loading employees</span>
      <div className="hidden overflow-hidden rounded-lg border border-neutral-200 bg-white md:block">
        <div className="h-10 border-b border-neutral-200 bg-neutral-100" />
        {Array.from({ length: 8 }, (_, index) => (
          <div
            key={index}
            className="grid grid-cols-[2.2fr_1.4fr_1fr_1fr_0.8fr_1fr] items-center gap-4 border-b border-neutral-100 px-4 py-3 last:border-b-0"
          >
            <div className="flex items-center gap-3">
              <div className="skeleton h-9 w-9 shrink-0 rounded-full" />
              <div className="flex flex-1 flex-col gap-1.5">
                <div className="skeleton h-3.5 w-2/3" />
                <div className="skeleton h-3 w-full" />
              </div>
            </div>
            <div className="skeleton h-3.5 w-4/5" />
            <div className="skeleton h-3.5 w-3/4" />
            <div className="skeleton h-3.5 w-2/3" />
            <div className="skeleton h-5 w-16 rounded-full" />
            <div className="skeleton ml-auto h-3.5 w-24" />
          </div>
        ))}
      </div>
      <div className="flex flex-col gap-3 md:hidden">
        {Array.from({ length: 5 }, (_, index) => (
          <div key={index} className="card flex flex-col gap-3 p-4">
            <div className="flex items-center gap-3">
              <div className="skeleton h-9 w-9 shrink-0 rounded-full" />
              <div className="flex flex-1 flex-col gap-1.5">
                <div className="skeleton h-3.5 w-1/2" />
                <div className="skeleton h-3 w-3/4" />
              </div>
            </div>
            <div className="skeleton h-3 w-2/3" />
            <div className="skeleton h-3 w-1/2" />
          </div>
        ))}
      </div>
    </div>
  );
}
