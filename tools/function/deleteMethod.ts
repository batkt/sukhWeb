import uilchilgee from "../../src/lib/uilchilgee";

function deleteMethod(
  modelName: string,
  token: string | null,
  id: string
): Promise<{ data: any }> {
  return uilchilgee(token || undefined).delete(`/${modelName}/${id}`);
}

export default deleteMethod;
