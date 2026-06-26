import { CircularProgress } from "@mui/material";

function Loading({ label }) {
  return (
    <div className="flex items-center justify-center gap-3 py-10 text-slate-600">
      <CircularProgress size={24} />
      <span className="text-sm">{label || "Loading..."}</span>
    </div>
  );
}

export default Loading;
