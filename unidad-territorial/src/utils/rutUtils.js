/**
 * Formatea un RUT con puntos y guion (ej: 12.345.678-K).
 * @param {string} input - El RUT de entrada (puede tener o no formato).
 * @returns {string} El RUT formateado.
 */
export function formatearRut(input) {
  if (!input) return "";

  // 1. Limpiar: solo números y K
  let rutLimpio = input.replace(/[^0-9kK]/g, "").toUpperCase();

  // Si no hay nada o solo un carácter, no formatear
  if (rutLimpio.length <= 1) return rutLimpio;

  // 2. Separar DV
  const cuerpo = rutLimpio.slice(0, -1);
  const dv = rutLimpio.slice(-1);

  // 3. Agregar puntos (usando expresión regular)
  const cuerpoMiles = cuerpo.replace(/\B(?=(\d{3})+(?!\d))/g, ".");

  // 4. Devolver con puntos y guion
  return `${cuerpoMiles}-${dv}`;
}

/**
 * Valida un RUT chileno
 * @param {string} rutCompleto - El RUT (idealmente ya formateado, ej: 12.345.678-K).
 * @returns {boolean} True si el RUT es válido, false si no lo es.
 */
export function validarRutChileno(rutCompleto) {
  if (!rutCompleto) return false;

  // 1. Limpiar el RUT
  let rutLimpio = rutCompleto.replace(/[^0-9kK]/g, "").toUpperCase();

  // 2. Verificar largo mínimo
  if (rutLimpio.length < 2) return false;

  // 3. Separar cuerpo y DV
  const cuerpoRut = rutLimpio.slice(0, -1);
  const dvIngresado = rutLimpio.slice(-1);

  // 4. Validar que el cuerpo sean solo números
  if (!/^\d+$/.test(cuerpoRut)) return false;

  // 5. Descartar RUTs con todos los dígitos iguales (ej. 11.111.111-1)
  if (/^(\d)\1+$/.test(cuerpoRut)) return false;

  // 6. Calcular Dígito Verificador
  let suma = 0;
  let multiplo = 2;

  // Recorrer el cuerpo del RUT de derecha a izquierda
  for (let i = cuerpoRut.length - 1; i >= 0; i--) {
    suma += parseInt(cuerpoRut.charAt(i)) * multiplo;
    multiplo = multiplo === 7 ? 2 : multiplo + 1;
  }

  // Se calcula la resta entre 11 y el resto de la suma dividida en 11
  const resultado = 11 - (suma % 11);
  let dvCalculado;

  // Casos especiales: 10 y 11
  if (resultado === 11) {
    dvCalculado = "0";
  } else if (resultado === 10) {
    dvCalculado = "K";
  } else {
    dvCalculado = resultado.toString();
  }

  // 7. Comparar el DV ingresado con el calculado
  return dvCalculado.toUpperCase() === dvIngresado.toUpperCase();
}