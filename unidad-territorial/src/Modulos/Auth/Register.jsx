import { useState } from "react";
import "../Auth/Auth.css";
import { validarRutChileno, formatearRut } from "../../utils/rutUtils";
import { validateName, validateEmail, isOnlyNumbers,formatOnlyNumbers, validatePhone, validateStreet, validatePassword, isNotFutureDate } from "../../utils/validators";

function getFieldError(name, value, password) {
  let errorMsg = "";

  switch (name) {
    case "name":
    case "lastname":
      if (!value) errorMsg = "Este campo es requerido";
      else if (!validateName(value))
        errorMsg = "Solo se permiten letras";
      break;

    case "street":
      if (!value) errorMsg = "Este campo es requerido";
      else if (!validateStreet(value))
        errorMsg = "Formato inválido (letras, números o guiones)";
      break;

    case "number":
      if (!value) errorMsg = "Este campo es requerido";
      else if (!isOnlyNumbers(value))
        errorMsg = "Solo números";
      break;

    case "phone":
      if (!value) errorMsg = "Este campo es requerido";
      else if (!validatePhone(value))
        errorMsg = "Debe ser un número de 9 dígitos e iniciar con 9";
      break;
      
    case "birthdate":
      if (!value) errorMsg = "Este campo es requerido";
      else if (!isNotFutureDate(value))
        errorMsg = "La fecha de nacimiento no puede ser futura";
      break;

    case "email":
      if (!value) errorMsg = "Este campo es requerido";
      else if (!validateEmail(value))
        errorMsg = "Correo electrónico no válido";
      break;

    case "password":
      if (!value) errorMsg = "Este campo es requerido";
      else if (!validatePassword(value))
        errorMsg = "Debe tener 8+ caracteres, una mayúscula, una minúscula y un número";
      break;

    case "confirmPassword":
      if (!value) errorMsg = "Este campo es requerido";
      // Compara con el argumento 'password'
      else if (value !== password)
        errorMsg = "Las contraseñas no coinciden";
      break;

    case "rut":
      if (!value) errorMsg = "Este campo es requerido";
      else if (!validarRutChileno(value))
        errorMsg = "RUT inválido";
      break;

    default:
      break;
  }
  return errorMsg;
}

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

const handleChange = (e) => {
    const { name, value } = e.target;

    let finalValue = value;
    
    // Formateadores (igual que antes)
    if (name === "rut") {
      finalValue = formatearRut(value);
    } else if (name === "number" || name === "phone") {
      finalValue = formatOnlyNumbers(value);
    }
    
    // Actualiza el estado del formulario
    const newForm = { ...form, [name]: finalValue };
    setForm(newForm);

    // Valida el campo que cambió (y 'confirmPassword' si 'password' cambia)
    const error = getFieldError(name, finalValue, newForm.password);
    setErrors((prev) => ({ ...prev, [name]: error }));

    if (name === "password") {
      const confirmError = getFieldError("confirmPassword", newForm.confirmPassword, finalValue);
      setErrors((prev) => ({ ...prev, confirmPassword: confirmError }));
    }
  };
const handleSubmit = (e) => {
    e.preventDefault();

    const newErrors = {};
    let formIsValid = true;

    // 1. Recorre el formulario y valida CADA campo usando la función pura
    for (const [name, value] of Object.entries(form)) {
      const error = getFieldError(name, value, form.password);
      if (error) {
        formIsValid = false;
        newErrors[name] = error;
      }
    }

    // 2. Actualiza el estado de errores (para mostrar todos al usuario)
    setErrors(newErrors);

    // 3. Comprueba la variable LOCAL (síncrona), no el estado
    if (!formIsValid) {
      alert("Por favor corrige los errores antes de continuar.");
      return;
    }

    console.log("✅ Datos válidos enviados:", form);
  };


  return (
    <div className="auth-container">
      <form onSubmit={handleSubmit} className="auth-form" noValidate>
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
              maxLength={12}
              value={form.rut}
              onChange={handleChange}
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
            />
            {errors.street && <small style={{ color: "red" }}>{errors.street}</small>}
          </div>
          <div className="input-group">
            <label htmlFor="number">N° Casa / Dpto</label>
            <input
              type="text"
              name="number"
              id="number"
              placeholder="Ej: 1234"
              value={form.number}
              onChange={handleChange}
              maxLength={4}
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
            placeholder="Ej: 9 12345678"
            value={form.phone}
            onChange={handleChange}
            maxLength={9}
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