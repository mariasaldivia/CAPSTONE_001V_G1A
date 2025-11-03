// src/api/certificados.js
const BASE =
  (import.meta.env?.VITE_API_BASE && String(import.meta.env.VITE_API_BASE).replace(/\/$/, "")) ||
  "http://localhost:4010";

const JSON_HDRS = { "Content-Type": "application/json", Accept: "application/json" };
const NO_CACHE_HDRS = {
  "Cache-Control": "no-cache, no-store, must-revalidate",
  Pragma: "no-cache",
  Expires: "0",
};
const DEFAULT_TIMEOUT = 15000; // 15s

// ------------------------------
// Helpers
// ------------------------------
function url(p) {
  return `${BASE}${p.startsWith("/") ? p : `/${p}`}`;
}

// Normaliza y lanza errores legibles desde el backend
async function jsonOrThrow(res) {
  const txt = await res.text(); // crudo para capturar mensajes del backend
  let data = {};
  try {
    data = txt ? JSON.parse(txt) : {};
  } catch {
    // si no es JSON, dejamos txt como posible mensaje
  }

  if (!res.ok || data?.ok === false) {
    const msg =
      data?.error ||
      data?.mensaje ||
      (typeof data === "string" && data) ||
      txt ||
      `HTTP ${res.status}`;
    const err = new Error(msg);
    err.status = res.status;
    err.raw = txt;
    throw err;
  }

  // Soporta payloads { ok:true, data: ... } o JSON plano
  return data?.data ?? data;
}

// Timeout con AbortController
function fetchWithTimeout(input, init = {}, timeoutMs = DEFAULT_TIMEOUT) {
  const ctrl = new AbortController();
  const id = setTimeout(() => ctrl.abort(), timeoutMs);
  const merged = { ...init, signal: ctrl.signal };
  return fetch(input, merged).finally(() => clearTimeout(id));
}

// Wrapper de request con opciones comunes
async function request(
  path,
  {
    method = "GET",
    headers = {},
    body,
    timeoutMs = DEFAULT_TIMEOUT,
    noCache = false,
    useForm = false, // true para FormData (no enviar JSON_HDRS)
    credentials = "include", // incluir cookies de sesión si existieran
  } = {}
) {
  const hdrs = new Headers();

  // Cache-Control opcional
  if (noCache) {
    for (const [k, v] of Object.entries(NO_CACHE_HDRS)) hdrs.set(k, v);
  }

  // Content-Type JSON si no es form-data
  if (!useForm && method !== "GET" && method !== "HEAD") {
    for (const [k, v] of Object.entries(JSON_HDRS)) hdrs.set(k, v);
  } else {
    hdrs.set("Accept", "application/json");
  }

  // Headers personalizados del caller tienen prioridad
  for (const [k, v] of Object.entries(headers || {})) hdrs.set(k, v);

  const init = { method, headers: hdrs, credentials };

  if (body !== undefined) init.body = useForm ? body : JSON.stringify(body);

  // Rompe caches intermedios en GET con noCache agregando query _ts
  const finalPath =
    noCache && (method === "GET" || method === "HEAD")
      ? `${path}${path.includes("?") ? "&" : "?"}_ts=${Date.now()}`
      : path;

  const res = await fetchWithTimeout(url(finalPath), init, timeoutMs);
  return jsonOrThrow(res);
}

// ------------------------------
// API pública
// ------------------------------
export const CertAPI = {
  /** 🔹 Crear solicitud desde formulario web o ingreso manual */
  async solicitarDesdeWeb(payload) {
    return request("/api/certificados", {
      method: "POST",
      body: payload,
    });
  },

  /** 🔹 Subir comprobante (archivo) para un certificado recién creado */
  async subirComprobante(idCert, file) {
    const fd = new FormData();
    fd.append("file", file); // el backend espera el campo "file"

    return request(`/api/certificados/${idCert}/comprobante`, {
      method: "POST",
      useForm: true, // ⚠️ NO pongas Content-Type manual
      body: fd,
    });
  },

  /** 🔹 Listar certificados pendientes (Directiva) */
  async listarPendientes() {
    return request("/api/certificados?estado=Pendiente", { noCache: true });
  },

  /** 🔹 Historial completo (pendientes + resueltos) */
  async historial() {
    return request("/api/certificados/_historial/lista/all", { noCache: true });
  },

  /** 🔹 Cambiar estado de un certificado */
  async cambiarEstado(idCert, body) {
    return request(`/api/certificados/${idCert}/estado`, {
      method: "PATCH",
      body,
    });
  },

  /** 🔹 Buscar certificado por folio (para botón “Ver”) */
  async obtenerPorFolio(folio) {
    return request(`/api/certificados/folio/${encodeURIComponent(folio)}`, {
      noCache: true,
    });
  },

  /** 🔹 Actualizar certificado (tabla principal, edita “Pendiente” por ID) */
  async actualizar(idCert, body) {
    return request(`/api/certificados/${idCert}`, {
      method: "PATCH",
      body,
    });
  },

  /** 🔹 Actualizar HISTORIAL por folio (última versión del folio) */
  async actualizarHist(folio, body) {
    return request(`/api/certificados/_historial/${encodeURIComponent(folio)}`, {
      method: "PATCH",
      body,
    });
  },

  /** 🔹 Eliminar por ID (cuando tienes ID_Cert) */
  async eliminar(idCert) {
    return request(`/api/certificados/${idCert}`, { method: "DELETE" });
  },

  /** 🔹 Eliminar por FOLIO (borra historial y principal) */
  async eliminarPorFolio(folio) {
    return request(`/api/certificados/folio/${encodeURIComponent(folio)}`, {
      method: "DELETE",
    });
  },

  /**
   * 🔹 Eliminar por FOLIO con fallback por ID
   * - 1) Intenta DELETE /folio/:folio
   * - 2) Si falla, hace GET /folio/:folio, toma ID_Cert y elimina por ID
   * - 3) Reintenta con noCache para evitar respuestas cacheadas
   */
  async eliminarSeguro(folio) {
    try {
      // intento directo por folio
      return await request(`/api/certificados/folio/${encodeURIComponent(folio)}`, {
        method: "DELETE",
      });
    } catch (e1) {
      // fallback: obtener ID_Cert (sin cache) y borrar por ID
      const det = await request(`/api/certificados/folio/${encodeURIComponent(folio)}`, {
        noCache: true,
      });
      const id = det?.ID_Cert;
      if (!id) {
        // si no hay ID, reintenta delete por folio con noCache
        return await request(`/api/certificados/folio/${encodeURIComponent(folio)}`, {
          method: "DELETE",
          noCache: true,
        });
      }
      // elimina por ID
      return await request(`/api/certificados/${id}`, { method: "DELETE" });
    }
  },
};
