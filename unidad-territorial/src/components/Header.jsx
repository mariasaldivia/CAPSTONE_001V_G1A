import { Link, useNavigate } from "react-router-dom";
import logo from "../assets/logo_nuevo.png";

function Header({ user, setUser }) {
  const navigate = useNavigate();

  const handleLogout = () => {
    setUser(null);
    navigate("/"); // al cerrar sesión vuelve al home
  };

  return (
      <header style={styles.header}>

        
        <img src={logo} alt="Logo del sitio" style={styles.logo} />
        <nav>
          <Link to="/" style={styles.link}>Inicio </Link>
          <Link to="/#servicios" style={styles.link}>Servicios</Link>
          <Link to="/#contacto" style={styles.link}>Contacto</Link>
          {!user ? (
            <Link to="/login" style={styles.link}>Iniciar sesión</Link>
          ) : (
            <>
              {user.role === "directiva" && (
                <Link to="/dashboard" style={styles.link}>Dashboard</Link>
              )}
            
              <button 
                onClick={() => {
                  setUser(null);     // cerrar sesión
                }} 
                style={{ 
                  ...styles.link, 
                  background: "transparent", 
                  border: "none", 
                  cursor: "pointer" 
                }}
              >
                Cerrar sesión
              </button>
            </>
          )}
        </nav>

      </header>
  );
}

const styles = {
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "10px 30px",
    background: "#001e45ff",
    width: "100%",
    boxSizing: "border-box",
    position: "sticky",
    top: 0,
    left: 0,
    
    zIndex: 1000,
  },
  link: {
    margin: "0 10px",
    color: "white",
    textDecoration: "none",
  },
  logo: {
    height: "60px",
    marginRight: "20px",
  },
};

export default Header;
