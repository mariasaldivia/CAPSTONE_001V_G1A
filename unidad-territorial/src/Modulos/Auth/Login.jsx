import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../Auth/Auth.css";
import { FaUser, FaLock } from "react-icons/fa";

function Login({ setUser }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const res = await fetch("http://localhost:4000/api/login", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ username: "cecilia", password: "cecilia123" }),
});
const data = await res.json();
console.log(data);


      if (!res.ok) {
        const err = await res.json();
        setError(err.message || "Error en login");
        return;
      }

          
console.log(data);
      // Redirigir según rol
      if (data.roles.includes("ADMIN") || data.roles.includes("DIRECTIVO")) {
        navigate("/solicitudes"); // panel directiva/admin
      } else if (data.roles.includes("SOCIO")) {
        navigate("/"); // sección socios
      } else {
        navigate("/"); // cualquier otro rol
      }

    } catch (err) {
      console.error(err);
      setError("Error de conexión con el servidor");
    }
  };

  return (
      <div className="auth-container">
        <div className="auth-card">
          <h2>Inicia Sesión</h2>
          <form onSubmit={handleSubmit}>
            <div className="input-group">
              <FaUser className="input-icon" />
              <input
                type="text"
                placeholder="Usuario o correo"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>

            <div className="input-group">
              <FaLock className="input-icon" />
              <input
                type="password"
                placeholder="Contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            {error && <p className="error-text">{error}</p>}

            <button type="submit" className="btn-auth">
              Ingresar
            </button>
          </form>

          <p className="register-text">
            ¿No tienes cuenta? <a href="/register">Regístrate</a>
          </p>
        </div>
      </div>
  );
}

export default Login;