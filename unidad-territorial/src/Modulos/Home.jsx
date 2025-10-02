import HeroCarousel from "../components/HeroCaroulsel";

function Home({ user, setUser }) {
  return (
    <div>
      <HeroCarousel/>

      <section id="nosotros" style={styles.section}>
        <h2>Nuestra Organización</h2>
        <div style={styles.mvvContainer}>
          <div style={styles.card}>
            <h3>Misión</h3>
            <p>
              Trabajamos con compromiso para mejorar nuestro entorno. Impulsamos la participación comunitaria, gestionamos soluciones junto a las autoridades y promovemos espacios de seguridad, integración, recreación y salud, siempre con el foco en el desarrollo integral de nuestra comunidad.
            </p>
          </div>
          <div style={styles.card}>
            <h3>¿Quiénes somos?</h3>
            <p>
              Somos la directiva de la Junta de Vecinos Mirador de Volcanes IV, mujeres comprometidas y organizadas por el bienestar de nuestra comunidad. Nos mueve la convicción de que, unidos, podemos hacer de nuestro barrio un lugar más seguro, con mejores espacios para vivir, compartir y crecer.
              Trabajamos para recuperar nuestras áreas verdes, fortalecer la convivencia y fomentar la vida sana , especialmente para nuestros niños. Somos la voz organizada de nuestra comunidad buscando junto a las autoridades hacer de Mirador de Volcanes IV un mejor lugar para vivir.

            </p>
          </div>
          <div style={styles.card}>
            <h3>Visión</h3>
            <p>
              Ser una comunidad de mujeres líderes activas que inspiran participación, unión y confianza, construyendo un barrio seguro, solidario y lleno de oportunidades para nuestras familias.
            </p>
          </div>
        </div>
        
      </section>    
    </div>
  );
}

const styles = {
  mvvContainer: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
    gap: "20px",
    marginTop: "20px",
  },
  section: {
    padding: "50px 40px",
    textAlign: "center",
  },
  cardContainer: {
    display: "flex",
    justifyContent: "center",
    marginTop: "20px",
    gap: "20px",
    background: "purple",
  },
  card: {
    background: "#f4f4f4",
    padding: "20px",
    borderRadius: "8px",
    minWidth: "200px",
    boxShadow: "0 2px 5px rgba(0,0,0,0.1)",
    color: "#000000ff",
  },
  footer: {
    padding: "15px",
    textAlign: "center",
    background: "#222",
    color: "white",
    marginTop: "30px",
  },
};

export default Home;
