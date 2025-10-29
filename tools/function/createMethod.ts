import uilchilgee from "../../lib/uilchilgee";

function createMethod<T = any>(
  modelName: string,
  token: string | null,
  data: Record<string, any>
): Promise<{ data: T }> {
  return uilchilgee(token || undefined).post(`/${modelName}`, data);
}

export default createMethod;
