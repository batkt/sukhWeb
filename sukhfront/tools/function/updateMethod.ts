import uilchilgee from "../../lib/uilchilgee";

function updateMethod<T = any>(
  modelName: string,
  token: string | null,
  data: { _id: string; [key: string]: any }
): Promise<{ data: T }> {
  return uilchilgee(token || undefined).put(`/${modelName}/${data._id}`, data);
}

export default updateMethod;
