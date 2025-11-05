// src/api/requerimientos.js
const BASE =
  (import.meta.env?.VITE_API_BASE && String(import.meta.env.VITE_API_BASE).replace(/\/$/, "")) ||
  (import.meta.env?.VITE_API_URL && String(import.meta.env.VITE_API_URL).replace(/\/$/, "")) ||
  "http://localhost:4010";

async function okJson(resp) {
  const text = await resp.text(); // tolerante a HTML
  let data = {};
  try { data = JSON.parse(text); } catch { data = { ok: false, error: text }; }
  if (!resp.ok || data?.ok === false) throw new Error(data?.error || "API_ERROR");
  return data?.data ?? data;
}

export const ReqAPI = {
  // LISTAS
  async listarPendientes() {
    const resp = await fetch(`${BASE}/api/requerimientos?estado=Pendiente`, { credentials: "include" });
    return okJson(resp);
  },
  async historial(estado = "") {
    const qs = estado ? `?estado=${encodeURIComponent(estado)}` : "";
    const resp = await fetch(`${BASE}/api/requerimientos/_historial/lista/all${qs}`, { credentials: "include" });
    return okJson(resp);
  },

  // DETALLES
  async obtener(id) {
    const resp = await fetch(`${BASE}/api/requerimientos/${id}`, { credentials: "include" });
    return okJson(resp);
  },
  async obtenerPorFolio(folio) {
    const resp = await fetch(`${BASE}/api/requerimientos/folio/${encodeURIComponent(folio)}`, {
      credentials: "include",
    });
    return okJson(resp);
  },

  // CREAR / SUBIR
  async crear(payload, file /* File imagen opcional */) {
    const fd = new FormData();
    // Acepta front de vecinos: tipo/direccion/comentarios/socioNombre/rut_socio
    if (payload.asunto) fd.append("asunto", payload.asunto);
    if (payload.descripcion) fd.append("descripcion", payload.descripcion);
    if (payload.tipo) fd.append("tipo", payload.tipo);
    if (payload.direccion) fd.append("direccion", payload.direccion);
    if (payload.comentarios) fd.append("comentarios", payload.comentarios);

    // perfil
    if (payload.socioNombre) fd.append("socioNombre", payload.socioNombre);
    if (payload.socioRut) fd.append("socioRut", payload.socioRut);
    if (payload.rut_socio) fd.append("rut_socio", payload.rut_socio);
    if (payload.perfil_nombre) fd.append("perfil_nombre", payload.perfil_nombre);
    if (payload.perfil_rut) fd.append("perfil_rut", payload.perfil_rut);

    if (payload.email) fd.append("email", payload.email);
    if (payload.telefono) fd.append("telefono", payload.telefono);
    if (file) fd.append("imagen", file);

    const resp = await fetch(`${BASE}/api/requerimientos`, {
      method: "POST",
      body: fd,
      credentials: "include",
    });
    return okJson(resp);
  },
  async subirAdjunto(idOrFolio, file) {
    const fd = new FormData();
    fd.append("imagen", file);
    const resp = await fetch(`${BASE}/api/requerimientos/${encodeURIComponent(idOrFolio)}/adjunto`, {
      method: "POST",
      body: fd,
      credentials: "include",
    });
    return okJson(resp);
  },

  // UPDATE / ESTADO
  async actualizar(id, payload) {
    const resp = await fetch(`${BASE}/api/requerimientos/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(payload),
    });
    return okJson(resp);
  },
  async cambiarEstado(id, { estado, comentario = "", validadorNombre = null }) {
    const resp = await fetch(`${BASE}/api/requerimientos/${id}/estado`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ estado, comentario, validadorNombre }),
    });
    return okJson(resp);
  },

  // HISTORIAL EDIT
  async actualizarHist(folio, payload) {
    const resp = await fetch(`${BASE}/api/requerimientos/_historial/${encodeURIComponent(folio)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(payload),
    });
    return okJson(resp);
  },

  // ELIMINAR
  async eliminar(id) {
    const resp = await fetch(`${BASE}/api/requerimientos/${id}`, {
      method: "DELETE",
      credentials: "include",
    });
    return okJson(resp);
  },
  async eliminarPorFolio(folio) {
    const resp = await fetch(`${BASE}/api/requerimientos/folio/${encodeURIComponent(folio)}`, {
      method: "DELETE",
      credentials: "include",
    });
    return okJson(resp);
  },
};
