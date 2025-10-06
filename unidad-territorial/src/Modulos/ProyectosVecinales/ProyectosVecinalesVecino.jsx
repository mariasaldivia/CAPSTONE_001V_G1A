import React, { useState } from "react";
import "./ProyectosVecinales.css";

function ProyectosVecinalesVecino() {
  const [proyectos] = useState([
    {
      nombre: "Huerto Comunitario",
      descripcion: "Creación de un huerto urbano para los vecinos.",
      bases: "Debe contar con espacio disponible en su propiedad.",
      fechaInicio: "2025-10-01",
      fechaFin: "2025-10-20",
      estado: "Abierto",
    },
    {
      nombre: "Pintura de Sede",
      descripcion: "Remodelación y pintura de la sede social.",
      bases: "",
      fechaInicio: "2025-10-05",
      fechaFin: "2025-10-25",
      estado: "Abierto",
    },
  ]);

  const postularAProyecto = (index) => {
    alert(`✅ Te has postulado al proyecto: ${proyectos[index].nombre}`);
  };

  return (
    <div className="pv-container">
      <h2 className="pv-title">🌿 Proyectos Vecinales Disponibles</h2>

      <div className="pv-grid">
        {proyectos.map((p, index) => (
          <div key={index} className="pv-card">
            <div className="pv-header">
              <h3 className="pv-nombre">{p.nombre}</h3>
              <span
                className={`pv-estado ${
                  p.estado === "Aceptado" ? "estado-ok" : "estado-pendiente"
                }`}
              >
                {p.estado}
              </span>
            </div>

            <p className="pv-descripcion">{p.descripcion}</p>

            <div className="pv-fechas">
              <strong>Fechas:</strong>
              <span>
                {p.fechaInicio} → {p.fechaFin}
              </span>
            </div>

            <div className="pv-bases">
              {p.bases ? (
                <a href="#" className="pv-link">
                  📄 Ver bases
                </a>
              ) : (
                <span className="pv-nobases">No requiere bases</span>
              )}
            </div>

            <div className="pv-actions">
              <button
                className="pv-btn"
                onClick={() => postularAProyecto(index)}
              >
                Postular
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default ProyectosVecinalesVecino;


