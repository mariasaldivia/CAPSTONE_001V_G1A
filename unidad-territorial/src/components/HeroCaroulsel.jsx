import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import "swiper/css/navigation";
import { Navigation, Autoplay } from "swiper/modules";

// 1. Importa tu nuevo archivo CSS
import "../components/HeroCaroulsel.css";

// Si usas imágenes locales, impórtalas aquí:
import slide1Graphic from "/logo.png"; // ¡Asumo que es un PNG con transparencia!
// import slide2Graphic from "../assets/images/slide2-graphic.png";
// import slide3Graphic from "../assets/images/slide3-graphic.png";


function HeroCarousel() {
  const slides = [
    {
      id: 1,
      title: "Bienvenida a Mirador de Volcanes IV",
      description: "Construyendo un barrio más seguro y unido para nuestras familias.",
      cta_text: "Conoce a la Directiva",
      cta_link: "#directiva",
      backgroundColor: "var(--color-base-oscuro)", // Color de fondo del slide
      imageSrc: slide1Graphic, // La imagen que NO ocupará todo el ancho
      imageAlt: "Comunidad de Mirador de Volcanes IV",
    },
    {
      id: 2,
      title: "Nuestra Prioridad: Tu Seguridad",
      description: "Implementamos redes de apoyo y gestionamos soluciones para la tranquilidad de todos.",
      cta_text: "Ver Proyectos",
      cta_link: "#proyectos",
      backgroundColor: "var(--color-secundario)",
      // imageSrc: slide2Graphic, // Puedes añadir una imagen si quieres
      imageAlt: "Mapa de seguridad vecinal",
    },
    {
      id: 3,
      title: "Tu Voz Es El Cambio",
      description: "Súmate a nuestras actividades y fortalezcamos la comunidad.",
      cta_text: "¡Participa Ahora!",
      cta_link: "#contacto",
      backgroundColor: "var(--color-acento)",
      // imageSrc: slide3Graphic, // Puedes añadir una imagen si quieres
      imageAlt: "Personas participando en evento comunitario",
    },
  ];

  return (
    <Swiper
      className="hero-swiper"
      modules={[Navigation, Autoplay]}
      navigation
      autoplay={{ delay: 5000, disableOnInteraction: false }}
      loop={true}
    >
      {slides.map((slide) => (
        <SwiperSlide 
          key={slide.id} 
          className="hero-slide" // Esta clase se mantiene para estilos generales
          style={{ backgroundColor: slide.backgroundColor }} // El color de fondo del slide
        >
          {/* Si hay una imagen, la renderizamos */}
          {slide.imageSrc && (
            <img 
              src={slide.imageSrc} 
              alt={slide.imageAlt} 
              className="hero-slide-image" // Clase para estilizar la imagen
            />
          )}

          {/* El contenido de texto sigue siendo el mismo */}
          <div className="hero-content">
            <h1>{slide.title}</h1>
            <p>{slide.description}</p>
            <a href={slide.cta_link} className="hero-cta">
              {slide.cta_text}
            </a>
          </div>
        </SwiperSlide>
      ))}
    </Swiper>
  );
}

export default HeroCarousel;