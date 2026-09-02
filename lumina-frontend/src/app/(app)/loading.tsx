export default function AppLoading() {
  return (
    <div className="flex flex-1 items-center justify-center p-10">
      <div className="flex flex-col items-center gap-3 text-muted-foreground">
        <span className="size-8 animate-spin rounded-full border-2 border-[#2563EB] border-t-transparent" />
        <span className="text-sm font-medium">Cargando…</span>
      </div>
    </div>
  );
}
