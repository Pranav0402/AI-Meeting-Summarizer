import { Link } from "react-router-dom";
import StatusBadge from "./StatusBadge";

function formatDate(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDuration(seconds) {
  if (!seconds) return "—";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

export default function MeetingCard({ meeting }) {
  const ready = meeting.status === "completed";

  return (
    <Link
      to={ready ? `/meetings/${meeting.id}` : "#"}
      className={`group flex flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${
        ready ? "" : "pointer-events-none opacity-80"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-lg">
          🎧
        </div>
        <StatusBadge status={meeting.status} />
      </div>

      <h3 className="mt-4 truncate font-semibold text-slate-800" title={meeting.filename}>
        {meeting.filename}
      </h3>

      <div className="mt-1 flex items-center gap-3 text-xs text-slate-500">
        <span>{formatDate(meeting.created_at)}</span>
        <span>·</span>
        <span>{formatDuration(meeting.duration)}</span>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <span className="text-sm font-medium text-brand-600 group-hover:text-brand-500">
          {ready ? "View Summary →" : "Processing…"}
        </span>
      </div>
    </Link>
  );
}
