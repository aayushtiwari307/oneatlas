export default function RankingsLoading() {
  return (
    <div className="shell-width py-14" aria-label="Loading model rankings">
      <div className="skeleton h-3 w-28" />
      <div className="skeleton mt-4 h-9 w-72 max-w-full" />
      <div className="skeleton mt-3 h-4 w-[34rem] max-w-full" />
      <div className="panel mt-8 space-y-4 p-5">
        <div className="skeleton h-4 w-32" />
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: 7 }, (_, index) => (
            <div key={index} className="skeleton h-9 w-24" />
          ))}
        </div>
        <div className="skeleton h-10 w-full max-w-md" />
      </div>
      <div className="panel mt-5 space-y-5 p-5">
        {Array.from({ length: 6 }, (_, index) => (
          <div key={index} className="skeleton h-11 w-full" />
        ))}
      </div>
    </div>
  );
}
