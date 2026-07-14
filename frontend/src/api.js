import axios from "axios";

const API = axios.create({
  baseURL: "http://127.0.0.1:8000",
  timeout: 120000,
});

export async function uploadMeeting(file) {
  const formData = new FormData();
  formData.append("file", file);

  const { data } = await API.post("/api/meetings/upload", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

  return data;
}

export async function getMeeting(id) {
  const { data } = await API.get(`/api/meetings/${id}`);
  return data;
}

export async function getMeetings() {
  const { data } = await API.get("/api/meetings");
  return data;
}

// Poll a meeting until it is no longer being processed.
// onTick(meeting) is called on every poll so the UI can show live status.
export async function pollMeeting(id, intervalMs = 3000, maxAttempts = 60, onTick) {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const meeting = await getMeeting(id);

    if (onTick) onTick(meeting);

    if (meeting.status === "completed" || meeting.status === "failed") {
      return meeting;
    }

    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }

  throw new Error("Timed out while waiting for the meeting to finish.");
}

export default API;
