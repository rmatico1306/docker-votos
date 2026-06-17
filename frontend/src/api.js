const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api";

export async function getCasillas() {
  const response = await fetch(`${API_URL}/casillas/`);
  if (!response.ok) throw new Error("No se pudieron cargar las casillas");
  return response.json();
}

export async function getPartidos() {
  const response = await fetch(`${API_URL}/partidos/`);
  if (!response.ok) throw new Error("No se pudieron cargar los partidos");
  return response.json();
}

export async function getResumen() {
  const response = await fetch(`${API_URL}/resumen/`);
  if (!response.ok) throw new Error("No se pudo cargar el resumen");
  return response.json();
}

export async function getResultadosCasilla(casillaId) {
  const response = await fetch(`${API_URL}/casillas/${casillaId}/resultados/`);
  if (!response.ok) throw new Error("No se pudieron cargar los resultados");
  return response.json();
}

export async function guardarResultadosCasilla(casillaId, resultados) {
  const response = await fetch(`${API_URL}/casillas/${casillaId}/resultados/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ resultados }),
  });

  if (!response.ok) throw new Error("No se pudieron guardar los resultados");
  return response.json();
}
