const API_URL = "http://localhost:4010/api/interes";

export async function registrarInteres(idProyecto, idSocio) {
  const res = await fetch(`${API_URL}/${idProyecto}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ idSocio })
  });

  if (!res.ok) {
    throw new Error("Error al registrar interés");
  }

  return await res.json();
}