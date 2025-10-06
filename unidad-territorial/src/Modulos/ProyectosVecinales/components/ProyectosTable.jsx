import React from "react";

function ProyectosTable({ proyectos, isAdmin, onChangeEstado, onPostular }) {
  return (
    <table className="rv__table">
      <thead>
        <tr>
          <th>Nombre</th>
          <th>Descripción</th>
          <th>Fechas</th>
          <th>Bases</th>
          <th>Estado</th>
          <th>Acciones</th>
        </tr>
      </thead>
      <tbody>
        {proyectos.map((proyecto, index) => (
          <tr key={index}>
            <td>{proyecto.nombre}</td>
            <td>{proyecto.descripcion}</td>
            <td>
              {proyecto.fechaInicio} <br /> {proyecto.fechaFin}
            </td>
            <td>
              {proyecto.bases ? (
                <details>
                  <summary>Ver bases</summary>
                  <p style={{ marginTop: "0.4rem", color: "#1f2937" }}>
                    {proyecto.bases}
                  </p>
                </details>
              ) : (
                <em>No requiere bases</em>
              )}
            </td>
            <td>
              {isAdmin ? (
                <select
                  value={proyecto.estado}
                  onChange={(e) => onChangeEstado(index, e.target.value)}
                  className="rv__select"
                >
                  <option>Abierto</option>
                  <option>Cerrado</option>
                  <option>Evaluando</option>
                  <option>Finalizado</option>
                </select>
              ) : (
                proyecto.estado
              )}
            </td>
            <td>
              {!isAdmin && (
                <button
                  className="rv__btn"
                  onClick={() => onPostular(index)}
                  disabled={proyecto.estado !== "Aceptado"}
                >
                  Postular
                </button>
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default ProyectosTable;



