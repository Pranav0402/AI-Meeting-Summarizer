import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getMeetings } from "../api";
import MeetingCard from "../components/MeetingCard";

export default function Dashboard() {
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);

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

  useEffect(() => {
    load();
  }, []);

  const recent = meetings.slice(0, 6);
  const completedCount = meetings.filter((m) => m.status === "completed").length;

  return (
    <div className="mx-auto max-w-5xl px-8 py-10">
      <section className="rounded-3xl bg-gradient-to-br from-brand-600 to-accent-500 p-8 text-white shadow-lg">
        <p className="text-sm font-medium uppercase tracking-wider text-brand-100">
          AI Meeting Assistant
        </p>
        <h1 className="mt-2 text-3xl font-bold">
          Turn meeting audio into clear, actionable notes.
        </h1>
        <p className="mt-2 max-w-xl text-brand-100">
          Upload a recording and get a transcript, summary, key decisions, and
          action items with owners and deadlines — powered by local Whisper and
          a free LLM.
        </p>
        <Link
          to="/upload"
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 font-semibold text-brand-600 shadow transition hover:bg-brand-50"
        >
          ⬆️ Upload New Meeting
        </Link>
      </section>

      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
        <Stat label="Total Meetings" value={meetings.length} />
        <Stat label="Completed" value={completedCount} />
        <Stat label="In Progress" value={meetings.length - completedCount} />
      </div>

      <div className="mt-10">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-slate-800">Recent Meetings</h2>
          <Link to="/history" className="text-sm font-medium text-brand-600 hover:text-brand-500">
            View all →
          </Link>
        </div>

        {loading ? (
          <p className="text-slate-500">Loading…</p>
        ) : recent.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {recent.map((m) => (
              <MeetingCard key={m.id} meeting={m} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-3xl font-bold text-slate-800">{value}</p>
      <p className="mt-1 text-sm text-slate-500">{label}</p>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
      <p className="text-4xl">🎙️</p>
      <p className="mt-3 font-medium text-slate-700">No meetings yet</p>
      <p className="mt-1 text-sm text-slate-500">
        Upload your first meeting recording to get started.
      </p>
      <Link
        to="/upload"
        className="mt-4 inline-flex rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-500"
      >
        Upload Meeting
      </Link>
    </div>
  );
}
