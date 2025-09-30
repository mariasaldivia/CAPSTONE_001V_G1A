import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Navbar from "./components/Navbar.jsx";
import Footer from "./components/Footer.jsx";

import Certificados from "./Modulos/Certificados/Certificados.jsx";
import ComunicacionNoticias from "./Modulos/ComunicacionNoticias/ComunicacionNoticias.jsx";
import Home from "./Modulos/Home.jsx";
import ProyectosVecinales from "./Modulos/ProyectosVecinales/ProyectosVecinales.jsx";

export default function App() {
  return (
    <BrowserRouter>
      {/* Navbar fijo arriba en todas las páginas */}
      <Navbar />

      {/* Contenido de las rutas */}
      <Routes>
        <Route path="/home" element={<Home />} />
        <Route path="/certificados" element={<Certificados />} />
        <Route path="/noticias" element={<ComunicacionNoticias />} />
        <Route path="/ProyectosVecinales" element={<ProyectosVecinales />}/>

        {/* Redirecciones */}
        <Route path="/" element={<Navigate to="/home" replace />} />
        <Route path="*" element={<Navigate to="/home" replace />} />
      </Routes>

      {/* Footer fijo abajo en todas las páginas */}
      <Footer />
    </BrowserRouter>
  );
}