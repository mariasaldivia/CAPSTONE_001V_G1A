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
            <strong>Paseo Bulnes 209, Dpto. 34</strong>
          </p>
          <a
            className="ft__link"
            href="https://maps.google.com/?q=Paseo+Bulnes+209+Santiago+Chile"
            target="_blank"
            rel="noreferrer"
          >
            Ver en Google Maps
          </a>
        </div>

        {/* Columna 2: Contacto */}
        <div className="ft__col">
          <h4 className="ft__title">Contacto</h4>
          <ul className="ft__list">
            <li>
              📧{" "}
              <a href="mailto:contacto@miradorvolcanes.cl" className="ft__link">
                contacto@miradorvolcanes.cl
              </a>
            </li>
            <li>📞 +56 9 0000 0000</li>
          </ul>

          {/* Redes sociales */}
          <div className="ft__social">
            <a
              href="https://instagram.com/tu_cuenta" // 👉 cambia por tu Instagram real
              target="_blank"
              rel="noreferrer"
            >
              <img
                src="/instagram.png" // el ícono debe estar en /public/instagram.png
                alt="Instagram"
                className="ft__icon"
              />
            </a>
          </div>
        </div>

        {/* Columna 3: Quiénes Somos */}
        <div className="ft__col">
          <h4 className="ft__title">Quiénes Somos</h4>
          <p className="ft__text">
           
          </p>
          <Link to="/home#nosotros" className="ft__link">
            
          </Link>
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
