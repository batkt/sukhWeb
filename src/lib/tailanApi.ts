import uilchilgee from "lib/uilchilgee";

export async function postSummary(token: string, body: any) {
  return uilchilgee(token).post(`/tailan/summary`, body);
}

export async function postAvlaga(token: string, body: any) {
  return uilchilgee(token).post(`/tailan/avlaga`, body);
}

export async function postGuilegee(token: string, body: any) {
  return uilchilgee(token).post(`/tailan/guilegee`, body);
}

export async function postOrlogoZarlaga(token: string, body: any) {
  return uilchilgee(token).post(`/tailan/orlogo-zarlaga`, body);
}

export async function postAshigAldagdal(token: string, body: any) {
  return uilchilgee(token).post(`/tailan/ashig-aldagdal`, body);
}

export async function postSariin(token: string, body: any) {
  return uilchilgee(token).post(`/tailan/sariin`, body);
}

export async function postUliral(token: string, body: any) {
  return uilchilgee(token).post(`/tailan/uliral`, body);
}

export async function postExport(token: string, body: any) {
  // expects CSV response
  return uilchilgee(token).post(`/tailan/export`, body, {
    responseType: "blob",
  });
}
