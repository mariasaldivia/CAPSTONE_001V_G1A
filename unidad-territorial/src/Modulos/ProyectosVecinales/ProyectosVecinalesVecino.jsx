import React, { useState, useEffect } from "react";
import { obtenerProyectos } from "../../api/proyectosApi";
import { postularProyecto } from "../../api/postulacionesApi";
import { registrarInteres } from "../../api/interesApi";
import ModalMensaje from "../../components/ModalMensaje";

import "./ProyectosVecinales.css";

function ProyectosVecinalesVecino() {
  const [proyectos, setProyectos] = useState([]);
  const [proyectoSeleccionado, setProyectoSeleccionado] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ motivo: "" });
  const [socioId, setSocioId] = useState(null);
  const [ cargandoSocio, setCargandoSocio] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalMensaje, setModalMensaje] = useState("");
  const [modalTipo, setModalTipo] = useState("info");

  useEffect(() => {
    async function fetchData() {
     // const data = await obtenerProyectos();
     // setProyectos(data);
    }
    fetchData();
  }, []);
  useEffect(() => {
    const usuarioStr = localStorage.getItem("usuario");
    if (!usuarioStr) {
      console.warn("⚠ No se encontró 'usuario' en localStorage");
      setCargandoSocio(false);
      return;
    }

    let usuario;
    try {
      usuario = JSON.parse(usuarioStr);
    } catch (e) {
      console.error("Error parseando usuario:", e);
      setCargandoSocio(false);
      return;
    }

    const correo =
      usuario.correo || usuario.Correo || usuario.email || usuario.Email || null;
    const rut = usuario.rut || usuario.RUT || null;

    if (!correo && !rut) {
      console.warn("⚠ No se encontró correo ni RUT del usuario logueado");
      setCargandoSocio(false);
      return;
    }

    const params = new URLSearchParams();
    if (correo) params.append("correo", correo);
    if (rut) params.append("rut", rut);

    // LEER LA VARIABLE DE ENTORNO (Como en tu RegisterForm)
    const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4010";

    //fetch(`http://localhost:4010/api/socios/buscar?${params.toString()}`)
    fetch(`${API_URL}/api/socios/buscar?${params.toString()}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.ok && data.socio?.ID_Socio) {
          setSocioId(data.socio.ID_Socio);
          localStorage.setItem("socioId", data.socio.ID_Socio);
          console.log("✅ socioId detectado:", data.socio.ID_Socio);
        } else {
          console.warn("⚠ No se pudo mapear socio:", data.message);
        }
      })
      .catch((err) => {
        console.error("Error buscando socio:", err);
      })
      .finally(() => setCargandoSocio(false));
  }, []);


  const abrirModal = (proyecto) => {
    setProyectoSeleccionado(proyecto);
    setShowModal(true);
  };

  
  const cerrarModal = () => {
    setShowModal(false);
    setProyectoSeleccionado(null);
    setFormData({ motivo: "" });
  };


  const handlePostular = async () => {
    if (!proyectoSeleccionado) return;

    await postularProyecto(socioId, proyectoSeleccionado.ID_Proyecto);
    setModalTipo("exito");
    setModalMensaje("Tu postulación fue enviada correctamente");
    setModalVisible(true);
    cerrarModal();
  };

  const handleInteres = async (proyectoId) => {
    try {
      await registrarInteres(proyectoId, socioId);

      setModalTipo("exito");
      setModalMensaje(
        "¡Interes registrado!, te avisaremos cuando haya nuevas novedades"
      );
      setModalVisible(true);
    } catch (err) {
      console.error(err);
      setModalTipo("error");
      setModalMensaje("❌ Error al registrar interés");
      setModalVisible(true);
    }
  };

  return (
     
    <div className="pv-container">
      <h2 className="pv-title">Actividades Vecinales Disponibles</h2>

      {proyectos.length === 0 ? (
        <p className="pv-msg">No hay Actividades disponibles por el momento.</p>
      ) : (
        <div className="historial-container">
          {proyectos
            .filter((p) => {
              // Mostrar sólo proyectos que NO están finalizados hace más de 7 días
              if (p.Estado === "Finalizado") {
                const fechaFin = new Date(p.FechaFin);
                const hoy = new Date();
                const diffDias = (hoy - fechaFin) / (1000 * 60 * 60 * 24);
                return diffDias <= 7;
              }
              return true;
            })
            .map((p) => {
              const claseEstado =
                p.Estado === "Abierto"
                  ? "estado-abierto"
                  : p.Estado === "En revisión"
                  ? "estado-revision"
                  : "estado-finalizado";

              return (
                <div
                  key={p.ID_Proyecto}
                  className={`proyecto-card ${claseEstado}`}
                >
                  <div className="proyecto-header">
                    <h4>{p.Nombre}</h4>
                    <span className={`estado-badge ${claseEstado}`}>
                      {p.Estado}
                    </span>
                  </div>

                  <p>{p.Descripcion}</p>

                  <p>
                    <strong>Fechas:</strong> {p.FechaInicio?.slice(0, 10)} -{" "}
                    {p.FechaFin?.slice(0, 10)}
                  </p>

                  {p.HoraInicio && (
                    <p>
                      <strong>Horario:</strong> {p.HoraInicio.substring(0, 5)} —{" "}
                      {p.HoraFin ? p.HoraFin.substring(0, 5) : ""}
                    </p>
                  )}

                  {/* Mostrar bases si existen */}
                  {p.Bases && (
                    <details className="pv-details">
                      <summary className="pv-link"> Ver bases</summary>
                      <p className="pv-basesText">{p.Bases}</p>
                    </details>
                  )}

                  {/* 🔹 Lógica según estado */}
                  {p.Estado === "Abierto" && (
                    <>
                      {p.TipoProyecto === "JJVV" ? (
                        <button
                          className="pv-btn pv-btn-green"
                          onClick={() => abrirModal(p)}
                        >
                          Postularse
                        </button>
                      ) : (
                        <button
                          className="pv-btn pv-btn-blue"
                          onClick={() => handleInteres(p.ID_Proyecto)}
                        >
                          Me interesa
                        </button>
                      )}
                    </>
                  )}

                  {p.Estado === "En revisión" && (
                    <div className="pv-msg-warning">
                      ⚠️ Esta Actividad está en revisión.
                      <br />
                      Si aún te interesa, comunícate directamente con la
                      directiva.
                    </div>
                  )}

                  {p.Estado === "Finalizado" && (
                    <div className="pv-msg-finalizado">
                       ⛔ Esta actividad ya finalizó.
                    </div>
                  )}
                </div>
              );
            })}
        </div>
      )}

      {/* 🔹 Modal dinámico */}
      {showModal && proyectoSeleccionado && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Postulación a {proyectoSeleccionado.Nombre}</h3>

            {proyectoSeleccionado.Bases &&
            proyectoSeleccionado.Bases.trim() !== "" ? (
              <>
                <p className="modal-text">
                  <strong>Requisitos:</strong> {proyectoSeleccionado.Bases}
                </p>
                <label>Motivo o comentario:
                </label>
                <textarea
                  value={formData.motivo}
                  onChange={(e) =>
                    setFormData({ ...formData, motivo: e.target.value })
                  }
                  placeholder="Ej. Estoy interesada en participar por..."
                />
                <div className="modal-actions">
                  <button className="pv-btn" onClick={handlePostular}>
                    Enviar Postulación
                  </button>
                  <button className="btn-cancelar" onClick={cerrarModal}>
                    Cancelar
                  </button>
                </div>
              </>
            ) : (
              <>
                <p>¿Deseas confirmar tu postulación a esta actividad?</p>
                <div className="modal-actions">
                  <button className="pv-btn" onClick={handlePostular}>
                    Confirmar
                  </button>
                  <button className="btn-cancelar" onClick={cerrarModal}>
                    Cancelar
                  </button>
                </div>
              </>
            )}
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

export default ProyectosVecinalesVecino;
