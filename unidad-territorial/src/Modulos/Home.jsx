import React, { useState } from "react";
import HeroCarousel from "../components/HeroCaroulsel";
import "../Modulos/Home.css"

// Props { user, setUser } eliminadas porque no se usaban
function Home() {
    // Estado para controlar qué pregunta está abierta
  const [activeIndex, setActiveIndex] = useState(null);
  const [showAll, setShowAll] = useState(false);

  const toggleFAQ = (index) => {
    setActiveIndex(activeIndex === index ? null : index);
  };

  const faqs = [
    {
      question: "¿Cómo puedo hacerme socio/a?",
      answer:
        "Puedes registrarte en línea haciendo clic en el botón “Hazte socio” o acercarte directamente a nuestra sede.",
    },
    {
      question: "¿Dónde se realizan las reuniones?",
      answer:
        "Generalmente en la sede de la Junta de Vecinos, ubicada en Mirador de Volcanes IV. Publicamos los horarios en nuestras redes sociales.",
    },
    {
      question: "¿Puedo participar aunque no viva en el sector?",
      answer:
        "Nuestras actividades principales están orientadas a los vecinos del sector, pero siempre estamos abiertas a colaboraciones comunitarias.",
    },
    {
      question: "¿Cómo puedo comunicar un problema o sugerencia?",
      answer:
        "Puedes escribirnos mediante el formulario de contacto o asistir a las asambleas mensuales.",
    },
    {
      question: "¿Qué beneficios tiene ser socio/a?",
      answer:
        "Podrás participar en votaciones, acceder a actividades exclusivas y contribuir al desarrollo de nuestra comunidad.",
    },
  ];

  return (
    // Etiqueta <main> para mejor semántica
    <main>
      <HeroCarousel/>
      
      {/* Todas las 'class' han sido reemplazadas por 'className' 
      */}
      <section id="directiva">
        <div className="directiva-content">
        <h2>Mujeres Líderes, Comprometidas Contigo</h2>
        <p>Somos la voz organizada de nuestra comunidad. Acércate y conoce a las líderes que trabajan día a día por el bienestar de Mirador de Volcanes IV.</p>
          <div className="directiva-grid">

            <div className="miembro-card">
                <div className="foto-placeholder"></div>
                <h3>[Nombre y Apellido]</h3>
                <h4>Presidenta</h4>
                <p>Nos mueve la convicción de que, unidos, podemos hacer de nuestro barrio un lugar más seguro.</p>
                <a href="#contacto" className="perfil-link">Contacto directo →</a>
            </div>

            <div className="miembro-card">
                <div className="foto-placeholder"></div>
                <h3>[Nombre y Apellido]</h3>
                <h4>Secretaria</h4>
                {/* Typo corregido */}
                <p>Trabajamos para recuperar áreas verdes y fortalecer la convivencia. Foco en la vida sana.</p>
                <a href="#contacto" className="perfil-link">Contacto directo →</a>
            </div>

            <div className="miembro-card">
                <div className="foto-placeholder" ></div>
                <h3>[Nombre y Apellido]</h3>
                <h4>Tesorera</h4>
                <p>Gestionando soluciones y promoviendo espacios de seguridad e integración para nuestras familias.</p>
                <a href="#contacto" className="perfil-link">Contacto directo →</a>
            </div>
            
            <div className="miembro-card cta-card">
                <p className="cta-message">¿Quieres sumarte a nuestro equipo?</p>
                <h3 className="cta-message">¡Sé parte del cambio!</h3>
                <a href="/register" className="cta-button-directiva">Hazte socio</a>
            </div>
          </div>
        </div>
      </section>

      <section id="aboutUs" >
        <h2>Nuestra identidad organizacional</h2>
        <div className="feature-grid">
          <div className="feature-item">
            <h3>Misión</h3>
              <p>Trabajamos con compromiso para mejorar nuestro entorno. Impulsamos la participación comunitaria, gestionamos soluciones junto a las autoridades y promovemos espacios de seguridad, integración, recreación y salud, siempre con el foco en el desarrollo integral de nuestra comunidad.</p>
          </div>
          <div className="feature-item">
            <h3>¿Quiénes somos?</h3>
            <p>
              Somos la directiva de la Junta de Vecinos Mirador de Volcanes IV, mujeres comprometidas y organizadas por el bienestar de nuestra comunidad. Nos mueve la convicción de que, unidos, podemos hacer de nuestro barrio un lugar más seguro, con mejores espacios para vivir, compartir y crecer.
              Trabajamos para recuperar nuestras áreas verdes, fortalecer la convivencia y fomentar la vida sana , especialmente para nuestros niños. Somos la voz organizada de nuestra comunidad buscando junto a las autoridades hacer de Mirador de Volcanes IV un mejor lugar para vivir.
            </p>
          </div>
          <div className="feature-item">
            <h3>Visión</h3>
            <p>
              Ser una comunidad de mujeres líderes activas que inspiran participación, unión y confianza, construyendo un barrio seguro, solidario y lleno de oportunidades para nuestras familias.
            </p>
          </div>
        </div>
        
      </section>    
          <section id="destacada">
        <h2>Unidos por Nuestra Comunidad y Familia</h2>
        <p>Nuestro compromiso se basa en tres pilares fundamentales que nos permiten crecer juntos.</p>
        
        <div className="feature-grid">
            <div className="feature-item">
                <h3>Vínculos Familiares</h3>
                <p>Organizamos eventos y actividades para que las familias se conecten y fortalezcan el tejido social de nuestro barrio.</p>
            </div>
            <div className="feature-item">
                <h3>Seguridad Vecinal</h3>
                <p>Implementamos redes de apoyo y coordinaciones efectivas para la tranquilidad de todos los hogares.</p>
            </div>
            <div className="feature-item">
                <h3>Visibilidad y Gestión</h3>
                <p>Trabajamos para llevar la voz de los vecinos a las autoridades y conseguir mejoras concretas para Mirador de Volcanes IV.</p>
            </div>
        </div>
    </section>
      <section id="destacada">
        <h2>Unidos por Nuestra Comunidad y Familia</h2>
        <p>
          Nuestro compromiso se basa en tres pilares fundamentales que nos
          permiten crecer juntos.
        </p>
        <div className="feature-grid">
          <div className="feature-item">
            <h3>Vínculos Familiares</h3>
            <p>
              Organizamos eventos y actividades para que las familias se
              conecten y fortalezcan el tejido social de nuestro barrio.
            </p>
          </div>
          <div className="feature-item">
            <h3>Seguridad Vecinal</h3>
            <p>
              Implementamos redes de apoyo y coordinaciones efectivas para la
              tranquilidad de todos los hogares.
            </p>
          </div>
          <div className="feature-item">
            <h3>Visibilidad y Gestión</h3>
            <p>
              Trabajamos para llevar la voz de los vecinos a las autoridades y
              conseguir mejoras concretas para Mirador de Volcanes IV.
            </p>
          </div>
        </div>
      </section>

      {/* 🔽 SECCIÓN DE PREGUNTAS FRECUENTES */}
      <section id="faq">
        <h2>Preguntas Frecuentes</h2>

        {!showAll ? (
          <button
            className="faq-toggle-button"
            onClick={() => setShowAll(true)}
          >
            Ver más preguntas ↓
          </button>
        ) : (
          <>
            <div className="faq-list">
              {faqs.map((faq, index) => (
                <div
                  key={index}
                  className={`faq-item ${
                    activeIndex === index ? "active" : ""
                  }`}
                >
                  <button
                    className="faq-question"
                    onClick={() => toggleFAQ(index)}
                  >
                    <span>{faq.question}</span>
                    <span className="faq-icon">
                      {activeIndex === index ? "−" : "+"}
                    </span>
                  </button>
                  <div className="faq-answer">
                    <p>{faq.answer}</p>
                  </div>
                </div>
              ))}
            </div>
            <button
              className="faq-toggle-button cerrar"
              onClick={() => setShowAll(false)}
            >
              Ocultar preguntas ↑
            </button>
          </>
        )}
      </section>

    </main>
  );
}

export default Home;