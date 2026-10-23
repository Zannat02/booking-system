import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});


api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});


api.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    if (axios.isAxiosError(error)) {
      const isLoginRequest = error.config?.url?.includes("/auth/login");
      if (
        error.response?.status === 401 &&
        localStorage.getItem("token") &&
        !isLoginRequest
      ) {
        localStorage.removeItem("token");
        window.location.assign("/login");
      }
    }
    return Promise.reject(error);
  }
);

export default api;