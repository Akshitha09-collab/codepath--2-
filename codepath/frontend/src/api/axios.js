/**
 * api/axios.js
 * ------------
 * Centralized axios instance. Attaches the JWT (stored in localStorage)
 * to every outgoing request, and redirects to /login on a 401 so an
 * expired/invalid token doesn't leave the user stuck on a broken page.
 */

import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

const api = axios.create({ baseURL: API_BASE_URL });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("codepath_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem("codepath_token");
      localStorage.removeItem("codepath_user");
      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export default api;
