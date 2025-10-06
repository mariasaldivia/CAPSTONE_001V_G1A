import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import Navbar from "./components/Navbar.jsx";
import Footer from "./components/Footer.jsx";

import Certificados from "./Modulos/Certificados/Certificados.jsx";
import ComunicacionNoticias from "./Modulos/ComunicacionNoticias/ComunicacionNoticias.jsx";
import Home from "./Modulos/Home.jsx";
// 👇 Importa ambas vistas
import RequerimientosDirectiva from "./Modulos/Requerimientos/RequerimientosDirectiva.jsx";
import RequerimientosVecino from "./Modulos/Requerimientos/RequerimientosVecino.jsx";
import ProyectosVecinalesAdmin from "./Modulos/ProyectosVecinales/ProyectosVecinalesAdmin";
import ProyectosVecinalesVecino from "./Modulos/ProyectosVecinales/ProyectosVecinalesVecino.jsx";
import Login from "./Modulos/Auth/Login.jsx";
import Register from "./Modulos/Auth/Register.jsx";

export default function App() {
  return (
    <BrowserRouter>
      <AppInner />
    </BrowserRouter>
  );
}

function AppInner() {
  const { pathname } = useLocation();
  const isAdminPanel = pathname.startsWith("/solicitudes"); // solo para directiva

  return (
    <>
      {/* Navbar: la ocultas dentro de Navbar.jsx si es /solicitudes */}
      <Navbar />

      <Routes>
        <Route path="/home" element={<Home />} />
        <Route path="/certificados" element={<Certificados />} />
        <Route path="/noticias" element={<ComunicacionNoticias />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* 👇 DIRECTIVA */}
        <Route path="/solicitudes" element={<RequerimientosDirectiva />} />
        <Route path="/proyectos-vecinales" element={<ProyectosVecinalesAdmin />} /> 

        {/* 👇 VECINOS */}
        <Route path="/requerimientos" element={<RequerimientosVecino />} />
        <Route path="/proyectosVecino" element={<ProyectosVecinalesVecino />} />  

        {/* Redirecciones */}
        <Route path="/" element={<Navigate to="/home" replace />} />
        <Route path="*" element={<Navigate to="/home" replace />} />
      </Routes>

      {/* Si es panel de directiva oculto el footer */}
      {!isAdminPanel && <Footer />}
    </>
  );
}
