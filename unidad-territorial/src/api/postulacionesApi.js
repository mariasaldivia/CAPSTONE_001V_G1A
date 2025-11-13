const API_URL = "http://localhost:4010/api/postulaciones";
const API_URL_POSTULACIONES = "http://localhost:4010/api/postulaciones";

export async function postularProyecto(id_socio, id_proyecto, comentario = "") {
  const res = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id_socio, id_proyecto, comentario }),
  });
  return res.json();
}

export async function obtenerPostulaciones(idProyecto) {
  const res = await fetch(`${API_URL}/${idProyecto}`);
  return res.json();
}

export const actualizarEstadoPostulacion = async (idPostulacion, nuevoEstado) => {
  const res = await fetch(`http://localhost:4010/api/postulaciones/${idPostulacion}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ Estado: nuevoEstado }),
  });

  if (!res.ok) {
    throw new Error(`Error al actualizar postulación: ${res.status}`);
  }

  return await res.json();
};