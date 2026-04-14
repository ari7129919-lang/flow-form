export default function AdminLoading() {
  return (
    <div className="flex flex-col gap-4">
      <div className="h-10 w-40 rounded-xl bg-white/60" />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="h-24 rounded-2xl border border-zinc-200 bg-white/70" />
        <div className="h-24 rounded-2xl border border-zinc-200 bg-white/70" />
        <div className="h-24 rounded-2xl border border-zinc-200 bg-white/70" />
      </div>
      <div className="h-64 rounded-2xl border border-zinc-200 bg-white/70" />
    </div>
  );
}
