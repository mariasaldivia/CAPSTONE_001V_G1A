import React, { useState } from "react";
import ProyectosTable from "./components/ProyectosTable";
import "./ProyectosVecinales.css";

function ProyectosVecinalesVecino() {
  const [proyectos] = useState([
   {
      nombre: "Campeonato de Rayuela",
      descripcion: "Torneo comunitario de rayuela en el Parque La Paloma.",
      horario: "10:30",
      fechaInicio: "25-10-2025",
      fechaFin: "25-10-2025",
      bases: "",
      estado: "Abierto",
    },
    {
      nombre: "Gran Bingo Bailable Malón",
      descripcion: "Evento recreativo con bingo, música y convivencia vecinal.",
       horario: "14:30 - 18:00",
      fechaInicio: "28-10-2025",
      fechaFin: "28-10-2025",
      bases: "Aforo limitado a 120 personas (por orden de inscripción). Max 4 personas por casa",
      estado: "Abierto",
    },
    {
      nombre: "Feria de Salud Comunitaria",
      descripcion: "Instancia de atención y prevención en salud para la comunidad.",
       horario: "08:00 - 13:00",
      fechaInicio: "30-10-2025",
      fechaFin: "30-10-2025",
      bases: "",
      estado: "Abierto",
    },
    {
      nombre: "Campeonato de Brisca",
      descripcion: "Competencia de cartas brisca organizada por la junta de vecinos.",
      horario: "15:30",
      fechaInicio: "18-10-2025",
      fechaFin: "18-10-2025",
      bases: "",
      estado: "Abierto",
    },
    {
      nombre: "Bingo Adulto Mayor",
      descripcion: "Jornada de bingo y convivencia con premios para los participantes.",
       horario: "15:00",
      fechaInicio: "22-10-2025",
      fechaFin: "22-10-2025",
      bases: "Podrán participar vecinos mayores de 60 años pertenecientes a la Junta. Inscripción previa obligatoria (cupos limitados a 60 personas). Cada participante podrá invitar a un acompañante mayor de edad.",
      estado: "Abierto",
    },
     {
      nombre: "Muestras Coreograficas de Org. CDR",
      descripcion: "Competencia de cartas brisca organizada por la junta de vecinos.",
       horario: "15:00",
      fechaInicio: "18-10-2025",
      fechaFin: "18-10-2025",
      bases: "",
      estado: "En Revisión",
    },
  ]);

  const [modalOpen, setModalOpen] = useState(false);
  const [proyectoSeleccionado, setProyectoSeleccionado] = useState(null);
  const [form, setForm] = useState({
    nombre: "",
    rut: "",
    direccion: "",
    comentarios: "",
  });

  const abrirModal = (proyecto) => {
    setProyectoSeleccionado(proyecto);
    setModalOpen(true);
  };

  const cerrarModal = () => {
    setModalOpen(false);
    setForm({ nombre: "", rut: "", direccion: "", comentarios: "" });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const enviarPostulacion = (e) => {
    e.preventDefault();
    alert(`✅ Postulación enviada para: ${proyectoSeleccionado.nombre}`);
    cerrarModal();
  };

  const postularAProyecto = (proyecto) => {
    if (proyecto.bases) {
      abrirModal(proyecto);
    } else {
      alert(`✅ Te has postulado al proyecto: ${proyecto.nombre}`);
    }
  };
  const normalizarEstado = (estado) => {
    const estadoNormalizado = estado.toLowerCase().trim();
    switch (estadoNormalizado) {
      case "abierto":
        return "estado-abierto";
        case "en revisión":
        case "en revision": // ✅ acepta ambas formas
          return "estado-revision";
        case "finalizado":
          return "estado-finalizado";
        default:
          return "";
      };
  }

  return (
    <div className="pv-container">
      <h2 className="pv-title">🌿 Proyectos Vecinales Disponibles</h2>

      <div className="pv-grid">
        {proyectos.map((p, index) => (
          <div key={index} className="pv-card">
            <div className="pv-header">
              <h3 className="pv-nombre">{p.nombre}</h3>
              <span className={`pv-estado ${normalizarEstado(p.estado)}`}>
                {p.estado}
              </span>
            </div>

            <p className="pv-descripcion">{p.descripcion}</p>
            <div className="pv-fechas">
              <strong>Horario:</strong>{" "}
                <span>{p.horario} hr</span>
            </div>

            <div className="pv-fechas">
              <strong>Fechas:</strong>{" "}
              <span>
                {p.fechaInicio} → {p.fechaFin}
              </span>
            </div>

           <div className="pv-bases">
              {p.bases ? (
                <details className="pv-details">
                  <summary className="pv-link">📄 Ver bases</summary>
                  <p className="pv-basesText">{p.bases}</p>
                </details>
              ) : (
                <span className="pv-nobases">No requiere bases</span>
              )}
            </div>

            <div className="pv-actions">
              {p.estado === "Abierto" ? (
                <button className="pv-btn" onClick={() => postularAProyecto(p)}>
                  Postular
                </button>
              ) : p.estado === "En revisión" ? (
                <p className="pv-msg">
                  🔒 En revisión — Si requiere una excepción, contacte con la directiva.
                </p>
              ) : p.estado === "Finalizado" ? (
                <p className="pv-msg">
                  ⏰ Proyecto finalizado — No se pueden recibir más postulaciones.
                </p>
              ) : (
                <p className="pv-msg">Estado no disponible</p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* 🔹 MODAL DE POSTULACIÓN */}
      {modalOpen && (
        <div className="pv-modalOverlay" onClick={cerrarModal}>
          <div
            className="pv-modal"
            onClick={(e) => e.stopPropagation()} // evita cerrar al hacer clic dentro
          >
            <h3 className="pv-modalTitle">
              📝 Postulación - {proyectoSeleccionado?.nombre}
            </h3>

            <p className="pv-modalDesc">
              Para postular, completa la siguiente información requerida por las
              bases del proyecto.
            </p>

            <form className="pv-form" onSubmit={enviarPostulacion}>
              <label>
                Nombre completo:
                <input
                  type="text"
                  name="nombre"
                  value={form.nombre}
                  onChange={handleChange}
                  required
                />
              </label>

              <label>
                RUT:
                <input
                  type="text"
                  name="rut"
                  value={form.rut}
                  onChange={handleChange}
                  required
                />
              </label>

              <label>
                Dirección:
                <input
                  type="text"
                  name="direccion"
                  value={form.direccion}
                  onChange={handleChange}
                  required
                />
              </label>

              <label>
                Comentarios adicionales:
                <textarea
                  name="comentarios"
                  rows={3}
                  value={form.comentarios}
                  onChange={handleChange}
                />
              </label>

              <div className="pv-modalActions">
                <button type="button" onClick={cerrarModal} className="pv-cancel">
                  Cancelar
                </button>
                <button type="submit" className="pv-submit">
                  Enviar Postulación
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default ProyectosVecinalesVecino;