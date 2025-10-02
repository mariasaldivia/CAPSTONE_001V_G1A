import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import "swiper/css/navigation";
import { Navigation, Autoplay } from "swiper/modules";

function HeroCarousel() {
  const slides = [
    {
      title: "Bienvenidos a la Junta de Vecinos Mirador de Volcanes IV",
      description: "Trabajamos unidos por la seguridad y el desarrollo de nuestra comunidad",
      
      background: "linear-gradient(to right, #03005fff, #212fb0ff)",
    },
    {
      title: "Explora nuestras actividades",
      description: "Eventos y seguridad para tu barrio",
      background: "linear-gradient(to right, #f7971e, #ffd200)",
    },
    {
      title: "Únete a la comunidad",
      description: "Participa y mejora tu entorno",
      background: "linear-gradient(to right, #11998e, #38ef7d)",
    },
  ];

  return (
    <Swiper
      modules={[Navigation, Autoplay]}
      navigation
      autoplay={{ delay: 4000, disableOnInteraction: false }}
      loop={true}
      style={{ width: "100%", height: "80vh" }}
    >
      {slides.map((slide, index) => (
        <SwiperSlide key={index}>
          <section
            style={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
              width: "100%",
              height: "100%",
              background: slide.background,
              color: "white",
              textAlign: "center",
            }}
          >
            <h1>{slide.title}</h1>
            <h2>{slide.description}</h2>
            <button
              style={{
                marginTop: "15px",
                padding: "10px 20px",
                background: "white",
                color: "#2193b0",
                border: "none",
                borderRadius: "5px",
                cursor: "pointer",
              }}
            >
              Conócenos
            </button>
          </section>
        </SwiperSlide>
      ))}
    </Swiper>
  );
}

export default HeroCarousel;
