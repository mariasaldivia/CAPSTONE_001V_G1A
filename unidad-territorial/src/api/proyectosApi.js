//const API_URL_POSTULACIONES = "http://localhost:4010/api/postulaciones";
//const API_URL = "http://localhost:4010/api/proyectos";

// 1. Lee la variable de entorno
const API_URL_BASE = import.meta.env.VITE_API_URL || "http://localhost:4010";

// 2. Define las rutas COMPLETAS del API para ESTE archivo
const API_PROYECTOS_URL = `${API_URL_BASE}/api/proyectos`;
const API_POSTULACIONES_URL = `${API_URL_BASE}/api/postulaciones`;

export async function obtenerProyectos() {
  const res = await fetch(API_PROYECTOS_URL);
  return res.json();
}

export async function crearProyecto(data) {
  // 🟢 Paso 3: Agregamos este console.log antes del fetch
  console.log("📤 Enviando datos al backend:", data);

  const res = await fetch(API_PROYECTOS_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  // 🟡 Manejo de error si la API responde con 400/500
  if (!res.ok) {
    const txt = await res.text();
    console.error("❌ Error HTTP:", txt);
    throw new Error(`Error ${res.status}`);
  }

  return res.json();
}

export async function actualizarProyecto(id, cambios) {
  const res = await fetch(`${API_PROYECTOS_URL}/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(cambios),
  });
  if (!res.ok) throw new Error("Error al actualizar proyecto");
  return await res.json();
}

export const eliminarProyecto = async (idProyecto) => {
  const res = await fetch(`${API_PROYECTOS_URL}/${idProyecto}`, {
    method: "DELETE",
  });

  if (!res.ok) {
    throw new Error(`Error al eliminar proyecto: ${res.status}`);
  }

  return await res.json();
};

export const rechazarPostulaciones = async (idProyecto) => {
  const res = await fetch(`${API_POSTULACIONES_URL}/rechazar/${idProyecto}`, {
    method: "DELETE",
  });

  if (!res.ok) {
    throw new Error(`Error al rechazar postulaciones: ${res.status}`);
  }

  return await res.json();
};