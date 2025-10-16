// src/components/PanelLateralD.jsx
import { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import "./PanelLateralD.css";

export default function PanelLateralD({
  title = "Requerimientos",
  user = { nombre: "Nombre directiva", cargo: "Cargo" },
  showTopUser = false,
  children,
}) {
  const [isDesktop, setIsDesktop] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  // Sincroniza modo (desktop/mobile) y estado del drawer
  useEffect(() => {
    const mql = window.matchMedia("(min-width: 1024px)");
    const sync = () => {
      const desktop = mql.matches;
      setIsDesktop(desktop);
      setMenuOpen(desktop); // desktop: abierto; móvil: cerrado
    };
    sync();
    if (mql.addEventListener) mql.addEventListener("change", sync);
    else mql.addListener(sync); // Safari antiguo

    return () => {
      if (mql.removeEventListener) mql.removeEventListener("change", sync);
      else mql.removeListener(sync);
    };
  }, []);

  const toggleMenu = () => {
    if (isDesktop) return;
    setMenuOpen((v) => !v);
  };

  const closeMenu = () => {
    if (isDesktop) return;
    setMenuOpen(false);
  };

  return (
    <div className="adm">
      {/* ===== Aside ===== */}
      <aside
        id="adm-aside"
        className={`adm__aside ${menuOpen ? "adm__aside--open" : ""}`}
        aria-hidden={!menuOpen && !isDesktop}
      >
        <div className="adm__brand">
          <img
            className="adm__brand-logo"
            src={import.meta.env.BASE_URL + "logo.png"}
            alt="Logo JVVV"
          />
          <div className="adm__brand-user">
            <div className="adm__brand-name" title={user?.nombre || ""}>
              {user?.nombre}
            </div>
            <div className="adm__brand-role" title={user?.cargo || ""}>
              {user?.cargo}
            </div>
          </div>
        </div>

        <nav className="adm__menu" onClick={closeMenu}>
          {/* ✅ Directiva: Requerimientos (ruta existente) */}
          <NavLink
            to="/solicitudes"
            end
            className={({ isActive }) =>
              "adm__item" + (isActive ? " adm__item--active" : "")
            }
          >
            Requerimientos
          </NavLink>

          {/* 👇 ejemplos estos no tienen ruta */}
          <NavLink
            to="/gestion"
            className={({ isActive }) =>
              "adm__item" + (isActive ? " adm__item--active" : "")
            }
          >
            Socios
          </NavLink>

          <NavLink
            to="/admin/pagos"
            className={({ isActive }) =>
              "adm__item" + (isActive ? " adm__item--active" : "")
            }
          >
            Pagos y Cuotas
          </NavLink>

          {/* ✅ Certificados de la Directiva tiene ruta */}
          <NavLink
            to="/directiva/certificados"
            end
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
            Proyectos Vecinales
          </NavLink>

          {/* 🔁 Ajustado para apuntar a la vista nueva */}
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

          <button type="button" className="adm__item">
            Cerrar sesión
          </button>
        </nav>
      </aside>

      {/* Backdrop móvil */}
      {!isDesktop && menuOpen && (
        <div className="adm__backdrop" onClick={closeMenu} />
      )}

      {/* ===== Top bar ===== */}
      <header className="adm__top">
        {/* Hamburguesa SOLO en móvil */}
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
            <span className="adm__user-name">{user?.nombre}</span>
            <small className="adm__user-role">{user?.cargo}</small>
          </div>
        )}
      </header>

      {/* ===== Contenido ===== */}
      <main className="adm__main">{children}</main>
    </div>
  );
}
