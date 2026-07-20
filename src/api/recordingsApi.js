import apiClient from "./apiClient";

const unwrap = (res) => res.data?.data ?? res.data;

export const fetchRecordingsDashboard = () =>
  apiClient.get("/companion/recordings/dashboard").then(unwrap);

export const fetchMyRecordings = () =>
  apiClient.get("/companion/recordings/my").then(unwrap);

export const uploadRecording = (file, onUploadProgress) =>
  apiClient.post(
    "/companion/recordings/upload",
    (() => {
      const fd = new FormData();
      fd.append("file", file);
      return fd;
    })(),
    {
      headers: { "Content-Type": "multipart/form-data" },
      onUploadProgress,
    }
  ).then(unwrap);

export const fetchRecordingDetails = (recordingId) =>
  apiClient.get(`/companion/recordings/${recordingId}`).then(unwrap);

export const fetchRecordingSummary = (recordingId) =>
  apiClient.get(`/companion/recordings/${recordingId}/summary`).then(unwrap);

export const fetchRecordingFlashcards = (recordingId) =>
  apiClient.get(`/companion/recordings/${recordingId}/flashcards`).then(unwrap);

export const fetchRecordingQuiz = (recordingId) =>
  apiClient.get(`/companion/recordings/${recordingId}/quiz`).then(unwrap);

export const askRecordingAI = (recordingId, message) =>
  apiClient
    .post(`/companion/recordings/${recordingId}/ask`, { message })
    .then(unwrap);

export const deleteRecording = (recordingId) =>
  apiClient.delete(`/companion/recordings/${recordingId}`);
