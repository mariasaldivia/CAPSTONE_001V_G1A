// 1. Lee la variable de entorno base
const API_URL_BASE = import.meta.env.VITE_API_URL || "http://localhost:4010";

// 2. Define la ruta completa para este módulo
const API_POSTULACIONES_URL = `${API_URL_BASE}/api/postulaciones`;

export async function postularProyecto(body) {
  const res = await fetch(API_POSTULACIONES_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    // Intenta leer el mensaje de error del backend
    const errorData = await res.json().catch(() => ({ error: "Error de red" }));
    throw new Error(errorData.error || `Error ${res.status}`);
  }
  return res.json();
}

export async function obtenerPostulaciones(idProyecto) {
  const res = await fetch(`${API_POSTULACIONES_URL}/${idProyecto}`);
  return res.json();
}

export const actualizarEstadoPostulacion = async (idPostulacion, data) => {
  const res = await fetch(`${API_POSTULACIONES_URL}/${idPostulacion}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    throw new Error(`Error al actualizar postulación: ${res.status}`);
  }

  return await res.json();
};