import React, { useState } from "react";

const botonEstilo = {
  backgroundColor: '#f97316', // --pv-accent (naranja)
  color: '#ffffff',          // Texto blanco
  border: 'none',
  borderRadius: '999px',     // Estilo "píldora"
  padding: '0.6rem 1.4rem',
  cursor: 'pointer',
  fontWeight: '600',
  fontSize: '0.95rem',
  transition: 'background-color 0.25s',
};
function ProyectoForm({ onSubmit }) {
  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [bases, setBases] = useState("");
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!nombre || !descripcion || !fechaInicio || !fechaFin)
      return alert("Completa los campos obligatorios.");
    onSubmit({ nombre, descripcion, bases, fechaInicio, fechaFin });
    setNombre("");
    setDescripcion("");
    setBases("");
    setFechaInicio("");
    setFechaFin("");
  };

  return (
    <form className="rv__form" onSubmit={handleSubmit}>
      <div className="rv__row">
        <div className="rv__field">
          <label>Nombre del proyecto *</label>
          <input
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Ej. Plaza Verde"
          />
        </div>

        <div className="rv__field">
          <label>Descripción *</label>
          <input
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            placeholder="Breve descripción del proyecto"
          />
        </div>
      </div>

      <div className="rv__row">
        <div className="rv__field">
          <label>Fecha de inicio *</label>
          <input
            type="date"
            value={fechaInicio}
            onChange={(e) => setFechaInicio(e.target.value)}
          />
        </div>

        <div className="rv__field">
          <label>Fecha de término *</label>
          <input
            type="date"
            value={fechaFin}
            onChange={(e) => setFechaFin(e.target.value)}
          />
        </div>
      </div>

      <div className="rv__field">
        <label>Bases o condiciones (opcional)</label>
        <textarea
          value={bases}
          onChange={(e) => setBases(e.target.value)}
          placeholder="Ej. Los postulantes deben vivir en el sector A o B."
          rows="3"
        ></textarea>
      </div>

      <div className="rv__actions">
        <button style={botonEstilo} className="rv__btn" type="submit">
          Crear Proyecto
        </button>
      </div>
    </form>
  );
}

export default ProyectoForm;


