import { Routes, Route } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import Dashboard from "./pages/Dashboard";
import Upload from "./pages/Upload";
import MeetingResult from "./pages/MeetingResult";
import History from "./pages/History";

export default function App() {
  return (
    <div className="flex h-full">
      <Sidebar />
      <main className="flex-1 overflow-y-auto scroll-thin">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/upload" element={<Upload />} />
          <Route path="/meetings/:id" element={<MeetingResult />} />
          <Route path="/history" element={<History />} />
        </Routes>
      </main>
    </div>
  );
}
