// 1. Lee la variable de entorno base
const API_URL_BASE = import.meta.env.VITE_API_URL || "http://localhost:4010";

// 2. Define la ruta completa para este módulo
const API_FINANZAS_URL = `${API_URL_BASE}/api/finanzas`;

/**
 * 🚀 Función genérica para hacer fetch con Token
 */
const fetchConToken = async (url, options = {}) => {
  
  // 1. 👇 ¡CORRECCIÓN AQUÍ! 👇
  // Le decimos que busque la llave 'token' que vimos en tu captura.
  const token = localStorage.getItem('token'); 

  const headers = {
    'Content-Type': 'application/json',
    ...options.headers, 
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(url, { ...options, headers });
  
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Error ${res.status}`);
  }
  return res.json();
};

/**
 * 🚀 GET /api/finanzas/dashboard
 * Obtiene los totales (SaldoNeto, TotalIngresos, TotalEgresos)
 */
export const obtenerDashboard = async () => {
  return fetchConToken(`${API_FINANZAS_URL}/dashboard`);
};

/**
 * 🚀 GET /api/finanzas/
 * Obtiene la lista de los últimos movimientos
 */
export const obtenerMovimientos = async () => {
  return fetchConToken(API_FINANZAS_URL); // Llama a la ruta base GET
};

/**
 * 🚀 POST /api/finanzas/
 * Crea un nuevo movimiento (Ingreso o Egreso)
 */
export const crearMovimiento = async (body) => {
  return fetchConToken(API_FINANZAS_URL, { // Llama a la ruta base POST
    method: 'POST',
    body: JSON.stringify(body),
  });
};