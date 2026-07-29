export default function Spinner({ label = 'Loading…' }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3 text-slate-400">
      <div className="h-8 w-8 rounded-full border-2 border-slate-300 border-t-primary animate-spin" />
      <p className="text-sm">{label}</p>
    </div>
  );
}
