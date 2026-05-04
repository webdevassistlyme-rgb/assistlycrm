const backendPort = "4000";
const serverHost = "76.13.185.238";

function getBackendOrigin() {
  if (typeof window === "undefined") {
    return `http://127.0.0.1:${backendPort}`;
  }

  const { protocol, hostname } = window.location;
  const isLocal = hostname === "localhost" || hostname === "127.0.0.1";
  const backendHost = isLocal ? hostname : serverHost;

  return `${protocol}//${backendHost}:${backendPort}`;
}

export const backendOrigin = getBackendOrigin();
