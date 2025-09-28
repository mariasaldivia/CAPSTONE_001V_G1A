import { BrowserRouter, Routes, Route, Navigate, Link } from "react-router-dom";
import Certificados from "./Modulos/Certificados/Certificados.jsx";
import ComunicacionNoticias from "./Modulos/ComunicacionNoticias/ComunicacionNoticias.jsx";

export default function App() {
  return (
    <BrowserRouter>
      {/* Nav mínimo */}
      <nav style={{padding:"10px 16px", background:"#0c1130"}}>
        <Link to="/certificados" style={{color:"#e9ecff", marginRight:"12px"}}>Certificados</Link>
        <Link to="/noticias" style={{color:"#e9ecff"}}>Noticias</Link>
      </nav>

      <Routes>
        <Route path="/certificados" element={<Certificados />} />
        <Route path="/noticias" element={<ComunicacionNoticias />} />

        {/* Redirecciones */}
        <Route path="/" element={<Navigate to="/certificados" replace />} />
        <Route path="*" element={<Navigate to="/certificados" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

