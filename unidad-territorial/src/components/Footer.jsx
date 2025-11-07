import { Link } from "react-router-dom";
// Asumiendo que usas react-icons para consistencia
import { FaLocationDot, FaPhone, FaEnvelope, FaInstagram } from "react-icons/fa6";
import "./Footer.css";

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="ft">
      <div className="ft__grid">
        {/* Marca / Logo */}
        <div className="ft__brand">
          <img
            src="/logo.png"
            alt="Junta de Vecinos Mirador de Volcanes IV"
            className="ft__logo"
          />
          <div>
            <div className="ft__brand-sub">Junta de Vecinos</div>
            <strong className="ft__brand-name">Mirador de Volcanes IV</strong>
          </div>
        </div>

        {/* Columna 1: Nuestra Sede Social */}
        <div className="ft__col">
          <h4 className="ft__title">Nuestra Sede Social</h4>
          <p className="ft__text">Visítanos y conversemos.</p>
          <a
            className="ft__link ft__link--with-icon" // Clase unificada
            href="https://maps.app.goo.gl/teHcy9VLQYvRVCan7"
            target="_blank"
            rel="noreferrer"
          >
            <FaLocationDot className="ft__icon" />
            <strong>Lily Garafulic Yancovic 1787</strong>
          </a>
        </div>

        {/* Columna 2: Contacto */}
        <div className="ft__col">
          <h4 className="ft__title">Contáctanos</h4>
          {/* Usamos una 'list' para mejor semántica */}
          <ul className="ft__list">
            <li>
              <a href="mailto:juntadevecinosvolcanescuatro@gmail.com" className="ft__link ft__link--with-icon">
                <FaEnvelope className="ft__icon" />
                <span>juntadevecinosvolcanescuatro@gmail.com</span>
              </a>
            </li>
            {/* 📞 MEJORA UX: Teléfono clicable */}
            <li>
              <a href="tel:+56966931546" className="ft__link ft__link--with-icon">
                <FaPhone className="ft__icon" />
                <span>+56 9 66931546</span>
              </a>
            </li>
          </ul>
        </div>

        {/* Columna 3: Redes Sociales */}
        <div className="ft__col">
          <h4 className="ft__title">Síguenos</h4>
          <p className="ft__text">Mantente al tanto de las novedades.</p>
          
          <div className="ft__social-icons">
            {/* 🎨 MEJORA CONSISTENCIA: Usando ícono */}
            <a
              href="https://www.instagram.com/mirador.volcanesiv?igsh=MXBnbXZ3czNrbDduaw=="
              target="_blank"
              rel="noreferrer"
              aria-label="Instagram de Mirador de Volcanes IV"
              className="ft__link ft__link--with-icon" // Clase unificada
            >
              <FaInstagram className="ft__icon" />
              <span>@mirador.volcanesiv</span>
            </a>
          </div>
        </div>
      </div>

      {/* Pie inferior */}
      <div className="ft__bottom">
        <span>© {year} Mirador de Volcanes IV - Todos los derechos reservados</span>
        <nav className="ft__legal">
          <Link to="/terminos" className="ft__link">Términos</Link>
          <Link to="/privacidad" className="ft__link">Privacidad</Link>
        </nav>
      </div>
    </footer>
  );
}