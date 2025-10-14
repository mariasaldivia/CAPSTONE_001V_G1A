import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import Navbar from "./components/Navbar.jsx";
import Footer from "./components/Footer.jsx";

/* Vistas Vecinos */
import Home from "./Modulos/Home.jsx";
import Certificados from "./Modulos/Certificados/Certificados.jsx";
import ComunicacionNoticias from "./Modulos/ComunicacionNoticias/ComunicacionNoticias.jsx";
import RequerimientosVecino from "./Modulos/Requerimientos/RequerimientosVecino.jsx";
import ProyectosVecinalesVecino from "./Modulos/ProyectosVecinales/ProyectosVecinalesVecino.jsx";

/* Vistas Directiva */
import RequerimientosDirectiva from "./Modulos/Requerimientos/RequerimientosDirectiva.jsx";
import ProyectosVecinalesAdmin from "./Modulos/ProyectosVecinales/ProyectosVecinalesAdmin";
import CertificadosDirectiva from "./Modulos/Certificados/CertificadosDirectiva.jsx";
import Gestion_Socios from "./Modulos/GestionSocios/Gestion_Socios.jsx";
import NoticiasDirectiva from "./Modulos/ComunicacionNoticias/NoticiasDirectiva.jsx";

/* Auth */
import Login from "./Modulos/Auth/Login.jsx";
import Register from "./Modulos/Auth/Register.jsx";

export default function App() {
  return (
    <BrowserRouter /* basename={import.meta.env.BASE_URL} */>
      <AppInner />
    </BrowserRouter>
  );
}

function AppInner() {
  const { pathname } = useLocation();

  // 🔹 Considera panel de directiva tanto /solicitudes como cualquier /directiva/*
  const adminRoutes = ["/solicitudes", "/gestion", "/gestionProyectos"];
  const isAdminPanel =
  adminRoutes.includes(pathname) ||
  pathname.startsWith("/directiva/");

  return (
    <>
      {/* Oculta el Navbar en panel de directiva si así lo deseas */}
      {!isAdminPanel && <Navbar />}

      <Routes>
        {/* Público / Vecinos */}
        <Route path="/home" element={<Home />} />
        <Route path="/certificados" element={<Certificados />} />
        <Route path="/noticias" element={<ComunicacionNoticias />} />
        <Route path="/requerimientos" element={<RequerimientosVecino />} />
        <Route path="/proyectos" element={<ProyectosVecinalesVecino />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Directiva */}
        <Route path="/solicitudes" element={<RequerimientosDirectiva />} />
        <Route path="/gestionProyectos" element={<ProyectosVecinalesAdmin />} />
        <Route path="/directiva/certificados" element={<CertificadosDirectiva />} />
        <Route path="/gestion" element={<Gestion_Socios/>} />
        <Route path="/directiva/noticias" element={<NoticiasDirectiva />} />

        {/* Redirección por defecto de /directiva → certificados */}
        <Route path="/directiva" element={<Navigate to="/directiva/certificados" replace />} />

        {/* Redirecciones base */}
        <Route path="/" element={<Navigate to="/home" replace />} />
        <Route path="*" element={<Navigate to="/home" replace />} />
      </Routes>

      {/* Oculta el Footer también en panel de directiva */}
      {!isAdminPanel && <Footer />}
    </>
  );
}
