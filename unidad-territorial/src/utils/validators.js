/*
 * utils/validators.js
 * Funciones reutilizables para validar campos de formularios.
 */
export function validateName(value) {
  if (!value) return true; // No valida si está vacío (eso lo hace 'required')
  const regex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/;
  return regex.test(value);
}

/**
 * Valida que un string sea un email con formato simple (A@B.C).
 * @param {string} email
 * @returns {boolean}
 */
export function validateEmail(email) {
  if (!email) return true;
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

/**
 * Valida que un string contenga solo números.
 * @param {string} value
 * @returns {boolean}
 */
export function isOnlyNumbers(value) {
  if (!value) return true;
  const regex = /^\d+$/;
  return regex.test(value);
}
/**
 * Formatea un string para que contenga solo números.
 * "Suprime" (elimina) cualquier carácter que no sea un dígito.
 * @param {string} input
 * @returns {string} El string con solo números.
 */
export function formatOnlyNumbers(input) {
  if (!input) return "";
  // Reemplaza cualquier cosa que NO sea un dígito (\d) por nada.
  return input.replace(/[^\d]/g, "");
}
/**
 * Valida que el teléfono tenga al menos 9 dígitos numéricos.
 * @param {string} phone
 * @returns {boolean}
 */
export function validatePhone(phone) {
  if (!phone) return true;
  const regex = /^9\d{8}$/;
  return regex.test(phone);
}

/**
 * Valida que la dirección sea alfanumérica y permita ., #, -.
 * @param {string} street
 * @returns {boolean}
 */
export function validateStreet(street) {
  if (!street) return true;
  const regex = /^[a-zA-Z0-9áéíóúÁÉÍÓÚñÑ\s\.#-]+$/;
  return regex.test(street);
}

/**
 * Valida que la contraseña tenga 8+ chars, 1 mayús, 1 minús, 1 número.
 * @param {string} password
 * @returns {boolean}
 */
export function validatePassword(password) {
  if (!password) return true;
  const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
  return regex.test(password);
}

/**
 * Valida que una fecha (string 'YYYY-MM-DD') no sea hoy ni futura.
 * @param {string} dateString
 * @returns {boolean}
 */
export function isNotFutureDate(dateString) {
  if (!dateString) return true;
  
  const birth = new Date(dateString);
  // Obtenemos la fecha de 'hoy' pero a la medianoche (para comparar solo días)
  const today = new Date();
  today.setHours(0, 0, 0, 0); 
  
  // Si la fecha de nacimiento es mayor o igual a hoy, es inválida
  return birth < today;
}