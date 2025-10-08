import { useState } from "react";
import "../Auth/Auth.css";

function RegisterForm() {
  {/* Variable de estado form con los campos del formulario
    y utiliza setForm para actualizarlo, guarda lo que se escribe en el input */}
  const [form, setForm] = useState({
    name: "",
    lastname: "",
    rut: "",
    birthdate:"",
    street: "",
    number: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });
  // Guarda los mensajes de error
  const [errors, setErrors] = useState({});

  // Manejo de cambios
  const handleChange = (e) => {
    // Obtiene el name y el value de la variable del formulario
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });

    // Validaciones en tiempo real
    validateField(name, value);
  };
  // Validaciones individuales por campo
  const validateField = (name, value) => {
    let errorMsg = "";

    switch (name) {
      case "name":
      case "lastname":
        if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(value))
          errorMsg = "Solo se permiten letras";
        break;

      case "street":
        if (!/^[a-zA-Z0-9áéíóúÁÉÍÓÚñÑ\s\.#-]+$/.test(value))
          errorMsg = "Formato inválido (letras, números o guiones)";
        break;

      case "number":
        if (!/^\d+$/.test(value)) errorMsg = "Solo números";
        break;

      case "phone":
        if (!/^\d{9,}$/.test(value))
          errorMsg = "Debe tener al menos 9 dígitos numéricos";
        break;
      case "birthdate":
        const birth = new Date(value);
        const today = new Date();
        if (birth >= today) 
          errorMsg = "La fecha de nacimiento no puede ser futura";
        break;

      case "email":
        if (
          !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
        )
          errorMsg = "Correo electrónico no válido";
        break;

      case "password":
        if (
          !/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(value)
        )
          errorMsg =
            "Debe tener al menos 8 caracteres, una mayúscula, una minúscula y un número";
        break;

      case "confirmPassword":
        if (value !== form.password) errorMsg = "Las contraseñas no coinciden";
        break;

      case "rut":
        if (!validateRut(value)) errorMsg = "RUT inválido";
        break;

      default:
        break;
    }

    setErrors((prev) => ({ ...prev, [name]: errorMsg }));
  };

  // Validación RUT chileno
  const validateRut = (rut) => {
    if (!rut) return false;

    // Limpia el formato: elimina puntos y guion, pasa a mayúsculas
    const rutClean = rut.replace(/\./g, "").replace("-", "").toUpperCase();
    // Debe tener al menos 8 caracteres
    if (rutClean.length < 8) return false;
    // Separa cuerpo y dígito verificador
    const rutBody = rutClean.slice(0, -1);
    const dv = rutClean.slice(-1);
    // Cálculo del dígito verificador esperado
    let suma = 0;
    let multiplicador = 2;

    for (let i = rutBody.length - 1; i >= 0; i--) {
      suma += parseInt(rutBody[i]) * multiplicador;
      multiplicador = multiplicador === 7 ? 2 : multiplicador + 1;
    }

    const dvEsperado = 11 - (suma % 11);
    let dvFinal = dvEsperado === 11 ? "0" : dvEsperado === 10 ? "K" : dvEsperado.toString();

    return dvFinal === dv;
  };

  // --- Limpieza y separación del RUT ---
const parseRut = (rut) => {
  if (!rut) return null;

  // Elimina puntos, pasa a mayúsculas y asegura formato
  const rutClean = rut.replace(/\./g, "").toUpperCase();

  // Separa cuerpo y dígito verificador (mantiene el guion si lo tenía)
  const [body, dv] = rutClean.split("-");

  // Si no tiene guion, lo extrae manualmente
  const rutBody = body || rutClean.slice(0, -1);
  const rutDv = dv || rutClean.slice(-1);

  // Devuelve objeto con datos útiles
  return {
    rutBody: rutBody,
    dv: rutDv,
    rutLimpio: `${rutBody}-${rutDv}`
  };
};


  // Enviar formulario
  const handleSubmit = (e) => {
    e.preventDefault();

    // Valida todo antes de enviar
    Object.entries(form).forEach(([name, value]) => validateField(name, value));

    // Verifica si hay errores
    if (Object.values(errors).some((err) => err)) {
      alert("Por favor corrige los errores antes de continuar.");
      return;
    }

    console.log("✅ Datos válidos enviados:", form);
  };


  return (
    <div className="auth-container">
      <form onSubmit={handleSubmit} className="auth-form">
        <div className="form-intro">
          <h2>Únete a la Comunidad</h2>
          <p>
            Regístrate como socio de nuestra Junta de Vecinos y participa en las decisiones,
            actividades y mejoras de tu comunidad.
          </p>
          <p><strong>¡Completa el formulario para crear tu cuenta!</strong></p>
        </div>

        <div className="input-row">
          {/* NOMBRE */}
          <div className="input-group">
            <label htmlFor="name">Nombres</label>
            <input
              type="text"
              name="name"
              id="name"
              placeholder="Ej: Juan José"
              value={form.name}
              onChange={handleChange}
              required
            />
            {errors.name && <small style={{ color: "red" }}>{errors.name}</small>}
          </div>
          {/* APELLIDO */}
          <div className="input-group">
            <label htmlFor="lastname">Apellidos</label>
            <input
              type="text"
              name="lastname"
              id="lastname"
              placeholder="Ej: Rodriguez Vera"
              value={form.lastname}
              onChange={handleChange}
              required
            />
            {errors.lastname && <small style={{ color: "red" }}>{errors.lastname}</small>}
          </div>
        </div>
        
        <div className="input-row">
          {/* RUT */}
          <div className="input-group">
            <label htmlFor="rut">RUT</label>
            <input
              type="text"
              name="rut"
              id="rut"
              placeholder="Ej: 12.345.678-9"
              value={form.rut}
              onChange={handleChange}
              onBlur={() => validateRut("rut",form.rut)}  // validación al salir del input
              required
            />
            {errors.rut && <small style={{ color: "red" }}>{errors.rut}</small>}
          </div>
          {/* Fecha nacimiento */}
          <div className="input-group">
            <label htmlFor="birthdate">Fecha de nacimiento</label>
            <input
              type="date"
              name="birthdate"
              id="birthdate"
              value={form.birthdate}
              onChange={handleChange}
              required
              max={new Date().toISOString().split("T")[0]} // no permite fechas futuras
            />
            {errors.birthdate && <small style={{ color: "red" }}>{errors.birthdate}</small>}
          </div>
        </div>

        {/* DIRECCIÓN: Calle y N° casa */}
        <div className="input-row">
          <div className="input-group">
            <label htmlFor="street">Calle</label>
            <input
              type="text"
              name="street"
              id="street"
              placeholder="Ej: Los Olivos"
              value={form.street}
              onChange={handleChange}
              required
            />
            {errors.street && <small style={{ color: "red" }}>{errors.street}</small>}
          </div>
          <div className="input-group">
            <label htmlFor="number">N° Casa / Dpto</label>
            <input
              type="text"
              name="number"
              id="number"
              placeholder="Ej: 123"
              value={form.number}
              onChange={handleChange}
              required
            />
            {errors.number && <small style={{ color: "red" }}>{errors.number}</small>}
          </div>
        </div>

        {/* EMAIL */}
        <div className="input-group">
          <label htmlFor="email">Correo electrónico</label>
          <input
            type="email"
            name="email"
            id="email"
            placeholder="Ej: maria@email.com"
            value={form.email}
            onChange={handleChange}
            required
          />
          {errors.email && <small style={{ color: "red" }}>{errors.email}</small>}
        </div>
        {/* TELÉFONO CELULAR */}
        <div className="input-group">
          <label htmlFor="phone">Teléfono</label>
          <input
            type="tel"
            name="phone"
            id="phone"
            placeholder="Ej: +56 9 1234 5678"
            value={form.phone}
            onChange={handleChange}
            required
          />
          {errors.phone && <small style={{ color: "red" }}>{errors.phone}</small>}
        </div>

        
        <div className="input-row">
          {/* CONTRASEÑA */}
          <div className="input-group">
            <label htmlFor="password">Contraseña</label>
            <input
              type="password"
              name="password"
              id="password"
              placeholder="********"
              value={form.password}
              onChange={handleChange}
              required
            />
            {errors.password && <small style={{ color: "red" }}>{errors.password}</small>}
          </div>
          {/* CONFIRMACIÓN DE LA CONTRASEÑA */}
          <div className="input-group">
            <label htmlFor="confirmPassword">Confirmar contraseña</label>
            <input
              type="password"
              name="confirmPassword"
              id="confirmPassword"
              placeholder="********"
              value={form.confirmPassword}
              onChange={handleChange}
              required
            />
            {errors.confirmPassword && (
              <small style={{ color: "red" }}>{errors.confirmPassword}</small>
            )}
          </div>
        </div>
        <button type="submit" className="btn-auth">Crear cuenta</button>
      </form>
    </div>
  );
}

export default RegisterForm;
