import uilchilgee from "@/lib/uilchilgee";

// Aligned with backend tailanRoute.js
export async function postSummary(token: string, body: any) {
  // Use /tailan/orlogo-avlaga as a general summary endpoint
  return uilchilgee(token).post(`/tailan/orlogo-avlaga`, body);
}

export async function getSummaryByOrg(token: string, baiguullagiinId: string) {
  return uilchilgee(token).get(`/tailan/orlogo-avlaga`, {
    params: { baiguullagiinId },
    headers: { "X-Org-Only": "1" },
  });
}

export async function postAvlaga(token: string, body: any) {
  return uilchilgee(token).post(`/tailan/orlogo-avlaga`, body);
}

export async function postGuilegee(token: string, body: any) {
  // Map to /bankniiGuilgee CRUD endpoint for transaction history
  return uilchilgee(token).get(`/bankniiGuilgee`, { params: body });
}

export async function postOrlogoZarlaga(token: string, body: any) {
  return uilchilgee(token).post(`/tailan/orlogo-avlaga`, body);
}

export async function postAshigAldagdal(token: string, body: any) {
  return uilchilgee(token).post(`/tailan/guitsetgel`, body);
}

export async function postSariin(token: string, body: any) {
  return uilchilgee(token).post(`/tailan/sariin-tulbur`, body);
}

export async function postUliral(token: string, body: any) {
  return uilchilgee(token).post(`/tailan/sariin-tulbur`, { ...body, turul: "uliral" });
}

export async function postExport(token: string, body: any) {
  return uilchilgee(token).post(`/tailan/export`, body, {
    responseType: "blob",
  });
}

// Org-only GET helpers
export async function getAvlagaByOrg(token: string, baiguullagiinId: string) {
  return uilchilgee(token).get(`/tailan/orlogo-avlaga`, {
    params: { baiguullagiinId },
    headers: { "X-Org-Only": "1" },
  });
}

export async function getGuilegeeByOrg(token: string, baiguullagiinId: string) {
  return uilchilgee(token).get(`/bankniiGuilgee`, {
    params: { baiguullagiinId },
    headers: { "X-Org-Only": "1" },
  });
}

export async function getOrlogoZarlagaByOrg(
  token: string,
  baiguullagiinId: string
) {
  return uilchilgee(token).get(`/tailan/orlogo-avlaga`, {
    params: { baiguullagiinId },
    headers: { "X-Org-Only": "1" },
  });
}

export async function getAshigAldagdalByOrg(
  token: string,
  baiguullagiinId: string
) {
  return uilchilgee(token).get(`/tailan/guitsetgel`, {
    params: { baiguullagiinId },
    headers: { "X-Org-Only": "1" },
  });
}

export async function getSariinByOrg(token: string, baiguullagiinId: string) {
  return uilchilgee(token).get(`/tailan/sariin-tulbur`, {
    params: { baiguullagiinId },
    headers: { "X-Org-Only": "1" },
  });
}

export async function getUliralByOrg(token: string, baiguullagiinId: string) {
  return uilchilgee(token).get(`/tailan/sariin-tulbur`, {
    params: { baiguullagiinId, turul: "uliral" },
    headers: { "X-Org-Only": "1" },
  });
}
