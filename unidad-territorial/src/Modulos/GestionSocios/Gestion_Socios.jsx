import React, { useState, useEffect } from "react";
import PanelLateralD from "../../components/PanelLateralD"; // Inikkat gapu ti biddut
 import "./GestionSocios.css"; // Inikkat gapu ti biddut

// Definimos la URL de la API (inat-in simple tapno maliklikan ti 'import.meta' warning)
const API_URL = "http://localhost:4010/api/socios";

const GestionSocios = () => {
  // Estados para datos
  const [socios, setSocios] = useState([]);
  const [postulantes, setPostulantes] = useState([]);
  const [rechazados, setRechazados] = useState([]);

  // Estados de UI
  const [filtro, setFiltro] = useState("");
  const [detalle, setDetalle] = useState(null); // Para el modal
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // --- Carga de Datos ---
  useEffect(() => {
    cargarDatos();
  }, []); // El array vacío [] significa que se ejecuta 1 vez al montar

  const cargarDatos = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(API_URL);
      if (!response.ok) {
        throw new Error(`Error ${response.status}: No se pudieron cargar los datos`);
      }
      const data = await response.json();
      if (data.ok) {
        setSocios(data.aprobados);
        setPostulantes(data.pendientes);
        setRechazados(data.rechazados || []);
      } else {
        throw new Error(data.message || "Error al procesar los datos");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // --- Acciones ---
  
  const handleAprobar = async (postulante) => {
    try {
      // 1. Llamar a la API para aprobar
      const response = await fetch(`${API_URL}/aprobar/${postulante.ID_Socio}`, {
        method: "PATCH",
      });
      const data = await response.json();

      if (!data.ok) {
        const errorMsg = data.error || data.message || "Error di-ammo";
        throw new Error(errorMsg);
      }
      // 2. Actualizar la UI localmente (para no recargar)
      // Quita de 'postulantes'
      setPostulantes(prev => prev.filter((p) => p.ID_Socio !== postulante.ID_Socio));
      // Añade a 'socios'
      setSocios(prev => [...prev, { ...postulante, Estado_Inscripcion: 'Aprobado' }]);
      
      setDetalle(null); // Cierra el modal

    } catch (err) {
      alert(`Error al aprobar: ${err.message}`);
    }
  };

const handleRechazar = async (idSocio) => {
  const confirmado = window.confirm("¿Estás seguro de que quieres rechazar a este postulante?");
  if (!confirmado) return;

  try {
    const response = await fetch(`${API_URL}/rechazar/${idSocio}`, {
      method: "PATCH",
    });
    const data = await response.json();

    if (!data.ok) throw new Error(data.message || "Error al rechazar");

    // 🔁 Vuelve a cargar todos los datos
    await cargarDatos();

    setDetalle(null);
    alert("Postulante rechazado correctamente.");
  } catch (err) {
    alert(`Error al rechazar: ${err.message}`);
  }
};


  // --- Renderizado ---

  // Lógica de filtrado (ahora usa los nombres de columna de la BD)
  const sociosFiltrados = socios.filter(socio => {
    const nombreCompleto = `${socio.Nombres} ${socio.Apellidos}`.toLowerCase();
    const rut = String(socio.RUT).toLowerCase();
    const busqueda = filtro.toLowerCase();
    return nombreCompleto.includes(busqueda) || rut.includes(busqueda);
  });

  if (isLoading) {
    return (
      <div className="gestion-container">
        <div className="panel"><h2>Cargando socios...</h2></div>
        <div className="panel"><h2>Cargando postulantes...</h2></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="gestion-container">
        <div className="panel">
          <h2 style={{ color: 'red' }}>Error al cargar datos</h2>
          <p>{error}</p>
          <button onClick={cargarDatos}>Reintentar</button>
        </div>
      </div>
    );
  }

  return (
    <div className="gestion-container">
      {/* === PANEL SOCIOS === */}
      <div className="panel">
        <h2>Socios Inscritos ({socios.length})</h2>
        <input
          type="text"
          placeholder="🔍 Buscar socio por nombre o RUT..."
          value={filtro}
          onChange={(e) => setFiltro(e.target.value)}
          className="w-full p-2 mb-6 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <div className="tabla-socios">
          <table>
            <thead>
              <tr>
                <th>Nombre</th>
                <th>RUT</th>
                <th>Dirección</th>
                <th>Correo</th>
                <th>Teléfono</th>
              </tr>
            </thead>
            <tbody>
              {sociosFiltrados.map((s) => (
                <tr key={s.ID_Socio}>
                  <td>{s.Nombres} {s.Apellidos}</td>
                  <td>{s.RUT}</td>
                  <td>{s.Calle} {s.Numero_Casa}</td>
                  <td>{s.Correo}</td>
                  <td>{s.Telefono}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {sociosFiltrados.length === 0 && (
            <p className="sin-postulantes">No se encontraron socios.</p>
          )}
        </div>
        
       <h2>Postulantes Rechazados ({rechazados.length})</h2>

        <div className="tabla-socios">
          <table>
            <thead>
              <tr>
                <th>Nombre</th>
                <th>RUT</th>
                <th>Dirección</th>
                <th>Correo</th>
                <th>Teléfono</th>
              </tr>
            </thead>
            <tbody>
              {rechazados.map((s) => (
                <tr key={s.ID_Socio}>
                  <td>{s.Nombres} {s.Apellidos}</td>
                  <td>{s.RUT}</td>
                  <td>{s.Calle} {s.Numero_Casa}</td>
                  <td>{s.Correo}</td>
                  <td>{s.Telefono}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {rechazados.length === 0 && (
            <p className="sin-postulantes">No hay rechazados</p>
          )}
        </div>
      </div>

      {/* === PANEL POSTULANTES === */}
      <div className="panel">
        <h2>Postulantes ({postulantes.length})</h2>
        <div className="postulantes-list">
          {postulantes.map((p) => (
            <div key={p.ID_Socio} className="postulante-card">
              <div>
                <strong>{p.Nombres} {p.Apellidos}</strong>
                <p>{p.RUT}</p>
              </div>
              <button className="revisar-btn" onClick={() => setDetalle(p)}>
                Revisar
              </button>
            </div>
          ))}
          {postulantes.length === 0 && (
            <p className="sin-postulantes">No hay postulantes pendientes.</p>
          )}
        </div>
      </div>

      {/* === MODAL DETALLE === */}
      {detalle && (
        <div className="modal-overlay" onClick={() => setDetalle(null)}>
          <div className="modal-detalle" onClick={(e) => e.stopPropagation()}>
            <h3>Detalle del Postulante</h3>
            <div className="modal-body">
              <p><strong>Nombre:</strong> {detalle.Nombres} {detalle.Apellidos}</p>
              <p><strong>RUT:</strong> {detalle.RUT}</p>
              <p><strong>Fecha de Nacimiento:</strong> {detalle.Fecha_Nacimiento}</p>
              <p><strong>Dirección:</strong> {detalle.Calle} {detalle.Numero_Casa}</p>
              <p><strong>Correo:</strong> {detalle.Correo}</p>
              <p><strong>Teléfono:</strong> {detalle.Telefono}</p>
            </div>
            <div className="acciones">
              <button className="btn-aceptar" onClick={() => handleAprobar(detalle)}>Aceptar</button>
              <button className="btn-rechazar" onClick={() => handleRechazar(detalle.ID_Socio)}>Rechazar</button>
              <button className="btn-cerrar" onClick={() => setDetalle(null)}>Cerrar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function GestionDeSocios(){
   const user = { nombre: "Nombre Directiva", cargo: "Cargo" };
    return (
      <PanelLateralD title="Gestion Socios" user={user} showTopUser={false}>
        <GestionSocios />
      </PanelLateralD>
    );
}