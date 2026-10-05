export function LoadingScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f7f7f8]">
      <div className="flex flex-col items-center gap-3">
        <div className="h-9 w-9 animate-spin rounded-full border-2 border-brand border-t-transparent" />
        <p className="text-sm text-slate-500">Loading…</p>
      </div>
    </div>
  );
}
