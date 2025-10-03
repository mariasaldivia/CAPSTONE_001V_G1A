import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../Auth/Auth.css";
import { FaUser, FaLock } from "react-icons/fa";
//Usuarios falsos para probar rutas
const fakeUsers = [
  { username: "admin", password: "1234", role: "directiva" },
  { username: "vecino", password: "abcd", role: "vecino" },
];

function Login({ setUser }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = (e) => {
      e.preventDefault();

      const found = fakeUsers.find(
        (u) => u.username === username && u.password === password
      );

      if (!found) {
        setError("Usuario o contraseña incorrectos");
        return;
      }

      // Guardamos usuario (sin contraseña)
      const userData = { username: found.username, role: found.role };
      setUser(userData);

      // Redirigir según rol
      if (found.role === "directiva") navigate("/dashboard");
      else navigate("/");
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

          <div className="demo-credentials">
            <strong>Credenciales de prueba:</strong>
            <div>Directiva → <code>admin / 1234</code></div>
            <div>Vecino → <code>vecino / abcd</code></div>
          </div>

          <p className="register-text">
            ¿No tienes cuenta? <a href="/register">Regístrate</a>
          </p>
        </div>
      </div>
  );
}

export default Login;