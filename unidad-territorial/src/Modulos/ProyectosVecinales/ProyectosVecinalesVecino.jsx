import React, { useState } from "react";
import ProyectosTable from "./components/ProyectosTable";
import "./ProyectosVecinales.css";

function ProyectosVecinalesVecino() {
  const [proyectos] = useState([
    {
      nombre: "Huerto Comunitario",
      descripcion: "Creación de un huerto urbano para los vecinos.",
      bases: "Debe contar con espacio disponible en su propiedad.",
      fechaInicio: "2025-10-01",
      fechaFin: "2025-10-20",
      estado: "Aceptado",
    },
    {
      nombre: "Pintura de Sede",
      descripcion: "Remodelación y pintura de la sede social.",
      bases: "",
      fechaInicio: "2025-10-05",
      fechaFin: "2025-10-25",
      estado: "Aceptado",
    },
  ]);

  const postularAProyecto = (index) => {
    alert(`Te has postulado al proyecto: ${proyectos[index].nombre}`);
  };

  return (
    <div className="rv">
      <div className="rv__card">
        <h2 className="rv__title">Proyectos Vecinales Disponibles</h2>

        <ProyectosTable
          proyectos={proyectos}
          isAdmin={false}
          onPostular={postularAProyecto}
        />
      </div>
    </div>
  );
}

export default ProyectosVecinalesVecino;

