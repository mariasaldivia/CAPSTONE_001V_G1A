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
            src="/logo.png" // el logo se carga directo desde /public
            alt="Unidad Territorial"
            className="ft__logo"
          />
          <div>
            <strong className="ft__brand-name"></strong>
            <div className="ft__brand-sub">
              
            </div>
          </div>
        </div>

        {/* Columna 1: Nuestra Sede Social */}
        <div className="ft__col">
          <h4 className="ft__title">Nuestra Sede Social</h4>
          <p className="ft__text">
            Visita nuestra sede en:
            <br />
            <strong>Lily Garafulic Yancovic 1787</strong>
          </p>
          <a
            className="ft__link"
            href="https://maps.app.goo.gl/teHcy9VLQYvRVCan7"
            target="_blank"
            rel="noreferrer"
          >
            Ver en Google Maps
          </a>
        </div>

        {/* Columna 2: Contacto */}
        <div className="ft__col">
          <h4 className="ft__title">Contáctanos</h4>
          <ul className="ft__list">
            <li>
              📧{" "}
              <a href="mailto:juntadevecinosvolcanescuatro@gmail.com" className="ft__link">
                juntadevecinosvolcanescuatro@gmail.com
              </a>
            </li>
            <li>📞 +56 9 66931546</li>
          </ul>
        </div>

        {/* Columna 3: Quiénes Somos */}
        <div className="ft__col">
          {/* Redes sociales */}
 
            <h4 className="ft__title">Siguenos en Instagram </h4>
            <a
              href="https://www.instagram.com/mirador.volcanesiv?igsh=MXBnbXZ3czNrbDduaw==" 
              target="_blank"
              rel="noreferrer"
            >
              <img
                src="/instagram.png" // el ícono debe estar en /public/instagram.png
                alt="Instagram"
                className="ft__icon"
              />
                        
            </a>
            <p className="ft__text">como mirador.volcanesiv</p>
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
