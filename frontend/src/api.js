const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api";

function getAuthHeaders() {
  const token = window.localStorage.getItem("authToken");

  return token ? { Authorization: `Token ${token}` } : {};
}

async function requestJson(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: {
      ...getAuthHeaders(),
      ...options.headers,
    },
  });

  if (response.status === 401 || response.status === 403) {
    window.localStorage.removeItem("authToken");
    throw new Error("Tu sesion expiro. Inicia sesion nuevamente.");
  }

  return response;
}

export async function login(username, password) {
  const response = await fetch(`${API_URL}/auth/login/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ username, password }),
  });

  if (!response.ok) throw new Error("Usuario o contrasena incorrectos");

  const data = await response.json();
  window.localStorage.setItem("authToken", data.token);
  return data;
}

export function logout() {
  window.localStorage.removeItem("authToken");
}

export function isAuthenticated() {
  return Boolean(window.localStorage.getItem("authToken"));
}

export async function getCasillas() {
  const response = await requestJson(`${API_URL}/casillas/`);
  if (!response.ok) throw new Error("No se pudieron cargar las casillas");
  return response.json();
}

export async function getPartidos() {
  const response = await requestJson(`${API_URL}/partidos/`);
  if (!response.ok) throw new Error("No se pudieron cargar los partidos");
  return response.json();
}

export async function getResumen() {
  const response = await requestJson(`${API_URL}/resumen/`);
  if (!response.ok) throw new Error("No se pudo cargar el resumen");
  return response.json();
}

export async function getResultadosCasilla(casillaId) {
  const response = await requestJson(`${API_URL}/casillas/${casillaId}/resultados/`);
  if (!response.ok) throw new Error("No se pudieron cargar los resultados");
  return response.json();
}

export async function guardarResultadosCasilla(casillaId, resultados) {
  const response = await requestJson(`${API_URL}/casillas/${casillaId}/resultados/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ resultados }),
  });

  if (!response.ok) throw new Error("No se pudieron guardar los resultados");
  return response.json();
}
