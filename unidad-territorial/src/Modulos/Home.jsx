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
              Promover el bienestar y la participación activa de los vecinos, 
              fortaleciendo la seguridad, unión y desarrollo de nuestra comunidad.
            </p>
          </div>
          <div style={styles.card}>
            <h3>Visión</h3>
            <p>
              Ser un modelo de organización vecinal solidaria, inclusiva y 
              comprometida con el progreso del barrio.
            </p>
          </div>
          <div style={styles.card}>
            <h3>Quiénes Somos</h3>
            <p>
              Somos la Junta de Vecinos Mirador de Volcanes IV, conformada por 
              vecinos comprometidos en representar y gestionar iniciativas para 
              mejorar la calidad de vida en nuestra comunidad.
            </p>
          </div>
        </div>
        
      </section>

      <section id="servicios" style={styles.section}>
        <h2>Nuestros Servicios</h2>
        <div style={styles.cardContainer}>
          <div style={styles.card}>Gestión Comunitaria</div>
          <div style={styles.card}>Eventos y Actividades</div>
          <div style={styles.card}>Seguridad Vecinal</div>
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
  card: {
    background: "#f4f4f4",
    padding: "20px",
    borderRadius: "8px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
    textAlign: "left",
  },

  section: {
    padding: "50px 20px",
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
