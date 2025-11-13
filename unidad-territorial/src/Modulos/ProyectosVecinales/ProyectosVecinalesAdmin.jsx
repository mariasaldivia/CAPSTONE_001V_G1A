import React, { useState, useEffect } from "react";
import ProyectoForm from "./components/ProyectoForm";
import PanelLateralD from "../../components/PanelLateralD";
import ModalMensaje from "../../components/ModalMensaje";
import {
  obtenerProyectos,
  crearProyecto,
  actualizarProyecto,
} from "../../api/proyectosApi";
import {
  obtenerPostulaciones,
  actualizarEstadoPostulacion,
} from "../../api/postulacionesApi";
import {
  eliminarProyecto,
  rechazarPostulaciones,
} from "../../api/proyectosApi";
import "./ProyectosVecinales.css";

function ProyectosVecinalesAdmin() {
  const [proyectos, setProyectos] = useState([]);
  const [postulaciones, setPostulaciones] = useState([]);
  const [mostrarPostulaciones, setMostrarPostulaciones] = useState(false);
  const [proyectoSeleccionado, setProyectoSeleccionado] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalMensaje, setModalMensaje] = useState("");
  const [modalTipo, setModalTipo] = useState("info");

  // 🔹 Cargar proyectos desde el backend
  useEffect(() => {
    cargarProyectos();
  }, []);

  const cargarProyectos = async () => {
    const data = await obtenerProyectos();
    setProyectos(data);
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
        `http://localhost:4010/api/proyectos/${idProyecto}`,
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

      const res = await fetch(`http://localhost:4010/api/proyectos/${id}`, {
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
      setModalMensaje("Actividad y sus postulaciones fueron eliminados correctamente");
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
    <div className="pv-container">
      <h2 className="pv-title">Gestión de Actividades Vecinales</h2>

      {/* 🔹 Card: Formulario */}
      <div className="pv-card pv-formCard">
        <h3 className="pv-subtitle">Agregar Nuevo Actividad</h3>
        <ProyectoForm onSubmit={agregarProyecto} />
      </div>

      {/* 🔹 Card: Historial */}
      <div className="pv-card pv-historialCard">
        <h3 className="pv-subtitle">Historial de Actividades</h3>

        {proyectos.length === 0 ? (
          <p className="pv-msg">No hay actividades registrados aún.</p>
        ) : (
          <div className="historial-container">
            {proyectos.map((p, index) => (
              <div
                key={p.ID_Proyecto || index}
                className={`proyecto-card ${
                  p.Estado === "Abierto"
                    ? "estado-abierto"
                    : p.Estado === "En revisión"
                    ? "estado-revision"
                    : "estado-finalizado"
                }`}
              >
                <div className="proyecto-header">
                  <h4>{p.Nombre}</h4>
                  <select
                    value={p.Estado}
                    onChange={(e) =>
                      cambiarEstado(p.ID_Proyecto, e.target.value)
                    }
                    className={`estado-select ${
                      p.Estado === "Abierto"
                        ? "estado-abierto"
                        : p.Estado === "En revisión"
                        ? "estado-revision"
                        : "estado-finalizado"
                    }`}
                  >
                    <option value="Abierto">Abierto</option>
                    <option value="En revisión">En revisión</option>
                    <option value="Finalizado">Finalizado</option>
                  </select>
                </div>

                <p className="proyecto-descripcion">{p.Descripcion}</p>

                <div className="proyecto-info">
                  <p>
                    <strong>Fecha:</strong>{" "}
                    {p.FechaInicio
                      ? new Date(p.FechaInicio).toLocaleDateString("es-CL")
                      : "-"}{" "}
                    {" / "}
                    {p.FechaFin
                      ? new Date(p.FechaFin).toLocaleDateString("es-CL")
                      : "—"}
                  </p>
                  <p>
                    <strong>Horario:</strong>{" "}
                    {p.HoraInicio ? ` ${p.HoraInicio.substring(0, 5)}` : "—"}{" "}
                    {" — "}
                    {p.HoraFin ? `${p.HoraFin.substring(0, 5)}` : "—"}
                  </p>

                  {/* 🔹 Bloque independiente para las bases */}
                  <div className="proyecto-bases">
                    {!p.Bases ||
                    p.Bases.trim() === "" ||
                    p.Bases === "No requiere bases" ? (
                      <span className="sin-bases">No requiere bases</span>
                    ) : (
                      <details className="pv-details">
                        <summary className="pv-link">Ver bases</summary>
                        <p className="pv-basesText">{p.Bases}</p>
                      </details>
                    )}
                  </div>

                  <div className="acciones-proyecto">
                    <button
                      className="btn-eliminar"
                      onClick={() => setProyectoAEliminar(p.ID_Proyecto)}
                    >
                      Eliminar
                    </button>

                    <div>
                      <button
                        className="btn-editar"
                        onClick={() => setEditando(p.ID_Proyecto)}
                      >
                        Editar
                      </button>

                      <button
                        className="btn-ver-postulantes"
                        onClick={() => verPostulantes(p.ID_Proyecto)}
                      >
                        Ver postulantes
                      </button>
                    </div>
                  </div>
                  {editando === p.ID_Proyecto && (
                    <div className="editar-fechas">
                      <label>Fecha inicio</label>
                      <input
                        type="date"
                        value={p.FechaInicio || ""}
                        onChange={(e) =>
                          actualizarCampo(index, "FechaInicio", e.target.value)
                        }
                      />

                      <label>Fecha fin</label>
                      <input
                        type="date"
                        value={p.FechaFin || ""}
                        onChange={(e) =>
                          actualizarCampo(index, "FechaFin", e.target.value)
                        }
                      />
                      <label>Hora inicio</label>
                      <input
                        type="time"
                        value={p.HoraInicio ? p.HoraInicio.substring(0, 5) : ""}
                        onChange={(e) =>
                          actualizarCampo(index, "HoraInicio", e.target.value)
                        }
                      />
                      <label>Hora fin</label>
                      <input
                        type="time"
                        value={p.HoraFin ? p.HoraFin.substring(0, 5) : ""}
                        onChange={(e) =>
                          actualizarCampo(index, "HoraFin", e.target.value)
                        }
                      />
                      <label>Bases</label>
                      <textarea
                        value={p.Bases || ""}
                      onChange={(e) =>
                        actualizarCampo(index, "Bases", e.target.value)
                      }
                        placeholder="Agrega o modifica las bases del proyecto..."
                      />

                      <button
                        onClick={() => guardarCambios(p.ID_Proyecto, index)}
                        className="btn-guardar"
                      >
                        Guardar
                      </button>
                      <button
                        className="btn-cancelar"
                        onClick={() => setEditando(null)}
                      >
                        Cancelar
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 🔹 Modal simple para ver postulantes */}
      {mostrarPostulaciones && (
        <div className="pv-modal">
          <div className="pv-modal-content">
            <h3>Postulantes a la Actividad</h3>

            {/* Mostrar nombre del proyecto */}
            {proyectos.find((x) => x.ID_Proyecto === proyectoSeleccionado) && (
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

            {/* Tabla de postulantes */}
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
      {/* 🔹 Modal de confirmación para eliminar */}
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
