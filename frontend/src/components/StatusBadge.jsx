const styles = {
  pending: "bg-slate-100 text-slate-600",
  transcribing: "bg-amber-100 text-amber-700",
  summarizing: "bg-indigo-100 text-indigo-700",
  processing: "bg-indigo-100 text-indigo-700",
  completed: "bg-emerald-100 text-emerald-700",
  failed: "bg-rose-100 text-rose-700",
};

export default function StatusBadge({ status }) {
  const key = (status || "pending").toLowerCase();
  const cls = styles[key] || styles.pending;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${cls}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {status}
    </span>
  );
}
