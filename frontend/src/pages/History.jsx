import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getMeetings } from "../api";
import MeetingCard from "../components/MeetingCard";

export default function History() {
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const data = await getMeetings();
        setMeetings(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const filtered = meetings.filter((m) =>
    (m.filename || "").toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="mx-auto max-w-5xl px-8 py-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800">History</h1>
          <p className="mt-1 text-slate-500">All previously processed meetings.</p>
        </div>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Find meeting by keyword…"
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-500"
        />
      </div>

      {loading ? (
        <p className="mt-6 text-slate-500">Loading…</p>
      ) : filtered.length === 0 ? (
        <div className="mt-10 rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
          <p className="text-4xl">🗂️</p>
          <p className="mt-3 font-medium text-slate-700">
            {meetings.length === 0 ? "No meetings yet" : "No matches found"}
          </p>
          <Link
            to="/upload"
            className="mt-4 inline-flex rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-500"
          >
            Upload Meeting
          </Link>
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((m) => (
            <MeetingCard key={m.id} meeting={m} />
          ))}
        </div>
      )}
    </div>
  );
}
