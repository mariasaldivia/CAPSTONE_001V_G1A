import React, { useState } from "react";
import ProyectoForm from "./components/ProyectoForm";
import ProyectosTable from "./components/ProyectosTable";
import "./ProyectosVecinales.css";

function ProyectosVecinalesAdmin() {
  const [proyectos, setProyectos] = useState([]);

  const agregarProyecto = (nuevoProyecto) => {
    setProyectos([...proyectos, { ...nuevoProyecto, estado: "En revisión" }]);
  };

  const cambiarEstado = (index, nuevoEstado) => {
    const nuevosProyectos = [...proyectos];
    nuevosProyectos[index].estado = nuevoEstado;
    setProyectos(nuevosProyectos);
  };

  return (
    <div className="rv">
      <div className="rv__card">
        <h2 className="rv__title">Gestión de Proyectos Vecinales (Admin)</h2>

        <ProyectoForm onSubmit={agregarProyecto} />

        <ProyectosTable
          proyectos={proyectos}
          isAdmin={true}
          onChangeEstado={cambiarEstado}
        />
      </div>
    </div>
  );
}

export default ProyectosVecinalesAdmin;

