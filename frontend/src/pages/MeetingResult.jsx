import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { getMeeting, pollMeeting } from "../api";

export default function MeetingResult() {
  const { id } = useParams();
  const [meeting, setMeeting] = useState(null);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        let data = await getMeeting(id);

        if (data.status !== "completed" && data.status !== "failed") {
          data = await pollMeeting(id, 2500, 120);
        }

        if (!cancelled) setMeeting(data);
      } catch (err) {
        console.error(err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loading) {
    return <div className="p-10 text-slate-500">Loading meeting…</div>;
  }

  if (!meeting || meeting.status === "failed") {
    return (
      <div className="p-10">
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-rose-700">
          <p className="font-semibold">Processing failed</p>
          <p className="mt-1 text-sm">{meeting?.error || "Unknown error."}</p>
          <Link to="/upload" className="mt-3 inline-block text-sm font-medium underline">
            Try another upload
          </Link>
        </div>
      </div>
    );
  }

  const decisions = meeting.decisions || [];
  const actions = meeting.action_items || [];
  const transcript = meeting.transcript || "";

  const highlights = (text) => {
    if (!query) return text;
    const parts = text.split(new RegExp(`(${query})`, "ig"));
    return parts.map((p, i) =>
      p.toLowerCase() === query.toLowerCase() ? (
        <mark key={i} className="bg-yellow-200">
          {p}
        </mark>
      ) : (
        <span key={i}>{p}</span>
      )
    );
  };

  const copyTranscript = async () => {
    await navigator.clipboard.writeText(transcript);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="mx-auto max-w-4xl px-8 py-10">
      <div className="flex items-center justify-between">
        <div>
          <Link to="/history" className="text-sm text-brand-600 hover:text-brand-500">
            ← Back to History
          </Link>
          <h1 className="mt-1 text-2xl font-semibold text-slate-800">
            {meeting.filename}
          </h1>
        </div>
      </div>

      {/* Summary */}
      <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-800">📝 Meeting Summary</h2>
        <p className="mt-3 leading-relaxed text-slate-600">
          {meeting.summary || "No summary available."}
        </p>
      </section>

      {/* Decisions */}
      <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-800">✅ Key Decisions</h2>
        {decisions.length === 0 ? (
          <p className="mt-3 text-sm text-slate-500">No decisions recorded.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {decisions.map((d, i) => (
              <li key={i} className="flex items-start gap-2 text-slate-700">
                <span className="mt-1 text-emerald-500">✓</span>
                <span>{d}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Action Items */}
      <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-800">🎯 Action Items</h2>
        {actions.length === 0 ? (
          <p className="mt-3 text-sm text-slate-500">No action items recorded.</p>
        ) : (
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500">
                  <th className="py-2 pr-4 font-medium">Task</th>
                  <th className="py-2 pr-4 font-medium">Owner</th>
                  <th className="py-2 font-medium">Deadline</th>
                </tr>
              </thead>
              <tbody>
                {actions.map((a, i) => (
                  <tr key={i} className="border-b border-slate-100">
                    <td className="py-3 pr-4 text-slate-700">{a.task}</td>
                    <td className="py-3 pr-4">
                      <span className="rounded-full bg-brand-50 px-2.5 py-1 text-xs font-medium text-brand-600">
                        {a.owner || "Unassigned"}
                      </span>
                    </td>
                    <td className="py-3 text-slate-500">{a.deadline || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Transcript */}
      <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-slate-800">📜 Full Transcript</h2>
          <div className="flex items-center gap-2">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search transcript…"
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm outline-none focus:border-brand-500"
            />
            <button
              onClick={copyTranscript}
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
            >
              {copied ? "Copied ✓" : "Copy"}
            </button>
          </div>
        </div>
        <div className="scroll-thin mt-4 max-h-96 overflow-y-auto whitespace-pre-wrap rounded-lg bg-slate-50 p-4 text-sm leading-relaxed text-slate-700">
          {highlights(transcript) || "No transcript available."}
        </div>
      </section>
    </div>
  );
}
