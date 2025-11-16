import React, { useState, useEffect } from "react";
import ProyectoForm from "./components/ProyectoForm";
import PanelLateralD from "../../components/PanelLateralD";
import ModalMensaje from "../../components/ModalMensaje";

import {
  obtenerProyectos,
  crearProyecto,
  eliminarProyecto,
  rechazarPostulaciones,
} from "../../api/proyectosApi";
import {
  obtenerPostulaciones,
  actualizarEstadoPostulacion,
} from "../../api/postulacionesApi";

import "./ProyectosVecinales.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4010";

function ProyectosVecinalesAdmin() {
  const [proyectos, setProyectos] = useState([]);
  const [postulaciones, setPostulaciones] = useState([]);
  const [mostrarPostulaciones, setMostrarPostulaciones] = useState(false);
  const [proyectoSeleccionado, setProyectoSeleccionado] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalMensaje, setModalMensaje] = useState("");
  const [modalTipo, setModalTipo] = useState("info");
  const [postulantesAbiertos, setPostulantesAbiertos] = useState(null);
  const [postulantes, setPostulantes] = useState([]);
  // 🔹 Cargar proyectos desde el backend
  useEffect(() => {
    cargarProyectos();
  }, []);

  const cargarProyectos = async () => {
    const data = await obtenerProyectos();
    setProyectos(data);
   console.log("Modo Layout: Carga de proyectos omitida.");
  };


  // 🔹 Crear nuevo proyecto
  const agregarProyecto = async (nuevoProyecto) => {
    await crearProyecto(nuevoProyecto);
    await cargarProyectos();
  };

  // 🔹 Cambiar estado de un proyecto (Abierto / En revisión / Finalizado)
  const cambiarEstado = async (idProyecto, nuevoEstado) => {
    try {
      const res = await fetch(
      //  `http://localhost:4010/api/proyectos/${idProyecto}`,
      `${API_URL}/api/proyectos/${idProyecto}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ Estado: nuevoEstado }),
        }
      );

      if (!res.ok) throw new Error("Error al actualizar estado");

      setModalTipo("exito");
      setModalMensaje(`El estado del proyecto se cambió a "${nuevoEstado}".`);
      setModalVisible(true);

      await cargarProyectos();
    } catch (err) {
      console.error(err);
      setModalTipo("error");
      setModalMensaje("No se pudo cambiar el estado del proyecto.");
      setModalVisible(true);
    }
  };

  // 🔹 Ver postulaciones de un proyecto
  const verPostulantes = async (idProyecto) => {
    const data = await obtenerPostulaciones(idProyecto);
    setPostulaciones(data);
    setProyectoSeleccionado(idProyecto);
    setMostrarPostulaciones(true);
  };
  const obtenerPostulantes = async (idProyecto) => {
    try {
      const data = await obtenerPostulaciones(idProyecto);
      setPostulantes(data);
    } catch (err) {
      console.error("❌ Error obteniendo postulantes:", err);
      setPostulantes([]);
    }
  };
const cambiarEstadoPostulante = async (pos, nuevoEstado) => {
  try {
    await actualizarEstadoPostulacion(pos.ID_Postulacion, {
      Estado: nuevoEstado,
    });

    // 🔹 Actualiza el estado local sin recargar todo
    const updated = postulaciones.map((p) =>
      p.ID_Postulacion === pos.ID_Postulacion
        ? { ...p, Estado: nuevoEstado }
        : p
    );
    setPostulaciones(updated);

    setModalTipo("exito");
    setModalMensaje("Estado del postulante actualizado correctamente.");
    setModalVisible(true);
  } catch (error) {
    console.error(error);
    setModalTipo("error");
    setModalMensaje("No se pudo actualizar el estado del postulante.");
    setModalVisible(true);
  }
};
  const [editando, setEditando] = useState(null);

  const actualizarCampo = (index, campo, valor) => {
    const nuevos = [...proyectos];
    nuevos[index][campo] = valor;
    setProyectos(nuevos);
  };

  const guardarCambios = async (id, index) => {
    try {
      const cambios = proyectos[index];

      const payload = {
        FechaInicio: cambios.FechaInicio,
        FechaFin: cambios.FechaFin,
        HoraInicio: cambios.HoraInicio,
        HoraFin: cambios.HoraFin,
        Bases: cambios.Bases || null,
        Estado: cambios.Estado,
      };

    //  const res = await fetch(`http://localhost:4010/api/proyectos/${id}`, {
      const res = await fetch(`${API_URL}/api/proyectos/${id}`, { 
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Error al actualizar proyecto");
      setModalTipo("exito");
      setModalMensaje("Actividad actualizada correctamente");
      setModalVisible(true);
      setEditando(null);
      await cargarProyectos();
    } catch (err) {
      console.error(err);
      setModalTipo("error");
      setModalMensaje("No se pudo actualizar la actividad.");
      setModalVisible(true);
    }
  };
  const [proyectoAEliminar, setProyectoAEliminar] = useState(null);

  const handleEliminarProyecto = async (idProyecto) => {
    try {
      // Paso 1: rechazar y eliminar postulaciones asociadas
      await rechazarPostulaciones(idProyecto);

      // Paso 2: eliminar el proyecto
      await eliminarProyecto(idProyecto);

      setModalTipo("exito");
      setModalMensaje(
        "Actividad y sus postulaciones fueron eliminados correctamente"
      );
      setModalVisible(true);
      await cargarProyectos();
    } catch (error) {
      console.error(error);
      setModalTipo("error");
      setModalMensaje(" No se pudo eliminar la actividad ni sus postulaciones");
      setModalVisible(true);
    }
  };
  const handleGuardarEstado = async (idPostulacion, nuevoEstado) => {
    try {
      await actualizarEstadoPostulacion(idPostulacion, nuevoEstado);
      setModalTipo("exito");
      setModalMensaje(" Estado actualizado correctamente");
      setModalVisible(true);
    } catch (error) {
      console.error(error);
      setModalTipo("error");
      setModalMensaje("No se pudo actualizar el estado");
      setModalVisible(true);
    }
  };
  return (
    <div className="pv-admin">
      <div className="pv-container">
        <h2 className="pv-title">Gestión de Actividades Vecinales</h2>

        <div className="pv-layout">
          {/* 🔹 Formulario principal */}
          <section className="pv-card pv-formCard">
            <div className="pv-cardHeader">
              <h3 className="pv-subtitle">Agregar Nueva Actividad</h3>
              <p className="pv-cardHint">
                Define las actividades de la Junta de Vecinos o de la
                Municipalidad.
              </p>
            </div>
            <ProyectoForm onSubmit={agregarProyecto} />
          </section>

          {/* 🔹 Historial de actividades */}
          <section className="pv-card pv-historialCard pv-admin">
            <div className="pv-cardHeader pv-historialHeader">
              <div>
                <h3 className="pv-subtitle">Historial de Actividades</h3>
                <p className="pv-cardHint">
                  Revisa, edita o elimina actividades y gestiona las
                  postulaciones.
                </p>
              </div>
            </div>

            {proyectos.length === 0 ? (
              <p className="pv-msg">No hay actividades registradas aún.</p>
            ) : (
              <div className="pv-table-wrapper">
                <table className="pv-table">
                  <thead>
                    <tr>
                      <th>Fechas</th>
                      <th>Actividad</th>
                      <th>Estado</th>
                      <th>Tipo</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>

                  <tbody>
                    {proyectos.map((p, index) => (
                      <React.Fragment key={p.ID_Proyecto}>
                        {/* 🔹 Fila principal */}
                        <tr>
                          {/* Fecha */}
                          <td>
                            {p.FechaInicio
                              ? new Date(p.FechaInicio).toLocaleDateString(
                                  "es-CL"
                                )
                              : "-"}
                            {" / "}
                            {p.FechaFin
                              ? new Date(p.FechaFin).toLocaleDateString("es-CL")
                              : "—"}
                          </td>

                          {/* Actividad */}
                          <td>
                            <strong>{p.Nombre}</strong>

                            <div className="pv-descripcion-tabla">
                              {p.Descripcion}
                            </div>

                            {p.TipoProyecto === "MUNICIPAL" && (
                              <div className="pv-interes-tabla">
                                <strong>Interesados: </strong>
                                {p.TotalInteres}
                              </div>
                            )}

                            {/* Bases */}
                            {!p.Bases || p.Bases.trim() === "" ? (
                              <div className="pv-bases-tabla pv-bases-sin">
                                No requiere bases
                              </div>
                            ) : (
                              <details className="pv-bases-tabla pv-details-inline">
                                <summary>Ver bases</summary>
                                <p>{p.Bases}</p>
                              </details>
                            )}
                          </td>

                          {/* Estado */}
                          <td>
                            <select
                              className="pv-select-tabla"
                              value={p.Estado}
                              onChange={(e) =>
                                cambiarEstado(p.ID_Proyecto, e.target.value)
                              }
                            >
                              <option>Abierto</option>
                              <option>En revisión</option>
                              <option>Finalizado</option>
                            </select>
                          </td>

                          {/* Tipo */}
                          <td>
                            <span
                              className={
                                p.TipoProyecto === "MUNICIPAL"
                                  ? "badge-muni"
                                  : "badge-jjvv"
                              }
                            >
                              {p.TipoProyecto}
                            </span>
                          </td>

                          {/* Acciones */}
                          <td>
                            <div className="pv-actions-circle">
                              {/* Editar */}
                              <button
                                className="circ-btn circ-edit"
                                title="Editar actividad"
                                onClick={() => {
                                  setPostulantesAbiertos(null);
                                  setEditando(
                                    editando === p.ID_Proyecto
                                      ? null
                                      : p.ID_Proyecto
                                  );
                                }}
                              >
                                <svg viewBox="0 0 24 24" width="18" height="18">
                                  <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1.003 1.003 0 0 0 0-1.42l-2.34-2.34a1.003 1.003 0 0 0-1.42 0l-1.83 1.83 3.75 3.75 1.84-1.82z" />
                                </svg>
                              </button>

                              {/* Ver postulantes (solo JJVV) */}
                              {p.TipoProyecto === "JJVV" && (
                                <button
                                  className="circ-btn circ-users"
                                  title="Ver postulantes"
                                  onClick={() => {
                                    setEditando(null);
                                    setPostulantesAbiertos(
                                      postulantesAbiertos === p.ID_Proyecto
                                        ? null
                                        : p.ID_Proyecto
                                    );
                                    // aquí tu función real:
                                    obtenerPostulaciones(p.ID_Proyecto).then(
                                      (data) => setPostulaciones(data)
                                    );
                                  }}
                                >
                                  <svg
                                    viewBox="0 0 24 24"
                                    width="18"
                                    height="18"
                                  >
                                    <path
                                      d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 
                          1.79-4 4 1.79 4 4 4zm6 1c-1.1 0-2.1.9-2.68 
                          2.22C15.16 16.9 13.68 17 12 17s-3.16-.1-3.32-.78C8.1 
                          13.9 7.1 13 6 13c-1.66 0-3 1.34-3 3v1h18v-1c0-1.66-1.34-3-3-3z"
                                    />
                                  </svg>
                                </button>
                              )}

                              {/* Eliminar */}
                              <button
                                className="circ-btn circ-delete"
                                title="Eliminar"
                                onClick={() =>
                                  setProyectoAEliminar(p.ID_Proyecto)
                                }
                              >
                                <svg viewBox="0 0 24 24" width="18" height="18">
                                  <path d="M3 6h18M9 6v12m6-12v12M4 6l1 14h14l1-14" />
                                </svg>
                              </button>
                            </div>
                          </td>
                        </tr>

                        {/* 🔹 Panel EDITAR debajo */}
                        {editando === p.ID_Proyecto && (
                          <tr className="pv-edit-row">
                            <td colSpan="5">
                              <div className="editar-fechas editar-fechas--open">
                                <h5>Editar actividad</h5>

                                <div className="editar-grid">
                                  <div className="rv__field">
                                    <label>Fecha inicio</label>
                                    <input
                                      type="date"
                                      value={p.FechaInicio || ""}
                                      onChange={(e) =>
                                        actualizarCampo(
                                          index,
                                          "FechaInicio",
                                          e.target.value
                                        )
                                      }
                                    />
                                  </div>

                                  <div className="rv__field">
                                    <label>Fecha fin</label>
                                    <input
                                      type="date"
                                      value={p.FechaFin || ""}
                                      onChange={(e) =>
                                        actualizarCampo(
                                          index,
                                          "FechaFin",
                                          e.target.value
                                        )
                                      }
                                    />
                                  </div>

                                  <div className="rv__field">
                                    <label>Hora inicio</label>
                                    <input
                                      type="time"
                                      value={
                                        p.HoraInicio?.substring(0, 5) || ""
                                      }
                                      onChange={(e) =>
                                        actualizarCampo(
                                          index,
                                          "HoraInicio",
                                          e.target.value
                                        )
                                      }
                                    />
                                  </div>

                                  <div className="rv__field">
                                    <label>Hora fin</label>
                                    <input
                                      type="time"
                                      value={p.HoraFin?.substring(0, 5) || ""}
                                      onChange={(e) =>
                                        actualizarCampo(
                                          index,
                                          "HoraFin",
                                          e.target.value
                                        )
                                      }
                                    />
                                  </div>
                                </div>

                                <div className="rv__field">
                                  <label>Bases</label>
                                  <textarea
                                    value={p.Bases || ""}
                                    onChange={(e) =>
                                      actualizarCampo(
                                        index,
                                        "Bases",
                                        e.target.value
                                      )
                                    }
                                  />
                                </div>

                                <div className="editar-actions">
                                  <button
                                    className="btn-guardar"
                                    onClick={() =>
                                      guardarCambios(p.ID_Proyecto, index)
                                    }
                                  >
                                    Guardar cambios
                                  </button>

                                  <button
                                    className="btn-cancelar"
                                    onClick={() => setEditando(null)}
                                  >
                                    Cancelar
                                  </button>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}

                        {/* 🔹 Panel POSTULANTES debajo */}
                        {postulantesAbiertos === p.ID_Proyecto && (
                          <tr className="pv-edit-row">
                            <td colSpan="5">
                              <div className="editar-fechas editar-fechas--open">
                                <h5>Postulantes</h5>

                                {postulaciones.length === 0 ? (
                                  <p>No hay postulantes registrados.</p>
                                ) : (
                                  <table className="tabla-postulantes">
                                    <thead>
                                      <tr>
                                        <th>Nombre</th>
                                         <th>Rut</th>
                                        <th>Correo</th>
                                        <th>Teléfono</th>
                                        <th>Estado</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {postulaciones.map((pos) => (
                                        <tr key={pos.ID_Postulante}>
                                          <td>
                                            {pos.Nombres} {pos.Apellidos}
                                          </td>
                                          <td>{pos.Rut}</td>
                                          <td>{pos.Correo}</td>
                                          <td>{pos.Telefono}</td>
                                          <td>
                                        <select
                                          value={pos.Estado}
                                          onChange={(e) => cambiarEstadoPostulante(pos, e.target.value)}
                                        >
                                          <option value="Pendiente">Pendiente</option>
                                          <option value="Aceptado">Aceptado</option>
                                          <option value="Rechazado">Rechazado</option>
                                        </select>
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                )}

                                <div className="editar-actions">
                                  <button
                                    className="btn-cancelar"
                                    onClick={() => setPostulantesAbiertos(null)}
                                  >
                                    Cerrar
                                  </button>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>

        {/* 🔹 Modal de postulantes */}
        {mostrarPostulaciones && (
          <div className="pv-modal">
            <div className="pv-modal-content">
              <h3>Postulantes a la Actividad</h3>

              {proyectos.find(
                (x) => x.ID_Proyecto === proyectoSeleccionado
              ) && (
                <p>
                  <strong>
                    {
                      proyectos.find(
                        (x) => x.ID_Proyecto === proyectoSeleccionado
                      )?.Nombre
                    }
                  </strong>
                </p>
              )}

              {postulaciones.length === 0 ? (
                <p className="pv-msg">No hay postulaciones aún.</p>
              ) : (
                <table className="tabla-postulantes">
                  <thead>
                    <tr>
                      <th>Nombre completo</th>
                      <th>Comentario</th>
                      <th>Estado</th>
                      <th>Fecha postulación</th>
                      <th>Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {postulaciones.map((po, idx) => (
                      <tr key={po.ID_Postulacion}>
                        <td>
                          {po.Nombres} {po.Apellidos}
                        </td>
                        <td>{po.Comentario || "—"}</td>
                        <td>
                          <select
                            value={po.Estado}
                            onChange={(e) => {
                              const updated = [...postulaciones];
                              updated[idx].Estado = e.target.value;
                              setPostulaciones(updated);
                            }}
                          >
                            <option>Pendiente</option>
                            <option>Aceptada</option>
                            <option>Rechazada</option>
                          </select>
                        </td>
                        <td>
                          {po.FechaPostulacion
                            ? new Date(po.FechaPostulacion).toLocaleDateString(
                                "es-CL"
                              )
                            : "—"}
                        </td>
                        <td>
                          <button
                            className="btn-guardar-estado"
                            onClick={() =>
                              handleGuardarEstado(po.ID_Postulacion, po.Estado)
                            }
                          >
                            💾 Guardar
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              <div className="modal-actions">
                <button
                  className="btn-cerrar"
                  onClick={() => setMostrarPostulaciones(false)}
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 🔹 Modal eliminar actividad */}
        {proyectoAEliminar && (
          <div className="modal-overlay">
            <div className="modal-content">
              <h3>¿Eliminar esta actividad?</h3>
              <p>Esta acción no se puede deshacer.</p>
              <div className="modal-buttons">
                <button
                  className="btn-cancelar"
                  onClick={() => setProyectoAEliminar(null)}
                >
                  Cancelar
                </button>
                <button
                  className="btn-confirmar"
                  onClick={async () => {
                    await handleEliminarProyecto(proyectoAEliminar);
                    setProyectoAEliminar(null);
                  }}
                >
                  Sí, eliminar
                </button>
              </div>
            </div>
          </div>
        )}

        {modalVisible && (
          <ModalMensaje
            tipo={modalTipo}
            mensaje={modalMensaje}
            onClose={() => setModalVisible(false)}
          />
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
