import { NavLink } from "react-router-dom";

const navItems = [
  { to: "/", label: "Dashboard", icon: "🏠", end: true },
  { to: "/upload", label: "Upload Meeting", icon: "⬆️" },
  { to: "/history", label: "History", icon: "🕑" },
];

export default function Sidebar() {
  return (
    <aside className="flex w-64 flex-col bg-sidebar text-slate-300">
      <div className="flex items-center gap-2 px-6 py-6">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-accent-500 text-lg">
          🎙️
        </div>
        <div className="leading-tight">
          <p className="text-sm font-semibold text-white">AI Meeting</p>
          <p className="text-xs text-slate-400">Summarizer</p>
        </div>
      </div>

      <nav className="mt-2 flex flex-col gap-1 px-3">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                isActive
                  ? "bg-sidebar-hover text-white"
                  : "text-slate-400 hover:bg-sidebar-hover hover:text-white"
              }`
            }
          >
            <span>{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="mt-auto px-6 py-5 text-xs text-slate-500">
        Local Whisper · Free LLM
      </div>
    </aside>
  );
}
