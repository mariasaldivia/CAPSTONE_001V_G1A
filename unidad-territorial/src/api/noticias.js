// src/api/noticias.js
const BASE = import.meta.env?.VITE_API_BASE || "http://localhost:4010";

/* =========================
   Helpers
========================= */
async function readOnce(res) {
  const raw = await res.text(); // se puede leer SOLO UNA VEZ
  let data = null;
  const ct = res.headers.get("content-type") || "";
  if (ct.includes("application/json")) {
    try { data = JSON.parse(raw); } catch { /* JSON inválido, dejo raw */ }
  }
  return { ok: res.ok, status: res.status, data, raw };
}

const toAbs = (url) => {
  if (!url) return url;
  if (/^https?:\/\//i.test(url)) return url;
  if (url.startsWith("/")) return `${BASE}${url}`;
  return `${BASE}/${url}`;
};

// Normaliza un arreglo de noticias para asegurar campos de imagen consistentes
function normalizeNewsArray(arr) {
  if (!Array.isArray(arr)) return [];
  return arr.map((n) => {
    const principal =
      toAbs(n?.imagen_principal_url) ||
      toAbs(n?.imagen_principal) ||
      null;

    // Si backend ya entrega imagenes_secundarias, la uso; si no, la armo
    const secundarias = Array.isArray(n?.imagenes_secundarias)
      ? n.imagenes_secundarias.map(toAbs).filter(Boolean)
      : [toAbs(n?.imagen_sec_1), toAbs(n?.imagen_sec_2)].filter(Boolean);

    // Dedup por URL absoluta
    const seen = new Set();
    const secundariasDedup = secundarias.filter((u) => u && !seen.has(u) && seen.add(u));

    return {
      ...n,
      imagen_principal: principal,
      imagenes_secundarias: secundariasDedup,
    };
  });
}

/* =========================
   API
========================= */
export const NoticiasAPI = {
  // Alias para compatibilidad: cualquiera de los dos nombres funciona
  async listarPublicadas() {
    const res = await fetch(`${BASE}/api/noticias/publicas`);
    const { ok, status, data, raw } = await readOnce(res);
    if (!ok) throw new Error(`HTTP ${status}: ${raw.slice(0, 200)}`);
    return normalizeNewsArray(Array.isArray(data) ? data : []);
  },

  // Alias extra (sin la “d”) por si en alguna parte del front se usa este nombre
  async listarPublicas() {
    return this.listarPublicadas();
  },

  async listarHistorial() {
    const res = await fetch(`${BASE}/api/noticias/historial`);
    const { ok, status, data, raw } = await readOnce(res);
    if (!ok) throw new Error(`HTTP ${status}: ${raw.slice(0, 200)}`);
    return normalizeNewsArray(Array.isArray(data) ? data : []);
  },

  async crear(formData) {
    const res = await fetch(`${BASE}/api/noticias`, { method: "POST", body: formData });
    const { ok, status, data, raw } = await readOnce(res);
    if (!ok) throw new Error(data?.error || `HTTP ${status}: ${raw.slice(0, 200)}`);
    return data;
  },

  async actualizar(id, formData) {
    const res = await fetch(`${BASE}/api/noticias/${id}`, { method: "PUT", body: formData });
    const { ok, status, data, raw } = await readOnce(res);
    if (!ok) throw new Error(data?.error || `HTTP ${status}: ${raw.slice(0, 200)}`);
    return data;
  },

  async cambiarEstado(id, estado) {
    const res = await fetch(`${BASE}/api/noticias/${id}/estado`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ estado }),
    });
    const { ok, status, data, raw } = await readOnce(res);
    if (!ok) throw new Error(data?.error || `HTTP ${status}: ${raw.slice(0, 200)}`);
    return data;
  },

  async eliminar(id) {
    const res = await fetch(`${BASE}/api/noticias/${id}`, { method: "DELETE" });
    const { ok, status, data, raw } = await readOnce(res);
    if (!ok) throw new Error(data?.error || `HTTP ${status}: ${raw.slice(0, 200)}`);
    return data;
  },
};
