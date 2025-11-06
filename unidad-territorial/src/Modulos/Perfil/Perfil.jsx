import React, { useEffect, useState } from 'react';
import './Perfil.css'; // Asegúrate de que la ruta sea correcta

function leerUsuarioSesion() {
  try {
    const raw = localStorage.getItem("usuario") || sessionStorage.getItem("usuario");
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

// --- 1. FUNCIÓN DE CONEXIÓN ---
async function obtenerDatosSocioPorId(idUsuario) {
    const url = `/api/socios/detalles/${idUsuario}`; 
    try {
        const response = await fetch(url);
        if (!response.ok) {
            // Manejo de errores (ej. 404 - Socio no encontrado)
            const errorData = await response.json();
            throw new Error(errorData.message || 'Error al cargar datos');
        }
        const data = await response.json();
        return data.socio; 
    } catch (error) {
        console.error("Fallo al obtener datos del socio:", error);
        throw error; // Propaga el error para que el useEffect lo capture
    }
}

// FUNCIÓN PARA ACTUALIZAR
async function  actualizarDatosSocio(idUsuario, datos) {
  const url = `/api/socios/actualizar/${idUsuario}`;

  const response = await fetch(url, {
      method: 'PATCH', // Usamos PATCH o PUT para actualizar
      headers: {
          'Content-Type': 'application/json',
      },
      body: JSON.stringify(datos), // Enviamos los datos del formulario
  });

  if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Error al actualizar');
    }
    const data = await response.json();
    return data; 
}

export default function Perfil() {
  const [usuario, setUsuario] = useState(null);
  // Nuevo estado para los datos específicos de la tabla 'socio'
  const [datosSocio, setDatosSocio] = useState(null); 
  const [cargando, setCargando] = useState(true); // Para manejar el estado de carga
  const [error, setError] = useState(null); // Para manejar errores

  // --- EDICIÓN ---
  const [isEditing, setIsEditing] = useState(false); // ¿Está en modo edición?
  const [formData, setFormData] = useState({ // Datos del formulario
    correo: '',
    telefono: '',
    calle: '',
    numeroCasa: ''
  });

  useEffect(() => {
    const usuarioGuardado = leerUsuarioSesion();
    setUsuario(usuarioGuardado);

    // Verificamos que tengamos un usuario y su ID_Usuario para buscar
     if (usuarioGuardado && usuarioGuardado.ID_Usuario) {
      
      // Llamamos a la función de fetch
      obtenerDatosSocioPorId(usuarioGuardado.ID_Usuario)
       .then(data => {
          // ¡Éxito! Guardamos los datos de la tabla SOCIOS
        setDatosSocio(data);
        })
        .catch(err => {
          // Si la API falla (ej. 404), guardamos el error
         setError(err.message);
       })
        .finally(() => {
          // Terminamos la carga, ya sea con éxito o error
           setCargando(false);
        });

    } else {
      // Si no hay usuario en sesión, no hay nada que cargar
      setCargando(false);
    }
  }, []);

  if (cargando) {
    return (
      <div className="perfil-container">
        <h1 className="perfil-titulo">Cargando perfil...</h1>
      </div>
    );
  }
  if (error) {
    return (
      <div className="perfil-container no-user">
        <h1 className="perfil-titulo">Error</h1>
        <p>{error}</p>
      </div>
    );
  }
  if (!usuario || !datosSocio) {
    return (
      <div className="perfil-container no-user">
        <p>No se encontró información del socio o no has iniciado sesión.</p>
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
            {datosSocio.Nombres ? datosSocio.Nombres.charAt(0).toUpperCase() : 'S'}
          </span>
        </div>

        <div className="perfil-info">
          <div className="perfil-grupo">
            <label className="perfil-label">Nombres:</label>
            <p className="perfil-valor">{datosSocio.Nombres  || 'No especificado'}</p>
          </div>
          <div className="perfil-grupo">
            <label className="perfil-label">Apellidos:</label>
            <p className="perfil-valor">{datosSocio.Apellidos  || 'No especificado'}</p>
          </div>

          <div className="perfil-grupo">
            <label className="perfil-label">RUT :</label>
            <p className="perfil-valor">{datosSocio.RUT || 'Miembro'}</p>
          </div>
          <div className="perfil-grupo">
            <label className="perfil-label">Dirección:</label>
            <p className="perfil-valor">{`${datosSocio.Calle || 'Calle no especificada'}  #${datosSocio.Numero_Casa || 'S/N'}`}</p>
          </div>

          <div className="perfil-grupo">
            <label className="perfil-label">Correo Electrónico:</label>
            <p className="perfil-valor">{datosSocio.Correo || 'No especificado'}</p>
          </div>
          <div className="perfil-grupo">
            <label className="perfil-label">Teléfono celular:</label>
            <p className="perfil-valor">{datosSocio.Telefono || 'No especificado'}</p>
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