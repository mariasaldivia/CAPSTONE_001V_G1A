// src/Modulos/Requerimientos/RequerimientosDirectiva.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import PanelLateralD from "../../components/PanelLateralD";
import Modal from "../../components/Modal"; 
import "./RequerimientosDirectiva.css";

/* =================== Config =================== */
const API_BASE = (
  import.meta.env.VITE_API_URL ||
  import.meta.env.VITE_API_BASE ||
  "http://localhost:4010"
).replace(/\/+$/, "");

/* =================== Helpers (Adaptados) =================== */

// (Función para leer el usuario de la sesión, la necesitamos para el ID de Admin)
function leerUsuarioSesion() {
  try {
    const raw = localStorage.getItem("usuario") || sessionStorage.getItem("usuario");
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

const fmtDate = (iso) =>
  iso
    ? new Date(iso).toLocaleDateString(undefined, {
        year: "2-digit",
        month: "2-digit",
        day: "2-digit",
      })
    : "-";

const normalizeUrl = (u) => {
  if (!u) return null;
  let s = String(u).trim().replace(/\\/g, "/");
  if (/^https?:\/\//i.test(s)) return s;
  if (s.startsWith("/")) return `${API_BASE}${s}`;
  if (s.startsWith("uploads/")) return `${API_BASE}/${s}`;
  return `${API_BASE}/uploads/requerimientos/${s}`;
};

/** * Normaliza un registro de BUZON_VECINAL (la nueva tabla) 
 * para que coincida con lo que el JSX espera.
 */
const normRequer = (r) => ({
  ID_Req: r.ID_Buzon || r.ID_Buzon_FK || r.ID_Historial,
  Folio: r.Folio,
  Rut: r.RUT,
  Socio: r.NombreSocio,
  Telefono: r.Telefono,
  Email: r.Email,
  Tipo: r.Asunto,
  Direccion: r.Direccion,
  Detalle: r.Mensaje,
  Estado: r.Estado,
  Fecha_Solicitud: r.FechaCreacion || r.FechaResuelto,
  Adjunto_URL: normalizeUrl(r.ImagenURL),
  // Mapeamos los campos de resolución
  Actor: r.ResueltoPor_ID, // (Podríamos hacer JOIN para el nombre)
  Respuesta_Admin: r.RespuestaAdmin,
});

/* =================== API wrapper (¡NUEVO!) =================== */
const ReqsAPI = {

  // Llama a: GET /api/requerimientos?estado=Pendiente
  async listarPendientes() {
    const resp = await fetch(`${API_BASE}/api/requerimientos?estado=Pendiente`, {
      credentials: "include",
    });
    const json = await resp.json().catch(() => ({}));
    if (!resp.ok || json?.ok === false) {
      throw new Error(json?.message || "No se pudo cargar pendientes");
    }
    const rows = json?.data || json || [];
    return rows.map(normRequer);
  },


  // --- REEMPLAZA ESTA FUNCIÓN COMPLETA ---
  async listarHistorial() {
    try {
      // 1. Llama a "Resuelto" y "En Revisión" en paralelo
      const [resueltosResp, enRevisionResp] = await Promise.all([
        fetch(`${API_BASE}/api/requerimientos?estado=Resuelto`, { credentials: "include" }),
        fetch(`${API_BASE}/api/requerimientos?estado=En Revisión`, { credentials: "include" })
      ]);

      // 2. Revisa si AMBAS llamadas fueron exitosas
      if (!resueltosResp.ok || !enRevisionResp.ok) {
        // Si una falla, lanza el error
        throw new Error("Una de las sub-consultas del historial falló.");
      }

      // 3. Parsea los JSON
      const jsonResueltos = await resueltosResp.json().catch(() => ({}));
      const jsonEnRevision = await enRevisionResp.json().catch(() => ({}));

      const dataResueltos = jsonResueltos?.data || [];
      const dataEnRevision = jsonEnRevision?.data || [];

      // 4. Combina y normaliza
      const allHistorical = [...dataResueltos, ...dataEnRevision];
      return allHistorical;

    } catch (e) {
      console.error("Error en ReqsAPI.listarHistorial:", e);
      // 5. Lanza el error que el modal SÍ entiende
      throw new Error("No se pudo cargar historial");
    }
  },


  // Llama a: PATCH /api/requerimientos/:id/estado
  async cambiarEstado(id, { estadoNuevo, respuestaAdmin, idAdmin }) {
    const resp = await fetch(`${API_BASE}/api/requerimientos/${id}/estado`, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ estadoNuevo, respuestaAdmin, idAdmin }),
    });
    const json = await resp.json().catch(() => ({}));
    if (!resp.ok || json?.ok === false) {
      throw new Error(json?.message || "No se pudo cambiar el estado");
    }
    return json ?? {};
  },

  // (Por ahora no tenemos DELETE en la API nueva, lo dejamos pendiente)
  async eliminarPorFolio(folio) {
    console.warn("eliminarPorFolio no está implementado en la API V4");
    return Promise.resolve(true); 
  },

  // (La bitácora la llamaremos desde el detalle si es necesario)
  async obtenerBitacora(idBuzon) {
    const resp = await fetch(`${API_BASE}/api/requerimientos/${idBuzon}/bitacora`, {
      credentials: "include",
    });
    const json = await resp.json().catch(() => ({}));
    if (!resp.ok || json?.ok === false) {
      throw new Error(json?.message || "No se pudo obtener la bitácora");
    }
    return json?.data || [];
  },
};

/* =================== Modales de Confirmación =================== */

function ConfirmModal({ open, kind = "approve", folio, datos, onCancel, onConfirm }) {
  if (!open) return null;
  const isApprove = kind === "approve";
  const title = isApprove ? "Confirmar Aprobación" : "Confirmar Rechazo";
  const actionWord = isApprove ? "Aprobar" : "Rechazar";
  const strongColorClass = isApprove ? "cd__btn cd__btn--ok" : "cd__btn cd__btn--danger";

  return (
    <div className="cd__modalBack" role="dialog" aria-modal="true" aria-labelledby="rd-confirm-title">
      <div className="cd__modal">
        <div className="cd__modalHead">
          <span className="cd__modalAttention" style={!isApprove ? {backgroundColor: '#ef4444'} : {}}>ATENCIÓN</span>
          <h3 id="rd-confirm-title">{title}</h3>
        </div>
        <div className="cd__modalBody">
          <p>
            Estás a punto de <strong>{actionWord}</strong> el requerimiento
            {folio ? <> con folio <strong>{folio}</strong></> : null}.
          </p>
          {datos && (
            <div className="cd__modalData">
              <p><b>Socio:</b> {datos.socio || "-"}</p>
              <p><b>Tipo:</b> {datos.tipo || "-"}</p>
              <p><b>Dirección:</b> {datos.direccion || "-"}</p>
              {datos.telefono ? <p><b>Teléfono:</b> {datos.telefono}</p> : null}
            </div>
          )}
        </div>
        <div className="cd__modalActions">
          <button type="button" className="cd__btn cd__btn--ghost" onClick={onCancel}>Cancelar</button>
          <button type="button" className={strongColorClass} onClick={onConfirm}>{actionWord}</button>
        </div>
      </div>
    </div>
  );
}

// (Modal de Borrado que hicimos en Perfil, lo traemos aquí)
function DeleteConfirmModal({ open, onClose, onConfirm, folio }) {
  if (!open) return null;
  return (
    <div className="cd__modalBack" role="dialog" aria-modal="true" aria-labelledby="cd-delete-title">
      <div className="cd__modal">
        <div className="cd__modalHead">
          <span className="cd__modalAttention" style={{ backgroundColor: '#ef4444' }}>PELIGRO</span>
          <h3 id="cd-delete-title">Confirmar Eliminación</h3>
        </div>
        <div className="cd__modalBody">
          <p>
            ¿Estás seguro de que quieres eliminar la solicitud
            {folio ? <> con folio <strong>{folio}</strong></> : null}?
          </p>
          <p style={{ fontWeight: 'bold', color: '#ef4444' }}>
            Esta acción no se puede deshacer (aún no implementada).
          </p>
        </div>
        <div className="cd__modalActions">
          <button className="cd__btn cd__btn--ghost" onClick={onClose}>Cancelar</button>
          <button className="cd__btn cd__btn--danger" onClick={onConfirm}>Confirmar Eliminación</button>
        </div>
      </div>
    </div>
  );
}


/* =================== Página principal =================== */
function RequerimientosContent({ directivaNombre = "Directiva" }) {
  const [orden, setOrden] = useState("recientes");
  const [seleccion, setSeleccion] = useState(null);
  const [respuesta, setRespuesta] = useState("");

  const [showHistory, setShowHistory] = useState(true);
  const [histOrder, setHistOrder] = useState("recientes");

  const [pendientes, setPendientes] = useState([]);
  const [historial, setHistorial] = useState([]);
  const [loadingList, setLoadingList] = useState(false);
  const [loadingHist, setLoadingHist] = useState(false);
  const [busy, setBusy] = useState(false);

  const [showApprove, setShowApprove] = useState(false);
  const [showReject, setShowReject] = useState(false);
  const [folioToDelete, setFolioToDelete] = useState(null);

  // ¡NUESTRO MODAL DE NOTIFICACIÓN!
  const [modalState, setModalState] = useState({
    isOpen: false, type: 'info', title: '', message: ''
  });

  const topRef = useRef(null);
  const detailRef = useRef(null);
  const historyRef = useRef(null);

  // Carga inicial
// --- REEMPLAZA TU USEEFFECT COMPLETO POR ESTE ---
  useEffect(() => {
    (async () => {
      setLoadingList(true);
      setLoadingHist(true);
      try {
        const [p, h] = await Promise.all([
          ReqsAPI.listarPendientes(),
          ReqsAPI.listarHistorial(), // Llama a la nueva ruta
        ]);
        setPendientes(p);
        setHistorial(h);
      } catch (e) {
        console.error(e);
        setModalState({ isOpen: true, type: 'error', title: 'Error de Carga', message: e.message || "No se pudo cargar la información inicial." });
      } finally {
        setLoadingList(false);
        setLoadingHist(false);
      }
    })();
  }, []); // El array vacío [] asegura que esto se ejecute solo una vez
  // --- FIN DEL REEMPLAZO ---FIN DEL REEMPLAZO ---

  // --- Listas Memoizadas (Lógica sin cambios) ---
  const pendientesOrdenados = useMemo(() => {
    const base = [...pendientes];
    if (orden === "recientes") {
      return base.sort((a, b) => new Date(b.Fecha_Solicitud || 0) - new Date(a.Fecha_Solicitud || 0));
    }
    return base;
  }, [orden, pendientes]);

  const histList = useMemo(() => {
    const rows = historial.map(normRequer); // Usamos el normalizador
    const byTsDesc = (a, b) => new Date(b.Fecha_Solicitud || 0) - new Date(a.Fecha_Solicitud || 0);
    const byTsAsc = (a, b) => new Date(a.Fecha_Solicitud || 0) - new Date(b.Fecha_Solicitud || 0);
    
    switch (histOrder) {
      case "antiguos": return rows.sort(byTsAsc);
      case "aprobados": return rows.filter((r) => r.Estado === "Resuelto").sort(byTsDesc);
      case "en_revision": return rows.filter((r) => r.Estado === "En Revisión").sort(byTsDesc);
      default: return rows.sort(byTsDesc);
    }
  }, [histOrder, historial]);

  // --- Helpers UI (Lógica sin cambios) ---
  const scrollTo = (ref) => ref?.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  const openDetail = (row) => { setSeleccion(row); setTimeout(() => scrollTo(detailRef), 0); };
  const closeDetail = () => { setSeleccion(null); setTimeout(() => scrollTo(topRef), 0); };
  const toggleHistory = () => { setShowHistory((s) => !s); setSeleccion(null); setTimeout(() => scrollTo(historyRef), 0); };

  /* ===================
   * ACCIONES (¡NUEVAS!)
   * =================== */
  
  // Función genérica para cambiar estado
  const handleChangeEstado = async (nuevoEstado, comentario) => {
    if (!seleccion?.ID_Req) return;
    
    // Obtenemos el ID del admin desde el localStorage
    const sesion = leerUsuarioSesion();
    // LÍNEA CORRECTA
    const adminId = sesion?.ID_Usuario || sesion?.id;

    if (!adminId) {
      setModalState({ isOpen: true, type: 'error', title: 'Error', message: 'No se pudo identificar al administrador. Vuelve a iniciar sesión.' });
      return;
    }

    try {
      setBusy(true);
      setShowApprove(false);
      setShowReject(false);
      
      await ReqsAPI.cambiarEstado(seleccion.ID_Req, {
        estadoNuevo: nuevoEstado, // "En Revisión" o "Resuelto"
        respuestaAdmin: comentario?.trim() || nuevoEstado,
        idAdmin: adminId,
      });

      // Actualización optimista de la UI
      setPendientes((prev) => prev.filter((p) => p.ID_Req !== seleccion.ID_Req));
      
      const itemActualizado = { ...seleccion, Estado: nuevoEstado, Actor: directivaNombre };
      setHistorial((prev) => [itemActualizado, ...prev.filter(p => p.ID_Req !== seleccion.ID_Req)]);
      setSeleccion(itemActualizado); // Actualiza el panel de detalle
      setRespuesta("");
      
      setModalState({ isOpen: true, type: 'success', title: 'Éxito', message: `Requerimiento marcado como ${nuevoEstado}.` });

    } catch (e) {
      console.error(e);
      setModalState({ isOpen: true, type: 'error', title: 'Error', message: e.message || `No se pudo ${nuevoEstado.toLowerCase()} el ticket.` });
    } finally {
      setBusy(false);
    }
  };

  // --- Funciones adaptadas ---
  const abrirConfirmAprobar = () => { if (!seleccion) return; setShowApprove(true); };
  const abrirConfirmRechazar = () => { if (!seleccion) return; setShowReject(true); };
  
  const confirmarAprobar = () => handleChangeEstado("Resuelto", respuesta);
  const confirmarRechazar = () => {
    // (Tu API no tiene estado "Rechazado", pero podemos adaptarlo si lo necesitas)
    // (Por ahora, lo cambiaremos a "Resuelto" con un comentario de rechazo)
    console.warn("El estado 'Rechazado' no está en la BDD, se guardará como 'Resuelto' con comentario.");
    handleChangeEstado("Resuelto", respuesta?.trim() || "Rechazado");
  };

  // Esta función ahora solo llama a "En Revisión"
  const marcarEnRevision = () => handleChangeEstado("En Revisión", respuesta);

  // (onHistView ya no es necesaria, la tabla de historial carga todo)
  const onHistView = (row) => {
    openDetail(row);
  };
  
  // (onHistDelete ahora solo abre el modal)
  const onHistDelete = (folio) => {
    setFolioToDelete(folio); 
  };
  
  const handleConfirmDelete = async () => {
    // (Aún no hemos implementado 'eliminar' en la API nueva)
    setModalState({ isOpen: true, type: 'info', title: 'Info', message: 'La función de eliminar aún no está implementada.' });
    setFolioToDelete(null);
  };

  const hasDetail = Boolean(seleccion);
  // El estado final ahora es "Resuelto"
  const isFinal = hasDetail && (seleccion.Estado === "Resuelto"); 
  const isPendiente = hasDetail && (seleccion.Estado === "Pendiente");

  /* =================== Render =================== */
  return (
    <div className="cd" ref={topRef}>
      {/* Header (sin cambios) */}
      <header className="cd__header">
        <div className="cd__headerRow">
          <h1 className="cd__title">Requerimientos</h1>
          <div className="cd__actionsTop">
            <button className="cd__btn cd__btn--ghost" onClick={toggleHistory}>
              {showHistory ? "Ocultar historial" : "Historial"}
            </button>
          </div>
        </div>
        <p className="cd__desc">
          Gestiona <strong>requerimientos pendientes</strong> y consulta el <strong>historial</strong>.
        </p>
      </header>

      {/* Main Grid */}
      <section className={`cd__gridMain ${hasDetail ? "has-detail" : ""}`}>
        
        {/* Lista de Pendientes (Adaptada) */}
        <section className="cd__card cd__list">
          <div className="cd__listHead">
            <h2>Requerimientos (Pendientes)</h2>
            {/* (Select de orden sin cambios) */}
          </div>

          <div className="cd__tableWrap">
            <table className="cd__table">
              <thead>
                <tr>
                  <th>N°</th><th>Socio</th><th>Tipo</th><th>Fecha</th><th>Estado</th><th>Acción</th>
                </tr>
              </thead>
              <tbody>
                {loadingList && <tr><td colSpan="6">Cargando…</td></tr>}
                {!loadingList && pendientesOrdenados.map((r) => (
                  <tr key={r.ID_Req} className={seleccion?.ID_Req === r.ID_Req ? "is-sel" : ""}>
                    <td>{r.Folio}</td>
                    <td>{r.Socio}</td>
                    <td>{r.Tipo}</td>
                    <td>{fmtDate(r.Fecha_Solicitud)}</td>
                    <td><span className="cd__badge is-pending">{r.Estado}</span></td>
                    <td>
                      <button className="cd__btn cd__btn--ghost" onClick={() => openDetail(r)}>
                        Revisar
                      </button>
                    </td>
                  </tr>
                ))}
                {!loadingList && pendientesOrdenados.length === 0 && <tr><td colSpan="6">Sin requerimientos pendientes.</td></tr>}
              </tbody>
            </table>
          </div>
        </section>

        {/* Panel de Detalle (Adaptado) */}
        {hasDetail && (
          <section className="cd__card cd__detail" ref={detailRef} id="cd-detail">
            <div className="cd__detailHead">
              <h2>Detalle del requerimiento</h2>
              <button className="cd__btn cd__btn--ghost" onClick={closeDetail}>Cerrar</button>
            </div>

            <div className="cd__detailGrid">
              <div className="cd__kv"><span className="cd__k">Folio</span><span className="cd__v">{seleccion.Folio}</span></div>
              <div className="cd__kv"><span className="cd__k">Socio</span><span className="cd__v">{seleccion.Socio}</span></div>
              <div className="cd__kv"><span className="cd__k">RUT</span><span className="cd__v">{seleccion.Rut || "-"}</span></div>
              <div className="cd__kv"><span className="cd__k">Teléfono</span><span className="cd__v">{seleccion.Telefono || "-"}</span></div>
              <div className="cd__kv"><span className="cd__k">Correo</span><span className="cd__v">{seleccion.Email || "-"}</span></div>
              <div className="cd__kv"><span className="cd__k">Dirección</span><span className="cd__v">{seleccion.Direccion || "-"}</span></div>
              <div className="cd__kv"><span className="cd__k">Tipo</span><span className="cd__v">{seleccion.Tipo}</span></div>
              <div className="cd__kv">
                <span className="cd__k">Estado</span>
                <span className="cd__v">
                  <span className={"cd__badge " + (isFinal ? "is-ok" : (seleccion.Estado === "En Revisión" ? "is-review" : "is-pending"))}>
                    {seleccion.Estado}
                  </span>
                </span>
              </div>
              <div className="cd__block">
                <span className="cd__k">Detalle</span>
                <div className="cd__v cd__textBlock">{seleccion.Detalle || "-"}</div>
              </div>

              {seleccion.Adjunto_URL && (
                <div className="cd__block">
                  <span className="cd__k">Imagen</span>
                  <div className="cd__file">
                    <img
                      src={seleccion.Adjunto_URL}
                      alt={`Adjunto del requerimiento ${seleccion.Folio}`}
                      loading="lazy"
                    />
                  </div>
                </div>
              )}

              {/* Acciones (Adaptadas) */}
              <div className="cd__actionsRow">
                {!isFinal && (
                  <>
                    {/* * Botón #1: Resolver (Aprobar)
                      * Aparece si está Pendiente O En Revisión.
                    */}
                    <button className="cd__btn cd__btn--ok" onClick={abrirConfirmAprobar} disabled={busy}>
                      Resolver
                    </button>

                    {/* * Botón #2: Marcar "En Revisión" (con comentario)
                      * Aparece SÓLO si está Pendiente.
                    */}
                    {isPendiente && (
                      <button className="cd__btn cd__btn--info" onClick={marcarEnRevision} disabled={busy}>
                        Enviar Comentario y Revisar
                      </button>
                    )}
                  </>
                )}
              </div>

              {/* Comentario (Adaptado) */}
              {isPendiente ? (
                <div className="cd__resp">
                  <label htmlFor="resp">Comentario / Respuesta</label>
                  <textarea
                    id="resp" rows={4}
                    value={respuesta}
                    onChange={(e) => setRespuesta(e.target.value)}
                    placeholder="Escribe aquí la respuesta o un comentario interno..."
                  />
                </div>
              ) : (
                <div className="cd__block">
                  <span className="cd__k">Respuesta de Directiva</span>
                  <div className="cd__v cd__textBlock">{seleccion.Respuesta_Admin || "Sin comentario."}</div>
                </div>
              )}
            </div>
          </section>
        )}
      </section>

      {/* Historial (Adaptado) */}
      {showHistory && (
        <section className="cd__card cd__history" ref={historyRef} id="cd-history">
          <div className="cd__historyHead">
            <h2>Historial (Resueltos / En Revisión)</h2>
            <label className="cd__order">
              Filtrar{" "}
              <select value={histOrder} onChange={(e) => setHistOrder(e.target.value)}>
                <option value="recientes">Recientes</option>
                <option value="antiguos">Antiguos</option>
                <option value="aprobados">Resueltos</option>
                <option value="en_revision">En Revisión</option>
              </select>
            </label>
          </div>

          <div className="cd__tableWrap">
            <table className="cd__table cd__table--history">
              <thead>
                <tr>
                  <th>N°</th><th>Socio</th><th>Tipo</th><th>Fecha</th><th>Estado</th><th className="cd__th--icons">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {loadingHist && <tr><td colSpan="6">Cargando…</td></tr>}
                {!loadingHist && histList.map((h) => (
                  <tr key={h.Folio}> {/* Asumimos Folio es único en historial */}
                    <td>{h.Folio}</td>
                    <td>{h.Socio}</td>
                    <td>{h.Tipo}</td>
                    <td>{fmtDate(h.Fecha_Solicitud)}</td>
                    <td>
                      <span className={"cd__badge " + (h.Estado === "Resuelto" ? "is-ok" : "is-review")}>
                        {h.Estado}
                      </span>
                    </td>
                    <td className="cd__td--icons">
                      <button className="cd__chipIcon" title="Ver" onClick={() => onHistView(h)}>
                        <span className="ico ico-view" aria-hidden />
                      </button>
                      <button className="cd__chipIcon" title="Eliminar" onClick={() => onHistDelete(h.Folio)}>
                        <span className="ico ico-trash" aria-hidden />
                      </button>
                    </td>
                  </tr>
                ))}
                {!loadingHist && histList.length === 0 && <tr><td colSpan="6">Sin registros.</td></tr>}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Modales (Adaptados) */}
      <ConfirmModal
        open={showApprove}
        kind="approve"
        folio={seleccion?.Folio}
        datos={{
          socio: seleccion?.Socio,
          tipo: seleccion?.Tipo,
          direccion: seleccion?.Direccion,
          telefono: seleccion?.Telefono,
        }}
        onCancel={() => setShowApprove(false)}
        onConfirm={confirmarAprobar}
      />
      <ConfirmModal
        open={showReject}
        kind="reject"
        folio={seleccion?.Folio}
        datos={{
          socio: seleccion?.Socio,
          tipo: seleccion?.Tipo,
          direccion: seleccion?.Direccion,
          telefono: seleccion?.Telefono,
        }}
        onCancel={() => setShowReject(false)}
        onConfirm={confirmarRechazar}
      />
      
      {/* ¡Tu Modal Reutilizable! */}
      <Modal 
        isOpen={modalState.isOpen} 
        onClose={() => setModalState({ ...modalState, isOpen: false })} 
        title={modalState.title}
        type={modalState.type}
      >
        <p>{modalState.message}</p> 
      </Modal>

      {/* Modal de Borrado */}
      <DeleteConfirmModal
        open={!!folioToDelete}
        onClose={() => setFolioToDelete(null)}
        onConfirm={handleConfirmDelete}
        folio={folioToDelete}
      />
    </div>
  );
}

/* =================== Wrapper (sin cambios) =================== */
export default function RequerimientosDirectiva() {
  // Aquí deberías leer el usuario real de la sesión
  const sesion = leerUsuarioSesion();
  const nombreAdmin = sesion?.usuario?.Nombre_Usuario || "Directiva";

  return (
    <PanelLateralD title="Requerimientos" user={{ nombre: nombreAdmin }} showTopUser={false}>
      <RequerimientosContent directivaNombre={nombreAdmin} />
    </PanelLateralD>
  );
}