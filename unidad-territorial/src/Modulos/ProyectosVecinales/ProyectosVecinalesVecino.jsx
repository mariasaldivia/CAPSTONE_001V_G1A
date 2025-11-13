import React, { useState, useEffect } from "react";
import { obtenerProyectos } from "../../api/proyectosApi";
import { postularProyecto } from "../../api/postulacionesApi";
import "./ProyectosVecinales.css";

function ProyectosVecinalesVecino() {
  const [proyectos, setProyectos] = useState([]);
  const [proyectoSeleccionado, setProyectoSeleccionado] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ motivo: "" });
  const socioId = 1; // 🔹 cambiar por el ID real del socio logueado

  // 🔹 Cargar proyectos desde backend
  useEffect(() => {
    async function fetchData() {
      const data = await obtenerProyectos();
      setProyectos(data);
    }
    fetchData();
  }, []);

  // 🔹 Abrir modal según el tipo de proyecto
  const abrirModal = (proyecto) => {
    setProyectoSeleccionado(proyecto);
    setShowModal(true);
  };

  // 🔹 Cerrar modal
  const cerrarModal = () => {
    setShowModal(false);
    setProyectoSeleccionado(null);
    setFormData({ motivo: "" });
  };

  // 🔹 Enviar postulación
  const handlePostular = async () => {
    if (!proyectoSeleccionado) return;

    await postularProyecto(socioId, proyectoSeleccionado.ID_Proyecto);
    alert("✅ Tu postulación fue enviada correctamente");
    cerrarModal();
  };

  return (
    <div className="pv-container">
      <h2 className="pv-title">Actividades Vecinales Disponibles</h2>

      {proyectos.length === 0 ? (
        <p className="pv-msg">No hay Actividades disponibles por el momento.</p>
      ) : (
        <div className="historial-container">
         {proyectos
  .filter((p) => {
    // ✅ Mostrar sólo proyectos que NO están finalizados hace más de 7 días
    if (p.Estado === "Finalizado") {
      const fechaFin = new Date(p.FechaFin);
      const hoy = new Date();
      const diffDias = (hoy - fechaFin) / (1000 * 60 * 60 * 24);
      return diffDias <= 7;
    }
    return true;
  })
  .map((p) => {
    const claseEstado =
      p.Estado === "Abierto"
        ? "estado-abierto"
        : p.Estado === "En revisión"
        ? "estado-revision"
        : "estado-finalizado";

    return (
      <div key={p.ID_Proyecto} className={`proyecto-card ${claseEstado}`}>
        <div className="proyecto-header">
          <h4>{p.Nombre}</h4>
          <span className={`estado-badge ${claseEstado}`}>
            {p.Estado}
          </span>
        </div>

        <p>{p.Descripcion}</p>

        <p>
          <strong>Fechas:</strong> {p.FechaInicio?.slice(0, 10)} -{" "}
          {p.FechaFin?.slice(0, 10)}
        </p>

        {p.HoraInicio && (
          <p>
            <strong>Horario:</strong> {p.HoraInicio.substring(0, 5)} —{" "}
            {p.HoraFin ? p.HoraFin.substring(0, 5) : ""}
          </p>
        )}

        {/* Mostrar bases si existen */}
        {p.Bases && (
          <details className="pv-details">
            <summary className="pv-link"> Ver bases</summary>
            <p className="pv-basesText">{p.Bases}</p>
          </details>
        )}

        {/* 🔹 Lógica según estado */}
        {p.Estado === "Abierto" && (
          <button
            className="pv-btn pv-btn-green"
            onClick={() => handlePostular(p.ID_Proyecto)}
          >
            Postularse
          </button>
        )}

        {p.Estado === "En revisión" && (
          <div className="pv-msg-warning">
            ⚠️ Este proyecto está en revisión.  
            <br />
            Si aún deseas postular, comunícate directamente con la directiva.
          </div>
        )}

        {p.Estado === "Finalizado" && (
          <div className="pv-msg-finalizado">
            🔴 Este proyecto ya finalizó.
          </div>
        )}
      </div>
    );
  })}
        </div>
      )}

      {/* 🔹 Modal dinámico */}
      {showModal && proyectoSeleccionado && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Postulación a {proyectoSeleccionado.Nombre}</h3>

            {proyectoSeleccionado.Bases &&
            proyectoSeleccionado.Bases.trim() !== "" ? (
              <>
                <p className="modal-text">
                  <strong>Requisitos:</strong> {proyectoSeleccionado.Bases}
                </p>
                <label>Motivo o comentario:</label>
                <textarea
                  value={formData.motivo}
                  onChange={(e) =>
                    setFormData({ ...formData, motivo: e.target.value })
                  }
                  placeholder="Ej. Estoy interesada en participar por..."
                />
                <div className="modal-actions">
                  <button className="pv-btn" onClick={handlePostular}>
                    Enviar Postulación
                  </button>
                  <button className="btn-cancelar" onClick={cerrarModal}>
                    Cancelar
                  </button>
                </div>
              </>
            ) : (
              <>
                <p>¿Deseas confirmar tu postulación a este proyecto?</p>
                <div className="modal-actions">
                  <button className="pv-btn" onClick={handlePostular}>
                    Confirmar
                  </button>
                  <button className="btn-cancelar" onClick={cerrarModal}>
                    Cancelar
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}


export default ProyectosVecinalesVecino;