import React, { useEffect, useState } from 'react';
import './Perfil.css'; // Asegúrate de que la ruta sea correcta

// (Aquí va tu función leerUsuarioSesion()... )
function leerUsuarioSesion() {
  try {
    const raw = localStorage.getItem("usuario") || sessionStorage.getItem("usuario");
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export default function Perfil() {
  const [usuario, setUsuario] = useState(null);

  useEffect(() => {
    const usuarioGuardado = leerUsuarioSesion();
    setUsuario(usuarioGuardado);
  }, []);

  if (!usuario) {
    // ... (tu código para 'no-user' va aquí)
    return (
      <div className="perfil-container no-user">
        {/* ... */}
      </div>
    );
  }

  // Si hay usuario, mostramos sus datos
  return (
    <div className="perfil-container">
      
{/* --- 1. TÍTULO (vuelve a estar solo) --- */}
      <h1 className="perfil-titulo">Mi Perfil</h1>

      {/* --- 2. TARJETA DE INFORMACIÓN PERSONAL --- */}
      <div className="perfil-card">
        <div className="perfil-avatar">
          <span className="perfil-iniciales">
            {usuario.nombre ? usuario.nombre.charAt(0).toUpperCase() : (usuario.Nombre_Usuario ? usuario.Nombre_Usuario.charAt(0).toUpperCase() : 'U')}
          </span>
        </div>

        
        <div className="perfil-info">
          <div className="perfil-grupo">
            <label className="perfil-label">Nombre:</label>
            <p className="perfil-valor">{usuario.nombre || usuario.name || 'No especificado'}</p>
          </div>
          <div className="perfil-grupo">
            <label className="perfil-label">Nombre de Usuario:</label>
            <p className="perfil-valor">{usuario.Nombre_Usuario || 'No especificado'}</p>
          </div>
          <div className="perfil-grupo">
            <label className="perfil-label">Correo Electrónico:</label>
            <p className="perfil-valor">{usuario.email || 'No especificado'}</p>
          </div>
          <div className="perfil-grupo">
            <label className="perfil-label">Rol:</label>
            <p className="perfil-valor">{usuario.rol || 'Miembro'}</p>
          </div>
            <button className="perfil-btn-editar">Editar Perfil</button>
        </div>

      </div>

  



      {/* --- 3. SECCIÓN NUEVA: REQUERIMIENTOS --- */}
      <div className="perfil-seccion">
        <h2 className="perfil-seccion-titulo">Mis Requerimientos</h2>
        <ul className="perfil-lista-items">
          {/* Estos son ejemplos. Luego los llenarás con datos reales (un .map()) */}
          <li className="perfil-item">
            <span className="perfil-item-texto">Reparación de luminaria Calle Principal</span>
            <span className="perfil-item-estado estado-aceptado">Aceptado</span>
          </li>
          <li className="perfil-item">
            <span className="perfil-item-texto">Poda de árbol en plaza</span>
            <span className="perfil-item-estado estado-rechazado">Rechazado</span>
          </li>
          <li className="perfil-item">
            <span className="perfil-item-texto">Instalación de basurero</span>
            <span className="perfil-item-estado estado-info">Más Info</span>
          </li>
        </ul>
      </div>

      {/* --- 4. SECCIÓN NUEVA: SOLICITUDES --- */}
      <div className="perfil-seccion">
        <h2 className="perfil-seccion-titulo">Mis Solicitudes</h2>
        <ul className="perfil-lista-items">
          {/* Ejemplo de solicitud */}
          <li className="perfil-item">
            <span className="perfil-item-texto">Solicitud de Certificado de Residencia</span>
            <span className="perfil-item-estado estado-aceptado">Listo</span>
          </li>
        </ul>
      </div>

    </div>


  );
}