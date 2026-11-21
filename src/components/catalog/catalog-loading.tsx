export function CatalogLoading({ title }: { title: string }) {
  return (
    <div className="shell-width py-14" aria-label={`Loading ${title}`}>
      <div className="skeleton h-3 w-28" />
      <div className="skeleton mt-4 h-9 w-64 max-w-full" />
      <div className="skeleton mt-3 h-4 w-[34rem] max-w-full" />
      <div className="mt-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }, (_, index) => (
          <div className="panel h-48 p-5" key={index}>
            <div className="skeleton h-10 w-10 rounded-xl" />
            <div className="skeleton mt-5 h-5 w-2/3" />
            <div className="skeleton mt-3 h-3 w-full" />
            <div className="skeleton mt-2 h-3 w-3/4" />
          </div>
        ))}
      </div>
    </div>
  );
}
