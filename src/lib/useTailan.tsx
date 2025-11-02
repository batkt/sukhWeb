import uilchilgee from "lib/uilchilgee";

export async function postSummary(token: string, body: any) {
  return uilchilgee(token).get(`/tailan/summary`, { params: body });
}

export async function getSummaryByOrg(token: string, baiguullagiinId: string) {
  return uilchilgee(token).get(`/tailan/summary`, {
    params: { baiguullagiinId },
    headers: { "X-Org-Only": "1" },
  });
}

export async function postAvlaga(token: string, body: any) {
  return uilchilgee(token).get(`/tailan/avlaga`, { params: body });
}

export async function postGuilegee(token: string, body: any) {
  return uilchilgee(token).get(`/tailan/guilegee`, { params: body });
}

export async function postOrlogoZarlaga(token: string, body: any) {
  return uilchilgee(token).get(`/tailan/orlogo-zarlaga`, { params: body });
}

export async function postAshigAldagdal(token: string, body: any) {
  return uilchilgee(token).get(`/tailan/ashig-aldagdal`, { params: body });
}

export async function postSariin(token: string, body: any) {
  return uilchilgee(token).get(`/tailan/sariin`, { params: body });
}

export async function postUliral(token: string, body: any) {
  return uilchilgee(token).get(`/tailan/uliral`, { params: body });
}

export async function postExport(token: string, body: any) {
  // Export still uses POST for file download
  return uilchilgee(token).post(`/tailan/export`, body, {
    responseType: "blob",
  });
}

// Org-only GET helpers (send only baiguullagiinId)
export async function getAvlagaByOrg(token: string, baiguullagiinId: string) {
  return uilchilgee(token).get(`/tailan/avlaga`, {
    params: { baiguullagiinId },
    headers: { "X-Org-Only": "1" },
  });
}

export async function getGuilegeeByOrg(token: string, baiguullagiinId: string) {
  return uilchilgee(token).get(`/tailan/guilegee`, {
    params: { baiguullagiinId },
    headers: { "X-Org-Only": "1" },
  });
}

export async function getOrlogoZarlagaByOrg(
  token: string,
  baiguullagiinId: string
) {
  return uilchilgee(token).get(`/tailan/orlogo-zarlaga`, {
    params: { baiguullagiinId },
    headers: { "X-Org-Only": "1" },
  });
}

export async function getAshigAldagdalByOrg(
  token: string,
  baiguullagiinId: string
) {
  return uilchilgee(token).get(`/tailan/ashig-aldagdal`, {
    params: { baiguullagiinId },
    headers: { "X-Org-Only": "1" },
  });
}

export async function getSariinByOrg(token: string, baiguullagiinId: string) {
  return uilchilgee(token).get(`/tailan/sariin`, {
    params: { baiguullagiinId },
    headers: { "X-Org-Only": "1" },
  });
}

export async function getUliralByOrg(token: string, baiguullagiinId: string) {
  return uilchilgee(token).get(`/tailan/uliral`, {
    params: { baiguullagiinId },
    headers: { "X-Org-Only": "1" },
  });
}
