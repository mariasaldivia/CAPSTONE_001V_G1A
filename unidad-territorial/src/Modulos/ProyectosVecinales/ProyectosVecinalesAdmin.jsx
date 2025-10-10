import React, { useState } from "react";
import ProyectoForm from "./components/ProyectoForm";
import PanelLateralD from "../../components/PanelLateralD";
import "./ProyectosVecinales.css";

function ProyectosVecinalesAdmin() {
  const [proyectos, setProyectos] = useState([
    {
      nombre: "Campeonato de Rayuela",
      descripcion: "Torneo comunitario de rayuela en el Parque La Paloma.",
      fechaInicio: "25-10-2025",
      fechaFin: "25-10-2025",
      bases: "No requiere bases",
      estado: "Abierto",
    },
    {
      nombre: "Gran Bingo Bailable Malón",
      descripcion: "Evento recreativo con bingo, música y convivencia vecinal.",
      fechaInicio: "28-10-2025",
      fechaFin: "28-10-2025",
      bases: "Aforo limitado a 120 personas (por orden de inscripción).",
      estado: "Abierto",
    },
    {
      nombre: "Feria de Salud Comunitaria",
      descripcion: "Instancia de atención y prevención en salud para la comunidad.",
      fechaInicio: "30-10-2025",
      fechaFin: "30-10-2025",
      bases: "No requiere bases",
      estado: "Abierto",
    },
    {
      nombre: "Campeonato de Brisca",
      descripcion: "Competencia de cartas brisca organizada por la junta de vecinos.",
      fechaInicio: "18-10-2025",
      fechaFin: "18-10-2025",
      bases: "No requiere bases",
      estado: "Abierto",
    },
    {
      nombre: "Bingo Adulto Mayor",
      descripcion: "Jornada de bingo y convivencia con premios para los participantes.",
      fechaInicio: "22-10-2025",
      fechaFin: "22-10-2025",
      bases: "Podrán participar vecinos mayores de 60 años pertenecientes a la Junta. Inscripción previa obligatoria (cupos limitados a 60 personas). Cada participante podrá invitar a un acompañante mayor de edad.",
      estado: "Abierto",
    },
    {
      nombre: "Club de Lectura Marcela Paz",
      descripcion: "Espacio mensual de encuentro donde vecinos y vecinas comparten lecturas, reflexiones y opiniones sobre obras literarias seleccionadas. El club busca fomentar la lectura, la conversación y la vida cultural del barrio.",
      fechaInicio: "23-09-2025",
      fechaFin: "07-10-2025",
      bases: "No requiere bases",
      estado: "Finalizado",
    },
  ]);

  const agregarProyecto = (nuevoProyecto) => {
    // Convertimos la fechaFin a objeto Date
  const fechaFin = new Date(nuevoProyecto.fechaFin);
  const hoy = new Date();

  // Calculamos el estado automáticamente
  let estado = "Abierto"; // por defecto
  if (fechaFin < hoy) {
    estado = "Finalizado";
  } else if (fechaFin.toDateString() === hoy.toDateString()) {
    estado = "En revisión";
  }

  // Agregamos el nuevo proyecto con el estado calculado
  setProyectos([
    ...proyectos,
    { ...nuevoProyecto, estado },
  ]);
  };

  const cambiarEstado = (index, nuevoEstado) => {
    const nuevosProyectos = [...proyectos];
    nuevosProyectos[index].estado = nuevoEstado;
    setProyectos(nuevosProyectos);
  };

 return (
    <div className="pv-container">
      <h2 className="pv-title">Gestión de Proyectos Vecinales</h2>

      {/* 🔹 Card: Formulario */}
      <div className="pv-card pv-formCard">
        <h3 className="pv-subtitle">Agregar Nuevo Proyecto</h3>
        <ProyectoForm onSubmit={agregarProyecto} />
      </div>

      {/* 🔹 Card: Historial */}
      <div className="pv-card pv-historialCard">
        <h3 className="pv-subtitle">Historial de Proyectos</h3>

        {proyectos.length === 0 ? (
          <p className="pv-msg">No hay proyectos registrados aún.</p>
        ) : (
          <div className="historial-container">
            {proyectos.map((p, index) => (
              <div
                key={index}
                className={`proyecto-card ${
                  p.estado === "Abierto"
                    ? "estado-abierto"
                    : p.estado === "En revisión"
                    ? "estado-revision"
                    : "estado-finalizado"
                }`}
              >
                <div className="proyecto-header">
                  <h4>{p.nombre}</h4>
                  <select
                    value={p.estado}
                    onChange={(e) => cambiarEstado(index, e.target.value)}
                    className="estado-select"
                  >
                    <option>Abierto</option>
                    <option>En revisión</option>
                    <option>Finalizado</option>
                  </select>
                </div>

                <p className="proyecto-descripcion">{p.descripcion}</p>

                <div className="proyecto-info">
                  <p>
                    <strong>Fecha:</strong> {p.fechaInicio} - {p.fechaFin}
                  </p>
                  <p>
                    {!p.bases || p.bases.trim() === "" || p.bases === "No requiere bases" ? (
                      <span className="sin-bases">No requiere bases</span>
                    ) : (
                      <details className="pv-details">
                        <summary className="pv-link">📄 Ver bases</summary>
                        <p className="pv-basesText">{p.bases}</p>
                      </details>
                    )}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function ProyectosVecinalesDirectiva() {
  const user = { nombre: "Nombre Directiva", cargo: "Cargo" };
  return (
    <PanelLateralD title="Proyectos Vecinales" user={user} showTopUser={false}>
      <ProyectosVecinalesAdmin />
    </PanelLateralD>
  );
}
