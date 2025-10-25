import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../Auth/Auth.css";
import { FaUser, FaLock } from "react-icons/fa";

const DEBUG = true; // ponlo en false cuando ya funcione

function Login({ setUser }) {
  const [correo, setCorreo] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [error, setError] = useState("");

  // --- estado para selección de rol ---
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [rolesDisponibles, setRolesDisponibles] = useState([]);
  const [usuarioPendiente, setUsuarioPendiente] = useState(null);
  const [tokenPendiente, setTokenPendiente] = useState(null);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:4010";

  const normalizarUsuario = (u = {}) => {
    const nombre =
      u.nombre || u.Nombre_Usuario || u.name || u.fullName || u.username || "";

    const tipoBase = (u.tipo_usuario || u.Tipo_Usuario || "").toUpperCase();
    const rolesRaw = u.Roles || u.roles || [];
    const roles =
      Array.isArray(rolesRaw)
        ? rolesRaw.map((r) => String(r).toUpperCase())
        : (tipoBase ? [tipoBase] : []);

    const cargo = u.cargo || u.Cargo || "";
    const correoNorm = u.correo || u.Correo || u.email || "";

    const tipoDerivado =
      roles.includes("ADMIN")
        ? "ADMIN"
        : roles.includes("DIRECTIVA")
        ? "DIRECTIVA"
        : roles.includes("SOCIO")
        ? "SOCIO"
        : "";

    return {
      ...u,
      nombre,
      correo: correoNorm,
      tipo_usuario: tipoBase || tipoDerivado,
      roles,
      cargo,
    };
  };

  const redirigirSegunRol = (rol) => {
    const r = (rol || "").toUpperCase();
    if (r === "ADMIN" || r === "DIRECTIVA") navigate("/solicitudes");
    else navigate("/home");
  };

  // ✅ Nueva versión más tolerante
  const parseResponse = async (res) => {
    try {
      return await res.clone().json();
    } catch {
      const text = await res.text();
      return { _rawText: text };
    }
  };

  const abrirModalSeleccion = ({ usuario, roles, token }) => {
    const rolesNorm = [...new Set(roles.map((r) => String(r).toUpperCase()))];
    setUsuarioPendiente(usuario);
    setRolesDisponibles(rolesNorm);
    setTokenPendiente(token || null);
    setShowRoleModal(true);
  };

  const cerrarModalSeleccion = () => {
    setShowRoleModal(false);
    setRolesDisponibles([]);
    setUsuarioPendiente(null);
    setTokenPendiente(null);
  };

  const persistirYRedirigir = (usuario, token, rolActivo) => {
    try {
      if (token) localStorage.setItem("token", token);
      localStorage.setItem("usuario", JSON.stringify(usuario));
      if (rolActivo) localStorage.setItem("rolActivo", rolActivo);
      if (typeof setUser === "function") setUser(usuario);
      redirigirSegunRol(rolActivo || usuario.tipo_usuario);
    } catch (e) {
      console.error("[LOGIN] Persistencia falló:", e);
    }
  };

  const handleElegirRol = async (rolElegido) => {
    const rol = String(rolElegido || "").toUpperCase();
    if (!rolesDisponibles.includes(rol)) {
      setError("Rol no válido.");
      return;
    }

    try {
      const url = `${API_BASE}/api/auth/choose-role`;
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: tokenPendiente ? `Bearer ${tokenPendiente}` : undefined,
        },
        body: JSON.stringify({
          usuarioId: usuarioPendiente?.id || usuarioPendiente?.ID_Usuario,
          rolElegido: rol,
        }),
      });

      if (res.ok) {
        const data = await parseResponse(res);
        const tokenFinal = data.token || tokenPendiente || "DEV_TOKEN";
        const usuarioFinal = {
          ...(usuarioPendiente || {}),
          rol,
          tipo_usuario: rol,
        };
        cerrarModalSeleccion();
        persistirYRedirigir(usuarioFinal, tokenFinal, rol);
        return;
      }
    } catch (e) {
      if (DEBUG) console.warn("[CHOOSE ROLE] no disponible, uso cliente:", e);
    }

    const tokenFinal = tokenPendiente || "DEV_TOKEN";
    const usuarioFinal = {
      ...(usuarioPendiente || {}),
      rol,
      tipo_usuario: rol,
      roles: rolesDisponibles,
    };
    cerrarModalSeleccion();
    persistirYRedirigir(usuarioFinal, tokenFinal, rol);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const payload = { correo, contrasena };
    setLoading(true);

    try {
      const url = `${API_BASE}/api/auth/login`;
      if (DEBUG) console.log("[LOGIN] POST", url, payload);

      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await parseResponse(res);
      if (DEBUG) console.log("[LOGIN] RES", res.status, data);

      if (!res.ok) {
        const msg =
          data.message || data.error || data._rawText || `Error ${res.status}`;
        setError(msg);
        return;
      }

      const token = data.token || data.accessToken || null;
      const usuarioSrv = data.usuario || data.user || {};
      const usuario = normalizarUsuario(usuarioSrv);

      // soporta string tipo "DIRECTIVA,SOCIO"
      const rolesRaw = Array.isArray(data.roles)
        ? data.roles
        : typeof data.roles === "string"
        ? data.roles.split(",")
        : usuario.roles;
      const roles =
        Array.isArray(rolesRaw) && rolesRaw.length > 0
          ? rolesRaw.map((r) => String(r).trim().toUpperCase())
          : usuario.tipo_usuario
          ? [usuario.tipo_usuario]
          : [];

      const needsRoleSelection =
        Boolean(data.needsRoleSelection) || roles.length > 1;

      if (needsRoleSelection) {
        const userMin = {
          id:
            usuario.id ||
            usuario.ID_Usuario ||
            usuarioSrv.ID_Usuario ||
            usuarioSrv.id,
          nombre:
            usuario.nombre ||
            usuarioSrv.Nombre_Usuario ||
            usuarioSrv.nombre,
          correo:
            usuario.correo || usuarioSrv.Correo || usuarioSrv.correo,
          roles: roles.map((r) => String(r).toUpperCase()),
        };
        abrirModalSeleccion({ usuario: userMin, roles, token });
        return;
      }

      const rolActivo = (roles[0] || usuario.tipo_usuario || "").toUpperCase();
      const usuarioFinal = {
        ...usuario,
        rol: rolActivo,
        tipo_usuario: rolActivo,
        roles: roles.map((r) => String(r).toUpperCase()),
      };

      persistirYRedirigir(usuarioFinal, token || "DEV_TOKEN", rolActivo);
    } catch (err) {
      if (DEBUG) console.error("[LOGIN] ERR", err);
      setError("Error de conexión con el servidor");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>Iniciar sesión</h2>
        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <FaUser className="input-icon" />
            <input
              type="email"
              placeholder="Correo electrónico"
              value={correo}
              onChange={(e) => setCorreo(e.target.value)}
              autoComplete="username"
              required
            />
          </div>

          <div className="input-group">
            <FaLock className="input-icon" />
            <input
              type="password"
              placeholder="Contraseña"
              value={contrasena}
              onChange={(e) => setContrasena(e.target.value)}
              autoComplete="current-password"
              required
            />
          </div>

          {error && <p className="error-text">{error}</p>}

          <button type="submit" className="btn-auth" disabled={loading}>
            {loading ? "Ingresando..." : "Ingresar"}
          </button>
        </form>

        <p className="register-text">
          ¿No tienes cuenta? <a href="/register">Hazte socio</a>
        </p>
      </div>

      {/* MODAL DE SELECCIÓN DE ROL */}
      {showRoleModal && (
        <div
          className="modal-overlay"
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,.5)",
            display: "grid",
            placeItems: "center",
            zIndex: 9999,
          }}
        >
          <div
            className="modal-card"
            style={{
              background: "#fff",
              borderRadius: 12,
              padding: 20,
              width: "min(92vw, 420px)",
              boxShadow: "0 10px 30px rgba(0,0,0,.2)",
            }}
          >
            <h3 style={{ margin: "0 0 8px" }}>Elegir rol</h3>
            <p style={{ margin: "0 0 14px", color: "#555" }}>
              Este usuario tiene más de un rol. ¿Cómo deseas ingresar?
            </p>

            <div
              className="modal-grid"
              style={{
                display: "grid",
                gap: 10,
                gridTemplateColumns: "1fr",
              }}
            >
              {rolesDisponibles.map((r) => (
                <button
                  key={r}
                  className="btn-auth"
                  style={{ width: "100%" }}
                  onClick={() => handleElegirRol(r)}
                >
                  {r === "DIRECTIVA"
                    ? "Ingresar como Directiva"
                    : r === "SOCIO"
                    ? "Ingresar como Socio"
                    : r === "ADMIN"
                    ? "Ingresar como Administrador"
                    : `Ingresar como ${r}`}
                </button>
              ))}
            </div>

            <button
              className="btn-auth"
              style={{
                marginTop: 10,
                width: "100%",
                background: "#e5e7eb",
                color: "#111827",
              }}
              onClick={cerrarModalSeleccion}
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Login;
