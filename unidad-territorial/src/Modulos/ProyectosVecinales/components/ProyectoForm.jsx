import React, { useState } from "react";

const botonEstilo = {
  backgroundColor: '#f97316',
  color: '#ffffff',
  border: 'none',
  borderRadius: '999px',
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
  const [horaInicio, setHoraInicio] = useState("");
  const [horaFin, setHoraFin] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!nombre || !descripcion || !fechaInicio || !fechaFin)
      return alert("Completa los campos obligatorios.");

    onSubmit({
      Nombre: nombre,
      Descripcion: descripcion,
      Bases: bases || null,
      FechaInicio: fechaInicio,
      FechaFin: fechaFin,
      HoraInicio: horaInicio,
      HoraFin: horaFin,
    });

    setNombre("");
    setDescripcion("");
    setBases("");
    setFechaInicio("");
    setFechaFin("");
    setHoraInicio("");
    setHoraFin("");
  };

  return (
    <form className="rv__form" onSubmit={handleSubmit}>
      <div className="rv__row">
        <div className="rv__field">
          <label>Nombre de la actividad *</label>
          <input
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Ej. Bingo Comunitario"
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
          <label>Hora de inicio</label>
          <input
            type="time"
            value={horaInicio}
            onChange={(e) => setHoraInicio(e.target.value)}
          />
        </div>
      </div>

      <div className="rv__row">
        <div className="rv__field">
          <label>Fecha de término *</label>
          <input
            type="date"
            value={fechaFin}
            onChange={(e) => setFechaFin(e.target.value)}
          />
        </div>

        <div className="rv__field">
          <label>Hora de término</label>
          <input
            type="time"
            value={horaFin}
            onChange={(e) => setHoraFin(e.target.value)}
          />
        </div>
      </div>

      <div className="rv__field">
        <label>Bases o condiciones (opcional)</label>
        <textarea
          value={bases}
          onChange={(e) => setBases(e.target.value)}
          placeholder="Ej. Cupos limitados a 50 personas..."
          rows="3"
        ></textarea>
      </div>

      <div className="rv__actions">
        <button style={botonEstilo} type="submit">
          Crear Proyecto
        </button>
      </div>
    </form>
  );
}

export default ProyectoForm;