export default function ModelDetailLoading() {
  return (
    <div className="shell-width py-10" aria-label="Loading model details" aria-busy="true">
      <div className="skeleton h-4 w-36" />
      <div className="mt-7 rounded-2xl border border-white/[0.08] bg-[#0d1728] p-7 sm:p-9">
        <div className="skeleton h-3 w-40" />
        <div className="skeleton mt-5 h-10 max-w-xl" />
        <div className="skeleton mt-4 h-4 max-w-2xl" />
        <div className="skeleton mt-2 h-4 max-w-xl" />
      </div>
      <div className="mt-7 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => <div className="panel p-5" key={index}><div className="skeleton h-3 w-24" /><div className="skeleton mt-4 h-7 w-28" /></div>)}
      </div>
      <div className="mt-10 grid gap-3 sm:grid-cols-2">
        {Array.from({ length: 2 }, (_, index) => <div className="panel p-6" key={index}><div className="skeleton h-4 w-32" /><div className="skeleton mt-5 h-8 w-full" /></div>)}
      </div>
      <div className="skeleton mt-12 h-56 w-full" />
    </div>
  );
}
