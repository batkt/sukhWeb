import axios, { AxiosInstance } from "axios";

export const url = "http://103.143.40.46:8084";

export interface DecodedToken {
  id: string;
  ner: string;
  erkh: string;
  baiguullagiinId: string;
  baiguullagiinNer: string;
  utas?: string;
}

const uilchilgee = (token?: string): AxiosInstance => {
  const headers: { "Content-type": string; Authorization?: string } = {
    "Content-type": "application/json",
  };

  if (token) headers["Authorization"] = `Bearer ${token}`;

  return axios.create({
    baseURL: url,
    headers,
  });
};

export const decodeToken = (data: any): DecodedToken => {
  return {
    id: data.id,
    ner: data.ner,
    erkh: data.erkh,
    baiguullagiinId: data.baiguullagiinId,
    baiguullagiinNer: data.baiguullagiinNer,
    utas: data.utas,
  };
};

export default uilchilgee;
