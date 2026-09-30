// Shown only for the very first load; later loads keep the previous rows on screen.
export function EmployeeListSkeleton() {
  return (
    <div role="status" aria-label="Loading employees" className="flex flex-col gap-3">
      <span className="sr-only">Loading employees</span>
      {Array.from({ length: 6 }, (_, index) => (
        <div key={index} className="card flex flex-col gap-3 p-4">
          <div className="skeleton h-4 w-1/3" />
          <div className="skeleton h-3 w-1/2" />
          <div className="skeleton h-3 w-2/3" />
        </div>
      ))}
    </div>
  );
}
