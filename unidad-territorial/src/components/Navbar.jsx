import { useEffect, useRef, useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { FaUserCircle } from "react-icons/fa";
import "./Navbar.css";

/** 🔹 Lee el usuario guardado en localStorage */
function leerUsuarioSesion() {
  try {
    const raw = localStorage.getItem("usuario") || sessionStorage.getItem("usuario");
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/** 🔹 Obtiene el nombre visible */
function obtenerNombreVisible(usuario) {
  if (!usuario) return "";
  return (
    usuario.nombre?.toString() ||
    usuario.Nombre_Usuario?.toString() ||
    usuario.name?.toString() ||
    ""
  );
}

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [usuario, setUsuario] = useState(null);
  const panelRef = useRef(null);
  const btnRef = useRef(null);
  const { pathname } = useLocation();
  const navigate = useNavigate();

  // Oculta navbar en panel administrativo/directiva
  if (pathname.startsWith("/solicitudes")) return null;

  /** 🔄 Actualiza usuario desde almacenamiento */
  const actualizarUsuario = () => setUsuario(leerUsuarioSesion());

  useEffect(() => {
    actualizarUsuario();
    setOpen(false);
  }, [pathname]);

  // Detectar cambios de pestaña o almacenamiento
  useEffect(() => {
    const onVis = () => document.visibilityState === "visible" && actualizarUsuario();
    const onStorage = () => actualizarUsuario();

    document.addEventListener("visibilitychange", onVis);
    window.addEventListener("storage", onStorage);
    return () => {
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  // Cerrar al hacer clic fuera
  useEffect(() => {
    function onClickOutside(e) {
      if (!open) return;
      if (
        panelRef.current &&
        !panelRef.current.contains(e.target) &&
        btnRef.current &&
        !btnRef.current.contains(e.target)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [open]);

  // Cerrar menú si se agranda la pantalla
  useEffect(() => {
    function onResize() {
      if (window.innerWidth >= 1024) setOpen(false);
    }
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const isLogged = !!usuario;
  const nombreVisible = obtenerNombreVisible(usuario);

  /** 🔒 Cerrar sesión */
  const handleLogout = () => {
    localStorage.clear();
    sessionStorage.clear();
    setUsuario(null);
    setOpen(false);
    navigate("/home");
  };

  /** 🌐 Links base visibles para todos */
  const baseItems = [
    { to: "/home", label: "Inicio" },
    { to: "/certificados", label: "Certificados" },
    { to: "/noticias", label: "Noticias" },
    { to: "/requerimientos", label: "Buzón Vecinal" }, // 👈 NUEVO
    { to: "/proyectos", label: "Actividades" },
  ];

  /** 👤 Links de sesión */
  const sessionItems = isLogged
    ? [
        { to: "/perfil", label: nombreVisible || "Mi perfil", isUser: true },
        { type: "button", onClick: handleLogout, label: "Cerrar sesión" },
      ]
    : [
        { to: "/register", label: "Hazte socio" },
        { to: "/login", label: "Iniciar sesión" },
      ];

  const navItems = [...baseItems, ...sessionItems];

  return (
    <header className="nav">
      <div className="nav__inner">
        {/* LOGO */}
        <NavLink to="/home" className="nav__brand" aria-label="Unidad Territorial - Inicio">
          <img
            src="/logo.png"
            alt="Unidad Territorial"
            className="nav__logo-img"
            loading="eager"
          />
          <span className="nav__title">Mirador de Volcanes IV</span>
        </NavLink>

        {/* MENÚ DESKTOP */}
        <nav className="nav__links" aria-label="Navegación principal">
          {navItems.map((item, idx) =>
            item.type === "button" ? (
              <button key={idx} className="nav__btn-logout" onClick={item.onClick}>
                {item.label}
              </button>
            ) : item.isUser ? (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  "nav__user-chip" + (isActive ? " nav__user-chip--active" : "")
                }
                title={nombreVisible}
              >
                <FaUserCircle className="nav__user-icon" />
                <span className="nav__user-text">{item.label}</span>
              </NavLink>
            ) : (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  "nav__link" + (isActive ? " nav__link--active" : "")
                }
              >
                {item.label}
              </NavLink>
            )
          )}
        </nav>

        {/* BOTÓN HAMBURGUESA */}
        <button
          ref={btnRef}
          className="nav__burger"
          onClick={() => setOpen((v) => !v)}
          aria-label="Abrir menú"
        >
          <span className="nav__burger-line" />
          <span className="nav__burger-line" />
          <span className="nav__burger-line" />
        </button>
      </div>

      {/* MENÚ MÓVIL */}
      <div
        ref={panelRef}
        className={`nav__drawer ${open ? "nav__drawer--open" : ""}`}
        role="dialog"
      >
        <nav className="nav__drawer-links">
          {navItems.map((item, idx) =>
            item.type === "button" ? (
              <button key={idx} className="nav__drawer-btn-logout" onClick={item.onClick}>
                {item.label}
              </button>
            ) : item.isUser ? (
              <NavLink
                key={item.to}
                to={item.to}
                className="nav__drawer-user"
                onClick={() => setOpen(false)}
              >
                <FaUserCircle className="nav__user-icon" />
                <span className="nav__user-text">{item.label}</span>
              </NavLink>
            ) : (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  "nav__drawer-link" + (isActive ? " nav__drawer-link--active" : "")
                }
              >
                {item.label}
              </NavLink>
            )
          )}
        </nav>
      </div>

      {open && <div className="nav__backdrop" onClick={() => setOpen(false)} />}
    </header>
  );
}
