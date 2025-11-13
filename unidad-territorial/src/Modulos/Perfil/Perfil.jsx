import React, { useEffect, useState } from 'react';
import './Perfil.css'; // Asegúrate de que la ruta sea correcta
import Modal from '../../components/Modal';

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

  // --- ACTUALIZAR Datos ---
  const [isEditing, setIsEditing] = useState(false); 
  const [formData, setFormData] = useState({ 
    Correo: '',
    Telefono: '',
    Calle: '',
    Numero_Casa: ''
  });

  //MODAL
  const [modalState, setModalState] = useState({
    isOpen: false,
    type: 'info',
    title: '',
    message: ''
  });

  // 1. Se llama al hacer clic en "Editar Perfil"
  const handleEditClick = () => {
    // 2. CARGA LOS NUEVOS CAMPOS DESDE 'datosSocio'
    setFormData({
      Correo: datosSocio.Correo,
      Telefono: datosSocio.Telefono,
      Calle: datosSocio.Calle,
      Numero_Casa: datosSocio.Numero_Casa,
    });
    setIsEditing(true); // Muestra el formulario
  };

  // 2. Se llama al hacer clic en "Cancelar"
  const handleCancelClick = () => {
    setIsEditing(false); // Oculta el formulario
  };

  // 3. Se llama al hacer clic en "Guardar"
  const handleSaveClick = async () => {
    try {
      const idParaGuardar = usuario.ID_Usuario || usuario.id;
      const data = await actualizarDatosSocio(idParaGuardar, formData);
      // Actualiza el estado local (datosSocio) para que la UI se refresque
      // Usamos el 'data.datosActualizados' que nos devuelve la API
      setDatosSocio(prevSocio => ({
        ...prevSocio,
        ...data.datosActualizados 
      }));

      setIsEditing(false); // Oculta el formulario

      //Abrir el MODAL de ÉXITO
      setModalState({
        isOpen: true,
        type: 'success',
        title: '¡Éxito!',
        message: 'Tus datos se cambiaron correctamente.'
      });
      
    } catch (error) {
      console.error("Error al guardar:", error);

      //Abrir el MODAL de ERROR
      setModalState({
        isOpen: true,
        type: 'error',
        title: 'Error',
        message: error.message || 'No se pudo guardar la información.'
      });
    }
  };


  useEffect(() => {
    const usuarioGuardado = leerUsuarioSesion();
    setUsuario(usuarioGuardado);

    // *** LA SOLUCIÓN ***
    // Buscamos el ID con CUALQUIER nombre posible (id, ID_Usuario).
    // Esto funciona si el usuario tiene 1 rol (ID_Usuario) o varios (id).
    const idParaBuscar = usuarioGuardado ? (usuarioGuardado.ID_Usuario || usuarioGuardado.id) : null;
// Si se encontró un ID, llamamos a la API
    if (idParaBuscar) { 
      
      obtenerDatosSocioPorId(idParaBuscar) // <-- Usamos el ID encontrado
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
      // No hay usuario en sesión, o el usuario no tiene ID
      setCargando(false);
    }
  }, []); // El array vacío [] asegura que esto se ejecute solo una vez

  if (cargando) {
    return (
      <div className="perfil-container">
        <h1 className="perfil-titulo">Cargando perfil...</h1>
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

{/* --- REEMPLAZA ESTE BLOQUE COMPLETO --- */}

      {/* --- 2. TARJETA DE INFORMACIÓN PERSONAL --- */}
      <div className="perfil-card">
        <div className="perfil-avatar">
          <span className="perfil-iniciales">
            {datosSocio.Nombres ? datosSocio.Nombres.charAt(0).toUpperCase() : 'S'}
          </span>
        </div>

        <div className="perfil-info">
          
          {/* --- DATOS NO EDITABLES --- */}
          <div className="perfil-grupo">
            <label className="perfil-label">Nombres:</label>
            <p className="perfil-valor">{datosSocio.Nombres || 'No especificado'}</p>
          </div>
          <div className="perfil-grupo">
            <label className="perfil-label">Apellidos:</label>
            <p className="perfil-valor">{datosSocio.Apellidos || 'No especificado'}</p>
          </div>
          <div className="perfil-grupo">
            <label className="perfil-label">RUT:</label>
            <p className="perfil-valor">{datosSocio.RUT || 'Miembro'}</p>
          </div>

          {/* --- DATOS DE CONTACTO (AHORA EDITABLES) --- */}

          <div className="perfil-grupo">
            <label className="perfil-label">Dirección:</label>
            {isEditing ? (
              <div className="perfil-grupo-direccion">
                <input
                  type="text"
                  placeholder="Nombre de la calle"
                  className="perfil-input" 
                  value={formData.Calle}
                  onChange={(e) => setFormData({ ...formData, Calle: e.target.value })}
                />
                <input
                  type="text"
                  placeholder="#"
                  className="perfil-input-numero"
                  value={formData.Numero_Casa}
                  onChange={(e) => setFormData({ ...formData, Numero_Casa: e.target.value })}
                />
              </div>
            ) : (
              <p className="perfil-valor">{`${datosSocio.Calle || 'Calle no especificada'} #${datosSocio.Numero_Casa || 'S/N'}`}</p>
            )}
          </div>
          
          <div className="perfil-grupo">
            <label className="perfil-label">Correo Electrónico:</label>
            {isEditing ? (
              <input
                type="email"
                className="perfil-input"
                value={formData.Correo}
                onChange={(e) => setFormData({ ...formData, Correo: e.target.value })}
              />
            ) : (
              <p className="perfil-valor">{datosSocio.Correo || 'No especificado'}</p>
            )}
          </div>
          
          <div className="perfil-grupo">
            <label className="perfil-label">Teléfono celular:</label>
            {isEditing ? (
              <input
                type="tel"
                className="perfil-input"
                value={formData.Telefono}
                onChange={(e) => setFormData({ ...formData, Telefono: e.target.value })}
              />
            ) : (
              <p className="perfil-valor">{datosSocio.Telefono || 'No especificado'}</p>
            )}
          </div>

          {/* --- BOTONES DE ACCIÓN (CON LÓGICA) --- */}
          {isEditing ? (
            <div className="perfil-botones-accion">
              <button className="perfil-btn-guardar" onClick={handleSaveClick}>
                Guardar
              </button>
              <button className="perfil-btn-cancelar" onClick={handleCancelClick}>
                Cancelar
              </button>
            </div>
          ) : (
            <button className="perfil-btn-editar" onClick={handleEditClick}>
              Editar Contacto
            </button>
          )}

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


      <Modal 
        isOpen={modalState.isOpen} 
        onClose={() => setModalState({ ...modalState, isOpen: false })} 
        title={modalState.title}
        type={modalState.type}
      >
        {/* El 'children' ahora es solo el mensaje */}
        <p>{modalState.message}</p> 
      </Modal>


    </div>




  );
}