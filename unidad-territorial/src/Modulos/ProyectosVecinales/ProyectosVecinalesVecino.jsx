import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { obtenerProyectos } from "../../api/proyectosApi";
import { postularProyecto } from "../../api/postulacionesApi";
import { registrarInteres } from "../../api/interesApi";
import ModalMensaje from "../../components/ModalMensaje";

import { validarRutChileno, formatearRut } from "../../utils/rutUtils";
import { validatePhone, formatOnlyNumbers } from "../../utils/validators";

import "./ProyectosVecinales.css";

function ProyectosVecinalesVecino() {
  const [proyectos, setProyectos] = useState([]);
  const [proyectoSeleccionado, setProyectoSeleccionado] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ motivo: "" });
  const [socioId, setSocioId] = useState(null);

  const [cargandoSocio, setCargandoSocio] = useState(true);

  const [modalVisible, setModalVisible] = useState(false);
  const [modalMensaje, setModalMensaje] = useState("");
  const [modalTipo, setModalTipo] = useState("info");
  const [showRegisterPrompt, setShowRegisterPrompt] = useState(false);

  // Para el Interés del Vecino
  const [proyectoInteres, setProyectoInteres] = useState(null); // Si no es null, muestra el modal
  const [datosVecino, setDatosVecino] = useState({
    nombre: "",
    rut: "",
    telefono: "",
    email: "",
  });

  useEffect(() => {
    async function fetchData() {
      const data = await obtenerProyectos();
      setProyectos(data);
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

  //Modales para postulación
  const abrirModal = (proyecto) => {
    setProyectoSeleccionado(proyecto);
    setShowModal(true);
  };
  
  const cerrarModal = () => {
    setShowModal(false);
    setProyectoSeleccionado(null);
    setFormData({ motivo: "" });
  };

  //Para los que SI son SOCIOS --> Postulaciones
  const handlePostular = async () => {
    if (!proyectoSeleccionado) return;

    const body = {
      ID_Socio: socioId,
      ID_Proyecto: proyectoSeleccionado.ID_Proyecto,
      Comentario: formData.motivo,
    };

    try {
      await postularProyecto(body);
      setModalTipo("exito");
      setModalMensaje("Tu postulación fue enviada correctamente");
      setModalVisible(true);
      cerrarModal();
    } catch (err) {
      console.error(err);
      setModalTipo("error");
      setModalMensaje("❌ Error al enviar la postulación");
      setModalVisible(true);
    }
  };

  //Para los SOCIOS y NO socios --> Interés
  const handleInteres = async (proyecto) => {
    // CASO 1: Es un Socio logueado
    if (socioId) {
      try {
        const body = {
          ID_Proyecto: proyecto.ID_Proyecto,
          ID_Socio: socioId,
        };
        await registrarInteres(body);
        setModalTipo("exito");
        setModalMensaje("¡Interes registrado!, te avisaremos cuando haya nuevas novedades");
        setModalVisible(true);
      } catch (err) {
        console.error(err);
        setModalTipo("error");
        setModalMensaje("❌ Error al registrar interés");
        setModalVisible(true);
      }
    } else {
      // CASO 2: Es un Vecino (visitante). Abre el modal.
      setProyectoInteres(proyecto);
    }
  };

  // Manejo del envío del formulario de VECINO (usuario sin loguear)
  const handleEnviarInteresVecino = async (e) => {
    e.preventDefault(); // Evita que la página se recargue
    // VALIDACIONES de los campos
    if (!validarRutChileno(datosVecino.rut)) {
      setModalTipo("error");
      setModalMensaje("Por favor, ingresa un RUT chileno válido.");
      setModalVisible(true);
      return; // Detiene el envío
    }

    if (!validatePhone(datosVecino.telefono)) {
      setModalTipo("error");
      setModalMensaje(
        "Por favor, ingresa un teléfono de 9 dígitos (Ej: 912345678)."
      );
      setModalVisible(true);
      return; // Detiene el envío
    }

    const body = {
      ID_Proyecto: proyectoInteres.ID_Proyecto,
      ID_Socio: null, // Es un vecino
      Nombre_Vecino: datosVecino.nombre,
      RUT_Vecino: datosVecino.rut,
      Telefono_Vecino: datosVecino.telefono,
      Email_Vecino: datosVecino.email || null, // Envía null si está vacío
    };

    try {
      await registrarInteres(body);
      setModalTipo("exito");
      setModalMensaje("¡Interés registrado! Te contactaremos pronto.");
      setModalVisible(true);
      // Cierra el modal y limpia el formulario
      setProyectoInteres(null);
      setDatosVecino({ nombre: "", rut: "", telefono: "", email: "" });
    } catch (err) {
      console.error(err);
      setModalTipo("error");
      setModalMensaje("❌ Error al registrar tu interés");
      setModalVisible(true);
    }
  };

  // FUNCIÓN: Para manejar cambios en el formulario del vecino
  const handleVecinoChange = (e) => {
    const { name, value } = e.target;
    let finalValue = value;

    // Formateo de RUT y Teléfono
    if (name === "rut") {
      finalValue = formatearRut(value); // Aplica formato XX.XXX.XXX-X
    } else if (name === "telefono") {
      finalValue = formatOnlyNumbers(value); // Solo permite números
    }

    setDatosVecino(prevState => ({
      ...prevState,
      [name]: finalValue
    }));
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
                  className={`
                    proyecto-card 
                    ${claseEstado}
                    ${p.TipoProyecto === 'MUNICIPAL' ? 'proyecto-card--muni' : 'proyecto-card--jv'}
                  `}
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

                  {/* Lógica según estado */}
                  {p.Estado === "Abierto" && (
                    <>
                      {p.TipoProyecto === "JJVV" ? (
                        <button
                          className="pv-btn pv-btn-green"
                          onClick={() => {
                            if (socioId) {
                              // 1. Es un socio: Abre el modal de postulación
                              abrirModal(p);
                            } else {
                              // 2. Es un vecino: Abre el NUEVO modal de "Hazte Socio"
                              setShowRegisterPrompt(true);
                            }
                          }}
                        >
                          Postularse
                        </button>
                      ) : (
                        <button
                          className="pv-btn pv-btn-blue"
                          onClick={() => handleInteres(p)}
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

      {/* Modal POSTULARSE */}
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

      {/* Modal ME INTERESA */}
      {proyectoInteres && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Interés en {proyectoInteres.Nombre}</h3>
            <p>Déjanos tus datos para mantenerte informado.</p>

            <form onSubmit={handleEnviarInteresVecino} className="pv-form-vecino">
              <div className="input-group">
                <label htmlFor="vecino-nombre">Nombre Completo (*)</label>
                <input
                  id="vecino-nombre"
                  name="nombre"
                  type="text"
                  required
                  value={datosVecino.nombre}
                  onChange={handleVecinoChange}
                />
              </div>

              <div className="input-group">
                <label htmlFor="vecino-rut">RUT (*)</label>
                <input
                  id="vecino-rut"
                  name="rut"
                  type="text"
                  required
                  placeholder="Ej: 12.345.678-9"
                  value={datosVecino.rut}
                  onChange={handleVecinoChange}
                />
              </div>

              <div className="input-group">
                <label htmlFor="vecino-telefono">Teléfono (*)</label>
                <input
                  id="vecino-telefono"
                  name="telefono"
                  type="tel"
                  required
                  placeholder="Ej: 912345678"
                  value={datosVecino.telefono}
                  onChange={handleVecinoChange}
                />
              </div>

              <div className="input-group">
                <label htmlFor="vecino-email">Email (Opcional)</label>
                <input
                  id="vecino-email"
                  name="email"
                  type="email"
                  placeholder="Ej: vecino@correo.com"
                  value={datosVecino.email}
                  onChange={handleVecinoChange}
                />
              </div>

              <p style={{fontSize: "0.8rem", marginTop: "1rem"}}>
                (*) Campos obligatorios.
              </p>

              <div className="modal-actions">
                <button type="submit" className="pv-btn">
                  Enviar Interés
                </button>
                <button
                  type="button"
                  className="btn-cancelar"
                  onClick={() => setProyectoInteres(null)}
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* INVITA A SER SOCIO */}
      {showRegisterPrompt && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Postulación solo para Socios</h3>
            <p style={{ margin: "1rem 0" }}>
              Para postular a esta actividad de la Junta de Vecinos,
              necesitas ser un socio registrado.
            </p>
            <p>
              ¡Regístrate y participa en todos nuestros beneficios!
            </p>
            
            <div className="modal-actions" style={{ marginTop: '1.5rem' }}>
              <button
                type="button"
                className="btn-cancelar"
                onClick={() => setShowRegisterPrompt(false)}
              >
                Cerrar
              </button>
              
              {/* Este es el <Link> que tú querías */}
              <Link 
                to="/register" 
                className="pv-btn"
                onClick={() => setShowRegisterPrompt(false)} // Cierra el modal al navegar
              >
                Hazte Socio
              </Link>
            </div>
          </div>
        </div>
      )}


      {/* Modal para los mensajes */}
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
