import uilchilgee from "lib/uilchilgee";

function buildQueryParams(body: any): string {
  const params = new URLSearchParams();
  Object.entries(body).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      if (Array.isArray(value)) {
        // Handle arrays by appending multiple values with the same key
        value.forEach((item) => {
          params.append(key, String(item));
        });
      } else if (typeof value === "object") {
        // Handle objects by JSON stringifying them
        params.append(key, JSON.stringify(value));
      } else {
        params.append(key, String(value));
      }
    }
  });
  return params.toString();
}

export async function postSummary(token: string, body: any) {
  return uilchilgee(token).get(`/tailan/summary?${buildQueryParams(body)}`);
}

export async function postAvlaga(token: string, body: any) {
  return uilchilgee(token).get(`/tailan/avlaga?${buildQueryParams(body)}`);
}

export async function postGuilegee(token: string, body: any) {
  return uilchilgee(token).get(`/tailan/guilegee?${buildQueryParams(body)}`);
}

export async function postOrlogoZarlaga(token: string, body: any) {
  return uilchilgee(token).get(
    `/tailan/orlogo-zarlaga?${buildQueryParams(body)}`
  );
}

export async function postAshigAldagdal(token: string, body: any) {
  return uilchilgee(token).get(
    `/tailan/ashig-aldagdal?${buildQueryParams(body)}`
  );
}

export async function postSariin(token: string, body: any) {
  return uilchilgee(token).get(`/tailan/sariin?${buildQueryParams(body)}`);
}

export async function postUliral(token: string, body: any) {
  return uilchilgee(token).get(`/tailan/uliral?${buildQueryParams(body)}`);
}

export async function postExport(token: string, body: any) {
  // Export still uses POST for file download
  return uilchilgee(token).post(`/tailan/export`, body, {
    responseType: "blob",
  });
}
