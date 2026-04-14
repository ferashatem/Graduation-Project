// Central axios instance: base URL, JSON headers, and (optional) interceptors.
import axios from "axios";

const API_BASE =
  process.env.VITE_API_BASE ||
  "https://coowned-api-dev-528199941216.us-central1.run.app/api";

export const http = axios.create({
  baseURL: API_BASE,
  headers: { "Content-Type": "application/json" },
  // withCredentials: true, // enable if you use cookies/Sanctum/etc.
});
