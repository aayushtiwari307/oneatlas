export default function ModelsLoading() {
  return (
    <div className="shell-width py-14" aria-label="Loading model explorer">
      <div className="skeleton h-3 w-28" />
      <div className="skeleton mt-4 h-9 w-64" />
      <div className="skeleton mt-3 h-4 w-96 max-w-full" />
      <div className="mt-8 grid gap-5 lg:grid-cols-[245px_minmax(0,1fr)]">
        <div className="panel hidden h-[520px] p-4 lg:block" />
        <div className="grid gap-3 sm:grid-cols-2 2xl:grid-cols-3">
          {Array.from({ length: 6 }, (_, index) => (
            <div className="panel h-56 p-5" key={index}>
              <div className="skeleton h-3 w-24" />
              <div className="skeleton mt-4 h-6 w-2/3" />
              <div className="skeleton mt-3 h-3 w-1/3" />
              <div className="skeleton mt-8 h-12 w-full" />
              <div className="skeleton mt-5 h-5 w-28" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
