// src/api/certificados.js
const BASE =
  (import.meta.env?.VITE_API_BASE && String(import.meta.env.VITE_API_BASE).replace(/\/$/, "")) ||
  "http://localhost:4010";

const JSON_HDRS = { "Content-Type": "application/json" };

async function jsonOrThrow(res) {
  const txt = await res.text(); // lee texto crudo (para capturar errores del backend)
  let data = {};
  try {
    data = txt ? JSON.parse(txt) : {};
  } catch {
    // si no es JSON, lo dejamos como texto para el mensaje
  }

  if (!res.ok || data?.ok === false) {
    const msg =
      data?.error ||
      data?.mensaje ||
      (typeof data === "string" && data) ||
      txt ||
      `HTTP ${res.status}`;
    throw new Error(msg);
  }

  // si viene { ok:true, data: ... } devolvemos "data"; si no, el objeto completo
  return data?.data ?? data;
}

function url(p) {
  return `${BASE}${p.startsWith("/") ? p : `/${p}`}`;
}

export const CertAPI = {
  /** 🔹 Crear solicitud desde formulario web o ingreso manual */
  async solicitarDesdeWeb(payload) {
    const r = await fetch(url("/api/certificados"), {
      method: "POST",
      headers: JSON_HDRS,
      body: JSON.stringify(payload),
    });
    return jsonOrThrow(r);
  },

  /** 🔹 Subir comprobante (archivo) para un certificado recién creado */
  async subirComprobante(idCert, file) {
    const fd = new FormData();
    fd.append("file", file); // el backend espera el campo "file"
    const r = await fetch(url(`/api/certificados/${idCert}/comprobante`), {
      method: "POST",
      body: fd, // ⚠️ NO poner Content-Type; el navegador lo arma con boundary
    });
    return jsonOrThrow(r);
  },

  /** 🔹 Listar certificados pendientes (Directiva) */
  async listarPendientes() {
    const r = await fetch(url("/api/certificados?estado=Pendiente"));
    return jsonOrThrow(r);
  },

  /** 🔹 Historial completo (pendientes + resueltos) */
  async historial() {
    const r = await fetch(url("/api/certificados/_historial/lista/all"));
    return jsonOrThrow(r);
  },

  /** 🔹 Cambiar estado de un certificado */
  async cambiarEstado(idCert, body) {
    const r = await fetch(url(`/api/certificados/${idCert}/estado`), {
      method: "PATCH",
      headers: JSON_HDRS,
      body: JSON.stringify(body),
    });
    return jsonOrThrow(r);
  },

  /** 🔹 Buscar certificado por folio (para botón “Ver”) */
  async obtenerPorFolio(folio) {
    const r = await fetch(url(`/api/certificados/folio/${encodeURIComponent(folio)}`));
    return jsonOrThrow(r);
  },

  /** 🔹 Actualizar certificado (tabla principal, edita “Pendiente” por ID) */
  async actualizar(idCert, body) {
    const r = await fetch(url(`/api/certificados/${idCert}`), {
      method: "PATCH",
      headers: JSON_HDRS,
      body: JSON.stringify(body),
    });
    return jsonOrThrow(r);
  },

  /** 🔹 Actualizar HISTORIAL por folio (última versión del folio) */
  async actualizarHist(folio, body) {
    const r = await fetch(url(`/api/certificados/_historial/${encodeURIComponent(folio)}`), {
      method: "PATCH",
      headers: JSON_HDRS,
      body: JSON.stringify(body),
    });
    return jsonOrThrow(r);
  },

  /** 🔹 Eliminar certificado (borra historial y/o principal) */
  async eliminar(idCert) {
    const r = await fetch(url(`/api/certificados/${idCert}`), {
      method: "DELETE",
    });
    return jsonOrThrow(r);
  },
};
