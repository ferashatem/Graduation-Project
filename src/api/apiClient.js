
import axios from "axios";

const apiClient = axios.create({
  baseURL: "/api",
});

// Attach token to every request automatically
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default apiClient;

