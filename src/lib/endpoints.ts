// Central place to adjust backend endpoints if routers are mounted under a prefix
// By default, the backend exposes "/dans" at the root. If your server mounts the router under
// a different path (e.g. "/tokhirgoo/dans" or "/api/dans"), update this constant accordingly.
export const DANS_ENDPOINT = "/dans";
