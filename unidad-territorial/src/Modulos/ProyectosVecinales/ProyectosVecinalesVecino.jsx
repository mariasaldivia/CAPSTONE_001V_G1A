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
              <strong>Fechas:</strong>{" "}
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
              <button className="pv-btn" onClick={() => postularAProyecto(p)}>
                Postular
              </button>
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

