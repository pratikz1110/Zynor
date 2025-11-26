"use client";

import axios from "axios";

/**
 * Shared Axios instance for Zynor frontend.
 * - baseURL comes from NEXT_PUBLIC_API_URL
 * - Attaches Authorization: Bearer <token> if a token is present in localStorage under "zynor_token"
 * - Sets sane defaults (JSON, timeout)
 */
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  timeout: 10000,
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },
  withCredentials: false,
});

// Attach token if available (Phase 3 auth can write this later)
// Also automatically prefix all requests with "/api"
api.interceptors.request.use((config) => {
  // Automatically prefix all URLs with "/api" if not already present
  if (config.url && !config.url.startsWith("/api/") && !config.url.startsWith("http")) {
    if (config.url.startsWith("/")) {
      config.url = `/api${config.url}`;
    } else {
      config.url = `/api/${config.url}`;
    }
  }
  
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("zynor_token");
    if (token) {
      config.headers = config.headers ?? {};
      (config.headers as any).Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Basic 401 hook (can expand later to redirect to /login)
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err?.response?.status === 401) {
      // TODO: optionally clear token and route to /login
    }
    return Promise.reject(err);
  }
);

export default api;














