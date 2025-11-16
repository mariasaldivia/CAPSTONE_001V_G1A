import { useEffect, useMemo, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import "./PanelLateralD.css";

// ⚙️ Modo depuración (activar si quieres ver logs)
const DEBUG = false;

/** 🧩 Leer usuario desde almacenamiento (en español) */
function leerUsuarioSesion() {
  try {
    const raw =
      localStorage.getItem("usuario") || sessionStorage.getItem("usuario");
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/** 🧩 Convierte texto en formato "Capitalizado" */
function capitalizar(texto = "") {
  const str = texto.toString().toLowerCase().trim();
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/** 🧩 Normalizar datos del usuario (nombre + cargo en formato legible) */
function normalizarUsuario(u) {
  if (!u || typeof u !== "object") return null;

  // Nombre base
  const nombre =
    u.Nombre_Usuario?.toString() ||
    u.nombre?.toString() ||
    u.name?.toString() ||
    u.fullName?.toString() ||
    "Usuario";

  // Roles y tipo base
  const tipoBase = (u.Tipo_Usuario || u.tipo_usuario || "").toString().toUpperCase().trim();
  const roles = Array.isArray(u.Roles)
    ? u.Roles.map((r) => String(r).toUpperCase().trim())
    : tipoBase
    ? [tipoBase]
    : [];

  // Cargo (solo relevante si es DIRECTIVA)
  const cargo = (u.Cargo || u.cargo || "").toString();

  // Rol activo guardado en localStorage (si el usuario tiene varios)
  const rolLocal = (localStorage.getItem("rolActivo") || "").toUpperCase().trim();

  // Rol efectivo
  let rol = roles.includes(rolLocal)
    ? rolLocal
    : tipoBase || roles[0] || "SOCIO";

  // Etiquetas visibles
  const isAdmin = rol === "ADMIN";
  const displayName = isAdmin ? "Administrador" : capitalizar(nombre);
  const displayCargo = isAdmin
    ? "Administrador"
    : rol === "DIRECTIVA"
    ? capitalizar(cargo || "Directiva")
    : "Socio";

  return {
    ...u,
    nombre,
    tipo: tipoBase,
    roles,
    rolActivo: rol,
    cargo,
    isAdmin,
    displayName,
    displayCargo,
  };
}

export default function PanelLateralD({
  title = "Panel Directiva",
  showTopUser = false,
  children,
}) {
  const [isDesktop, setIsDesktop] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();

  // Leer usuario actual
  const sessionUser = useMemo(() => leerUsuarioSesion(), []);
  const info = useMemo(() => normalizarUsuario(sessionUser), [sessionUser]);

  useEffect(() => {
    if (DEBUG) {
      console.group("[PanelLateralD Debug]");
      console.log("Usuario sesión:", sessionUser);
      console.log("Normalizado:", info);
      console.groupEnd();
    }
  }, [sessionUser, info]);

  // Control de modo (desktop / móvil)
  useEffect(() => {
    const mql = window.matchMedia("(min-width: 1024px)");
    const sync = () => {
      const desktop = mql.matches;
      setIsDesktop(desktop);
      setMenuOpen(desktop);
    };
    sync();
    if (mql.addEventListener) mql.addEventListener("change", sync);
    else mql.addListener(sync);
    return () => {
      if (mql.removeEventListener) mql.removeEventListener("change", sync);
      else mql.removeListener(sync);
    };
  }, []);

  const toggleMenu = () => !isDesktop && setMenuOpen((v) => !v);
  const closeMenu = () => !isDesktop && setMenuOpen(false);

  /** 🚪 Cerrar sesión */
  const handleLogout = () => {
    localStorage.removeItem("usuario");
    localStorage.removeItem("token");
    localStorage.removeItem("rolActivo");
    sessionStorage.removeItem("usuario");
    if (!isDesktop) setMenuOpen(false);
    navigate("/login");
  };

  const displayName = info?.displayName || "Usuario";
  const displayCargo = info?.displayCargo || "Cargo";

  return (
    <div className="adm">
      {/* ===== Sidebar ===== */}
      <aside
        id="adm-aside"
        className={`adm__aside ${menuOpen ? "adm__aside--open" : ""}`}
        aria-hidden={!menuOpen && !isDesktop}
      >
        <div className="adm__brand">
          <img
            className="adm__brand-logo"
            src={import.meta.env.BASE_URL + "logo.png"}
            alt="Logo Junta de Vecinos"
          />
        </div>

        <div className="adm__brand-user">
          <div className="adm__brand-name" title={displayName}>
            {displayName}
          </div>
          <div className="adm__brand-role" title={displayCargo}>
            {displayCargo}
          </div>
          <hr className="adm__divider" />
        </div>

        <nav className="adm__menu" onClick={closeMenu}>
          <NavLink
            to="/solicitudes"
            end
            className={({ isActive }) =>
              "adm__item" + (isActive ? " adm__item--active" : "")
            }
          >
            Requerimientos
          </NavLink>

          <NavLink
            to="/gestion"
            className={({ isActive }) =>
              "adm__item" + (isActive ? " adm__item--active" : "")
            }
          >
            Socios
          </NavLink>

          <NavLink
            to="/directiva/finanzas"
            className={({ isActive }) =>
              "adm__item" + (isActive ? " adm__item--active" : "")
            }
          >
            Movimientos financieros
          </NavLink>

          <NavLink
            to="/directiva/certificados"
            className={({ isActive }) =>
              "adm__item" + (isActive ? " adm__item--active" : "")
            }
          >
            Certificados
          </NavLink>

          <NavLink
            to="/gestionProyectos"
            className={({ isActive }) =>
              "adm__item" + (isActive ? " adm__item--active" : "")
            }
          >
            Actividades
          </NavLink>

          <NavLink
            to="/directiva/noticias"
            className={({ isActive }) =>
              "adm__item" + (isActive ? " adm__item--active" : "")
            }
          >
            Noticias
          </NavLink>

          <div className="adm__spacer" />

          <NavLink
            to="/admin/cuenta"
            className={({ isActive }) =>
              "adm__item" + (isActive ? " adm__item--active" : "")
            }
          >
            Cuenta
          </NavLink>

          <NavLink
            to="/admin/config"
            className={({ isActive }) =>
              "adm__item" + (isActive ? " adm__item--active" : "")
            }
          >
            Configuración
          </NavLink>

          <NavLink
            to="/admin/ayuda"
            className={({ isActive }) =>
              "adm__item" + (isActive ? " adm__item--active" : "")
            }
          >
            Centro de Ayuda
          </NavLink>

          <button type="button" className="adm__item" onClick={handleLogout}>
            Cerrar sesión
          </button>
        </nav>
      </aside>

      {/* Fondo móvil */}
      {!isDesktop && menuOpen && (
        <div className="adm__backdrop" onClick={closeMenu} />
      )}

      {/* ===== Top bar ===== */}
      <header className="adm__top">
        <button
          type="button"
          className={`adm__burger ${menuOpen ? "is-open" : ""}`}
          aria-label="Abrir menú lateral"
          aria-controls="adm-aside"
          aria-expanded={menuOpen}
          onClick={toggleMenu}
        >
          <span />
          <span />
          <span />
        </button>

        <h1 className="adm__title">{title}</h1>

        {showTopUser && (
          <div className="adm__user">
            <span className="adm__user-name">{displayName}</span>
            <small className="adm__user-role">{displayCargo}</small>
          </div>
        )}
      </header>

      <main className="adm__main">{children}</main>
    </div>
  );
}
