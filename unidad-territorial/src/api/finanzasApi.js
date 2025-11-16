// 1. Lee la variable de entorno base
const API_URL_BASE = import.meta.env.VITE_API_URL || "http://localhost:4010";

// 2. Define la ruta completa para este módulo
const API_FINANZAS_URL = `${API_URL_BASE}/api/finanzas`;

/**
 * 🚀 GET /api/finanzas/dashboard
 * Obtiene los totales (SaldoNeto, TotalIngresos, TotalEgresos)
 */
export const obtenerDashboard = async () => {
  // 💡 NOTA: Asumimos que esta ruta está protegida por tu middleware
  // de 'Tesorera' en el backend.
  const res = await fetch(`${API_FINANZAS_URL}/dashboard`);

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Error al cargar el dashboard");
  }
  return res.json();
};

/**
 * 🚀 GET /api/finanzas/
 * Obtiene la lista de los últimos movimientos
 */
export const obtenerMovimientos = async () => {
  const res = await fetch(API_FINANZAS_URL); // Llama a la ruta base

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Error al cargar movimientos");
  }
  return res.json();
};

/**
 * 🚀 POST /api/finanzas/
 * Crea un nuevo movimiento (Ingreso o Egreso)
 */
export const crearMovimiento = async (body) => {
  const res = await fetch(API_FINANZAS_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Error al crear movimiento");
  }
  return res.json();
};