// Central axios instance: base URL, JSON headers, and (optional) interceptors.
import axios from "axios";

const API_BASE = "https://universitymanagementsystem-production-e58e.up.railway.app/api";

export const http = axios.create({
  baseURL: API_BASE,
  headers: { "Content-Type": "application/json" },
  // withCredentials: true, // enable if you use cookies/Sanctum/etc.
});
