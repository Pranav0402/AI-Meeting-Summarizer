import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { uploadMeeting, pollMeeting } from "../api";

const STAGES = ["Uploading", "Transcribing", "Generating Summary", "Completed"];

export default function Upload() {
  const [file, setFile] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [stage, setStage] = useState(0); // index into STAGES
  const [error, setError] = useState("");
  const [processing, setProcessing] = useState(false);
  const inputRef = useRef(null);
  const navigate = useNavigate();

  const onFiles = (files) => {
    const f = files && files[0];
    if (!f) return;

    const okExt = /\.(mp3|wav|m4a|ogg|flac)$/i.test(f.name);
    if (!okExt) {
      setError("Unsupported format. Use .mp3, .wav, .m4a, .ogg or .flac");
      return;
    }
    if (f.size > 50 * 1024 * 1024) {
      setError("File is larger than 50 MB.");
      return;
    }
    setError("");
    setFile(f);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    onFiles(e.dataTransfer.files);
  };

  const handleSubmit = async () => {
    if (!file) return;
    setProcessing(true);
    setError("");
    setStage(0);

    try {
      const { id } = await uploadMeeting(file);
      setStage(1);

      // Poll the backend and reflect its status in the progress UI:
      // transcribing -> stage 1, summarizing -> stage 2.
      const result = await pollMeeting(id, 2500, 120, (m) => {
        if (m.status === "summarizing") setStage(2);
      });

      if (result.status === "failed") {
        throw new Error(result.error || "Processing failed on the server.");
      }

      setStage(3);
      setTimeout(() => navigate(`/meetings/${id}`), 700);
    } catch (err) {
      setError(err.message || "Something went wrong.");
      setProcessing(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-8 py-10">
      <h1 className="text-2xl font-semibold text-slate-800">Upload Meeting</h1>
      <p className="mt-1 text-slate-500">
        Drag and drop an audio file, or click to browse.
      </p>

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => !processing && inputRef.current?.click()}
        className={`mt-6 flex cursor-pointer flex-col items-center justify-center rounded-3xl border-2 border-dashed p-12 text-center transition ${
          dragging
            ? "border-brand-500 bg-brand-50"
            : "border-slate-300 bg-white hover:border-brand-400"
        } ${processing ? "pointer-events-none opacity-70" : ""}`}
      >
        <div className="text-5xl">🎧</div>
        <p className="mt-4 font-medium text-slate-700">
          {file ? file.name : "Drop your audio file here"}
        </p>
        <p className="mt-1 text-sm text-slate-400">
          Supported: .mp3 · .wav · .m4a · .ogg · .flac (max 50 MB)
        </p>
        <input
          ref={inputRef}
          type="file"
          accept="audio/*"
          className="hidden"
          onChange={(e) => onFiles(e.target.files)}
        />
      </div>

      {error && (
        <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      )}

      {file && !processing && (
        <button
          onClick={handleSubmit}
          className="mt-6 w-full rounded-xl bg-brand-600 py-3 font-semibold text-white transition hover:bg-brand-500"
        >
          Start Processing
        </button>
      )}

      {processing && (
        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <ol className="space-y-3">
            {STAGES.map((label, i) => {
              const done = i < stage;
              const active = i === stage;
              return (
                <li key={label} className="flex items-center gap-3">
                  <span
                    className={`flex h-7 w-7 items-center justify-center rounded-full text-sm ${
                      done
                        ? "bg-emerald-500 text-white"
                        : active
                        ? "bg-brand-600 text-white animate-pulse"
                        : "bg-slate-100 text-slate-400"
                    }`}
                  >
                    {done ? "✓" : i + 1}
                  </span>
                  <span
                    className={`text-sm ${
                      done || active ? "text-slate-800" : "text-slate-400"
                    }`}
                  >
                    {label}
                    {active && "…"}
                  </span>
                </li>
              );
            })}
          </ol>
        </div>
      )}
    </div>
  );
}
