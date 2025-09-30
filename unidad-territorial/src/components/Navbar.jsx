import { useEffect, useRef, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import "./Navbar.css";

export default function Navbar() {
  // Estado para saber si el menú móvil (hamburguesa) está abierto o cerrado
  const [open, setOpen] = useState(false);

  // Referencias: sirven para detectar clics fuera del menú
  const panelRef = useRef(null);
  const btnRef = useRef(null);

  // Saber en qué página estamos (para cerrar el menú al cambiar de ruta)
  const { pathname } = useLocation();

  // Cada vez que cambiamos de página → cerrar menú móvil
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Si hacemos clic fuera del menú y el botón → cerrar menú
  useEffect(() => {
    function onClickOutside(e) {
      if (!open) return; // si ya está cerrado, no hace nada
      const tgt = e.target;
      if (
        panelRef.current && !panelRef.current.contains(tgt) &&
        btnRef.current && !btnRef.current.contains(tgt)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [open]);

  // Si ensanchamos la pantalla (desktop), se cierra el menú móvil automáticamente
  useEffect(() => {
    function onResize() { if (window.innerWidth >= 1024) setOpen(false); }
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // Lista de enlaces del menú
  const navItems = [
    { to: "/home", label: "Inicio" },
    { to: "/certificados", label: "Certificados" },
    { to: "/noticias", label: "Noticias" },
  ];

  return (
    <header className="nav">
      <div className="nav__inner">
        {/* Logo + título de la junta */}
        <NavLink to="/home" className="nav__brand" aria-label="Unidad Territorial - Inicio">
          <img
            src="/logo.png" // el logo está en la carpeta /public
            alt="Unidad Territorial"
            className="nav__logo-img"
            loading="eager"
            fetchpriority="high"
          />
          <span className="nav__title">Mirador de volcanes IV</span>
        </NavLink>

        {/* Menú para pantallas grandes (desktop) */}
        <nav className="nav__links" aria-label="Navegación principal">
          {navItems.map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                "nav__link" + (isActive ? " nav__link--active" : "")
              }
              end={to === "/"}
            >
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Botón hamburguesa (para móviles) */}
        <button
          ref={btnRef}
          className="nav__burger"
          aria-label="Abrir menú"
          aria-expanded={open}
          aria-controls="mobile-menu"
          onClick={() => setOpen((v) => !v)}
        >
          <span className="nav__burger-line" />
          <span className="nav__burger-line" />
          <span className="nav__burger-line" />
        </button>
      </div>

      {/* Panel del menú en móviles (aparece cuando presionas el botón hamburguesa) */}
      <div
        id="mobile-menu"
        ref={panelRef}
        className={`nav__drawer ${open ? "nav__drawer--open" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-label="Menú"
      >
        <nav className="nav__drawer-links">
          {navItems.map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                "nav__drawer-link" + (isActive ? " nav__drawer-link--active" : "")
              }
              end={to === "/"}
            >
              {label}
            </NavLink>
          ))}
        </nav>
      </div>

      {/* Fondo oscuro detrás del menú móvil */}
      {open && <div className="nav__backdrop" onClick={() => setOpen(false)} />}
    </header>
  );
}
