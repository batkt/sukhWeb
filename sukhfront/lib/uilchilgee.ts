import axios, { AxiosInstance, AxiosError } from "axios";
import toast from "react-hot-toast";

export const url = "http://103.143.40.46:8084";

export const aldaaBarigch = (e: AxiosError<{ aldaa?: string }>) => {
  if (
    e?.response?.data?.aldaa === "jwt expired" ||
    e?.response?.data?.aldaa === "jwt malformed"
  ) {
    window.location.href = "/";
  } else if (e?.response?.data?.aldaa) {
    toast.error(e.response.data.aldaa);
  } else if (e?.message) {
    toast.error(e.message);
  }
};

const uilchilgee = (token?: string): AxiosInstance => {
  const headers: Record<string, string> = {
    "Content-type": "application/json",
  };

  if (token) {
    headers["Authorization"] = `bearer ${token}`;
  }

  return axios.create({
    baseURL: url,
    headers,
  });
};

export default uilchilgee;
