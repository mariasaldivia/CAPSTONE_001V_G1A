// src/api/certificados.js
const BASE = import.meta.env.VITE_API_BASE || "http://localhost:4010";
const HDRS = { "Content-Type": "application/json" };

async function jsonOrThrow(res) {
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data?.ok === false) {
    const msg = data?.error || data?.mensaje || `HTTP ${res.status}`;
    throw new Error(msg);
  }
  return data?.data ?? data;
}

export const CertAPI = {
  /** 🔹 Crear solicitud desde formulario web o ingreso manual */
  async solicitarDesdeWeb(payload) {
    const r = await fetch(`${BASE}/api/certificados`, {
      method: "POST",
      headers: HDRS,
      body: JSON.stringify(payload),
    });
    return jsonOrThrow(r);
  },

  /** 🔹 Listar certificados pendientes (Directiva) */
  async listarPendientes() {
    const r = await fetch(`${BASE}/api/certificados?estado=Pendiente`);
    return jsonOrThrow(r);
  },

  /** 🔹 Historial completo (pendientes + resueltos) */
  async historial() {
    const r = await fetch(`${BASE}/api/certificados/_historial/lista/all`);
    return jsonOrThrow(r);
  },

  /** 🔹 Cambiar estado de un certificado */
  async cambiarEstado(idCert, body) {
    const r = await fetch(`${BASE}/api/certificados/${idCert}/estado`, {
      method: "PATCH",
      headers: HDRS,
      body: JSON.stringify(body),
    });
    return jsonOrThrow(r);
  },

  /** 🔹 Buscar certificado por folio (para botón “Ver”) */
  async obtenerPorFolio(folio) {
    const r = await fetch(`${BASE}/api/certificados/folio/${encodeURIComponent(folio)}`);
    return jsonOrThrow(r);
  },

  /** 🔹 Actualizar certificado (tabla principal, edita “Pendiente” por ID) */
  async actualizar(idCert, body) {
    const r = await fetch(`${BASE}/api/certificados/${idCert}`, {
      method: "PATCH",
      headers: HDRS,
      body: JSON.stringify(body),
    });
    return jsonOrThrow(r);
  },

  /** 🔹 Actualizar HISTORIAL por folio (última versión del folio) */
  async actualizarHist(folio, body) {
    const r = await fetch(`${BASE}/api/certificados/_historial/${encodeURIComponent(folio)}`, {
      method: "PATCH",
      headers: HDRS,
      body: JSON.stringify(body),
    });
    return jsonOrThrow(r);
  },

  /** 🔹 Eliminar certificado (borra historial y/o principal) */
  async eliminar(idCert) {
    const r = await fetch(`${BASE}/api/certificados/${idCert}`, {
      method: "DELETE",
    });
    return jsonOrThrow(r);
  },
};
