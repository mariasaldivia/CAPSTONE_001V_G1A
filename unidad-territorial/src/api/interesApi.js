// 1. Lee la variable de entorno base
const API_URL_BASE = import.meta.env.VITE_API_URL || "http://localhost:4010";

// 2. Define la ruta completa para este módulo
const API_INTERES_URL = `${API_URL_BASE}/api/interes`;

export async function registrarInteres(body) {
  const res = await fetch(API_INTERES_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    // Intenta leer el mensaje de error específico del backend
    const errorData = await res.json().catch(() => ({ 
      error: "Error al conectar con la API" 
    }));
    
    // Lanza un error para que el 'catch' del componente lo atrape
    throw new Error(errorData.error || `Error ${res.status}`);
  }

  return await res.json();
}