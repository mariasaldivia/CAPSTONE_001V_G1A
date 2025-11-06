import { Link } from "react-router-dom";
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
            <div className="ft__brand-sub">
              Junta de Vecinos
            </div>
            <strong className="ft__brand-name">Mirador de Volcanes IV</strong>

          </div>
        </div>

        {/* Columna 1: Nuestra Sede Social */}
        <div className="ft__col">
          <h4 className="ft__title">Nuestra Sede Social</h4>
          {/* Unificar texto y enlace */}
          <p className="ft__text">Visítanos y conversemos.</p>
          <a
            className="ft__link ft__address-link" // Nueva clase para estilizar
            href="https://maps.app.goo.gl/teHcy9VLQYvRVCan7" 
            target="_blank"
            rel="noreferrer"
          >
            <i className="fa-solid fa-location-dot"></i> 
            <strong>Lily Garafulic Yancovic 1787</strong>
          </a>
        </div>

        {/* Columna 2: Contacto */}
        <div className="ft__col">
          <h4 className="ft__title">Contáctanos</h4>
          <ul className="ft__list">
            <li>
              <a href="mailto:juntadevecinosvolcanescuatro@gmail.com" className="ft__link">
                juntadevecinosvolcanescuatro@gmail.com
              </a>
            </li>
            <li>📞 +56 9 66931546</li>
          </ul>
        </div>

{/* Columna 3: Redes Sociales */}
<div className="ft__col">
  <h4 className="ft__title">Síguenos</h4>
  <p className="ft__text">Mantente al tanto de todas las novedades.</p>
  
  <div className="ft__social-icons">
    {/* Usar íconos SVG/PNG pequeños o Font Awesome */}
    <a
      href="https://www.instagram.com/mirador.volcanesiv?igsh=MXBnbXZ3czNrbDduaw==" 
      target="_blank"
      rel="noreferrer"
      aria-label="Instagram de Mirador de Volcanes IV"
      className="ft__social-link" // Añadimos una clase para estilizar
    >
      <img
        src="/instagram.png"
        alt="Instagram"
        className="ft__icon"
      />
    @mirador.volcanesiv
    </a>
  </div>
</div>
   
      </div>

      {/* Pie inferior */}
      <div className="ft__bottom">
        <span>© {year} Mirador de Volcanes IV - Todos los derechos reservados</span>
        <nav className="ft__legal">
          <a href="#" className="ft__link">Términos</a>
          <a href="#" className="ft__link">Privacidad</a>
          <a href="#" className="ft__link">Soporte</a>
        </nav>
      </div>
    </footer>
  );
}
