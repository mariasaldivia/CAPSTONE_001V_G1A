import { useState } from "react";
import "../Auth/Auth.css";

function Register() {
  const [form, setForm] = useState({ name: "", email: "", password: "" });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("📌 Datos de registro:", form);
    // aquí iría la llamada a la API para registrar
  };

  return (
    <div className="auth-container">
      
      <form onSubmit={handleSubmit} className="auth-form">
        <h2>Registro</h2>
        <div className="input-group">
            <input
            type="text"
            name="name"
            placeholder="Nombre completo"
            value={form.name}
            onChange={handleChange}
            required
            />
        </div>
        <div className="input-group">
            <input
            type="email"
            name="email"
            placeholder="Correo electrónico"
            value={form.email}
            onChange={handleChange}
            required
            />
        </div>
        <div className="input-group">
            <input
            type="password"
            name="password"
            placeholder="Contraseña"
            value={form.password}
            onChange={handleChange}
            required
            />
        </div>
        <button type="submit" className="btn-auth">Crear cuenta</button>
      </form>
    </div>
  );
}

export default Register;
