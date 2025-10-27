import toast from "react-hot-toast";
import axios, { AxiosInstance } from "axios";
import { io, Socket } from "socket.io-client";
import { t } from "i18next";

export const url = "http://103.143.40.46:8084";

// Socket connection
export const socket = (): Socket =>
  io(url, {
    transports: ["websocket"],
  });

// Generic error handler
export const aldaaBarigch = (e: any): void => {
  const errorMessage = e?.response?.data?.aldaa;

  if (errorMessage === "jwt expired" || errorMessage === "jwt malformed") {
    window.location.href = "/";
  } else if (errorMessage) {
    // Show warning toast in Mongolian
    toast.error(t(errorMessage));
  }
};

// Axios instance for Togloom service
export const togloomUilchilgee = (token?: string): AxiosInstance => {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  return axios.create({
    baseURL: url,
    headers,
  });
};

// Axios instance for Zogsool service
export const zogsoolUilchilgee = (token?: string): AxiosInstance => {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  return axios.create({
    baseURL: url,
    headers,
  });
};

// Default Axios instance
const uilchilgee = (token?: string): AxiosInstance => {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  return axios.create({
    baseURL: url,
    headers,
  });
};

export default uilchilgee;
