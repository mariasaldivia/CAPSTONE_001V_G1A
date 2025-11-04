import { useEffect, useMemo, useRef, useState } from "react";
import PanelLateralD from "../../components/PanelLateralD";
import "./RequerimientosDirectiva.css";

/* =================== Helpers (mismos de Certificados) =================== */
const fmtDate = (iso) =>
  iso
    ? new Date(iso).toLocaleDateString(undefined, {
        year: "2-digit",
        month: "2-digit",
        day: "2-digit",
      })
    : "-";

/* =================== Íconos (mismos estilos) =================== */
const IconoVer = () => (
  <svg viewBox="0 0 24 24" className="cd__icon" aria-hidden="true">
    <path d="M12 5c5 0 9 5 9 7s-4 7-9 7-9-5-9-7 4-7 9-7zm0 2C8 7 4.9 10.5 4.2 12 4.9 13.5 8 17 12 17s7.1-3.5 7.8-5C19.1 10.5 16 7 12 7zm0 2a3 3 0 110 6 3 3 0 010-6z"/>
  </svg>
);
const IconoEliminar = () => (
  <svg viewBox="0 0 24 24" className="cd__icon" aria-hidden="true">
    <path d="M6 7h12v2H6V7zm2 3h8l-1 10H9L8 10zm3-7h2l1 2h4v2H4V5h4l1-2z"/>
  </svg>
);

/* =================== Datos de ejemplo (sustituir por API real) =================== */
const MOCK_PENDIENTES = [
  {
    ID_Req: "R10234",
    Folio: "R10234",
    Socio: "Claudia",
    Tipo: "Seguridad",
    Fecha_Solicitud: "2025-10-01T12:00:00",
    Estado: "Pendiente",
    Telefono: "+569 9999 9999",
    Direccion: "Calle 12 #345, Villa X",
    Detalle: "Solicito revisión de cámaras por incidentes ocurridos anoche en la calle 12.",
    Adjunto_URL: null
  },
  {
    ID_Req: "R10235",
    Folio: "R10235",
    Socio: "Jorge",
    Tipo: "Mejoras",
    Fecha_Solicitud: "2025-09-01T10:00:00",
    Estado: "Pendiente",
    Telefono: "+569 8888 8888",
    Direccion: "Los Robles 221, Villa Y",
    Detalle: "Petición de mejoras en columpio de la plazita. La cadena se encuentra cortada.",
    Adjunto_URL: "/img/N3_columpios2.png"
  },
  {
    ID_Req: "R10236",
    Folio: "R10236",
    Socio: "Fauget",
    Tipo: "Actividades",
    Fecha_Solicitud: "2025-10-01T12:20:00",
    Estado: "Pendiente",
    Telefono: "+569 7777 7777",
    Direccion: "Av. Central 123",
    Detalle: "Solicitud de permiso para actividad recreativa comunitaria.",
    Adjunto_URL: null
  }
];

const MOCK_HIST = [
  { ID_Req: "R10234", Folio: "R10234", Socio: "Claudia",  Tipo: "Seguridad",  Estado: "Pendiente",  Fecha_Cambio: "2025-10-01T09:20:00" },
  { ID_Req: "R10235", Folio: "R10235", Socio: "Jorge",    Tipo: "Mejoras",    Estado: "Aprobado",   Fecha_Cambio: "2025-10-01T11:12:00" },
  { ID_Req: "R10230", Folio: "R10230", Socio: "Ana",      Tipo: "Eventos",    Estado: "Rechazado",  Fecha_Cambio: "2025-09-30T18:12:00" },
  { ID_Req: "R10229", Folio: "R10229", Socio: "Pedro",    Tipo: "Limpieza",   Estado: "Pendiente",  Fecha_Cambio: "2025-09-29T14:05:00" },
  { ID_Req: "R10228", Folio: "R10228", Socio: "Marcela",  Tipo: "Seguridad",  Estado: "Pendiente",  Fecha_Cambio: "2025-09-29T08:41:00" }
];

/* =================== Modal de Confirmación (estilo igual a Certificados) =================== */
function ConfirmModal({ open, kind = "approve", folio, datos, onCancel, onConfirm }) {
  if (!open) return null;

  const isApprove = kind === "approve";
  const title = isApprove ? "Confirmar aprobación" : "Confirmar rechazo";
  const actionWord = isApprove ? "aprobar" : "rechazar";
  const strongColorClass = isApprove ? "cd__btn cd__btn--ok" : "cd__btn cd__btn--danger";

  return (
    <div className="cd__modalBack" role="dialog" aria-modal="true" aria-labelledby="rd-confirm-title">
      <div className="cd__modal">
        <div className="cd__modalHead">
          <span className="cd__modalAttention">ATENCIÓN</span>
          <h3 id="rd-confirm-title">{title}</h3>
        </div>

        <div className="cd__modalBody">
          <p>
            Estás a punto de <strong>{actionWord}</strong> el requerimiento
            {folio ? <> con folio <strong>{folio}</strong></> : null}. Esta acción es
            <strong> irreversible</strong>.
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
          <button type="button" className="cd__btn cd__btn--ghost" onClick={onCancel}>
            Cancelar
          </button>
          <button type="button" className={strongColorClass} onClick={onConfirm}>
            Aceptar
          </button>
        </div>
      </div>
    </div>
  );
}

/* =================== Página (mismo layout y clases .cd) =================== */
function RequerimientosContent() {
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

  const topRef = useRef(null);
  const detailRef = useRef(null);
  const historyRef = useRef(null);

  useEffect(() => {
    (async () => {
      // ↓ Sustituir por llamadas reales al ReqsAPI cuando lo tengas
      setLoadingList(true);
      setLoadingHist(true);
      try {
        setPendientes(MOCK_PENDIENTES);
        setHistorial(MOCK_HIST);
      } finally {
        setLoadingList(false);
        setLoadingHist(false);
      }
    })();
  }, []);

  const pendientesOrdenados = useMemo(() => {
    const base = [...pendientes];
    if (orden === "recientes") {
      return base.sort((a, b) => new Date(b.Fecha_Solicitud || 0) - new Date(a.Fecha_Solicitud || 0));
    }
    return base;
  }, [orden, pendientes]);

  const histList = useMemo(() => {
    const rows = (historial || []).map((h) => ({
      folio: h.Folio || h.ID_Req || "-",
      socio: h.Socio || "",
      tipo: h.Tipo || "",
      estado: h.Estado || "",
      ts: h.Fecha_Cambio || h.ts || "",
      idReq: h.ID_Req
    }));
    const byTsDesc = (a, b) => new Date(b.ts) - new Date(a.ts);
    const byTsAsc = (a, b) => new Date(a.ts) - new Date(b.ts);
    switch (histOrder) {
      case "antiguos":    return rows.sort(byTsAsc);
      case "aprobados":   return rows.filter((r) => r.estado === "Aprobado").sort(byTsDesc);
      case "rechazados":  return rows.filter((r) => r.estado === "Rechazado").sort(byTsDesc);
      case "pendientes":  return rows.filter((r) => r.estado === "Pendiente").sort(byTsDesc);
      default:            return rows.sort(byTsDesc);
    }
  }, [histOrder, historial]);

  const scrollTo = (ref) => ref?.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  const openDetail = (row) => { setSeleccion(row); setTimeout(() => scrollTo(detailRef), 0); };
  const closeDetail = () => { setSeleccion(null); setTimeout(() => scrollTo(topRef), 0); };
  const toggleHistory = () => { setShowHistory((s) => !s); setSeleccion(null); setTimeout(() => scrollTo(historyRef), 0); };

  /* ===== Acciones base ===== */
  const aprobarBase = async () => {
    if (!seleccion) return;
    try {
      setBusy(true);
      // await ReqsAPI.cambiarEstado(seleccion.ID_Req, { estado: "Aprobado", comentario: respuesta || "Aprobado" });
      alert("✅ Requerimiento aprobado.");
      setSeleccion(null); setRespuesta("");
    } catch (e) {
      console.error(e); alert("No se pudo aprobar.");
    } finally { setBusy(false); }
  };

  const rechazarBase = async () => {
    if (!seleccion) return;
    try {
      setBusy(true);
      // await ReqsAPI.cambiarEstado(seleccion.ID_Req, { estado: "Rechazado", comentario: respuesta || "Rechazado" });
      alert("❌ Requerimiento rechazado.");
      setSeleccion(null); setRespuesta("");
    } catch (e) {
      console.error(e); alert("No se pudo rechazar.");
    } finally { setBusy(false); }
  };

  /* ===== Abrir modales ===== */
  const abrirConfirmAprobar = () => { if (!seleccion) return; setShowApprove(true); };
  const abrirConfirmRechazar = () => { if (!seleccion) return; setShowReject(true); };

  /* ===== Confirmar desde modal ===== */
  const confirmarAprobar = async () => { setShowApprove(false); await aprobarBase(); };
  const confirmarRechazar = async () => { setShowReject(false); await rechazarBase(); };

  const pedirMasInfo = () => {
    if (!seleccion) return;
    const correo = seleccion?.Correo || seleccion?.Email || "";
    if (correo) alert(`📨 Pedir más info a ${correo}`);
    else alert("📨 No hay correo registrado para este requerimiento.");
  };

  const onHistView = async (folio) => {
    try {
      setBusy(true);
      const row = (pendientes.find(p => p.Folio === folio) || historial.find(h => h.Folio === folio)) ?? null;
      if (!row) { alert("No se pudo abrir el detalle."); return; }
      // Normalizo a la forma del detalle:
      const detail = pendientes.find(p => p.Folio === folio) || {
        ID_Req: row.ID_Req,
        Folio: row.Folio,
        Socio: row.Socio,
        Tipo: row.Tipo,
        Estado: row.Estado,
        Fecha_Solicitud: row.Fecha_Cambio,
        Telefono: row.Telefono,
        Direccion: row.Direccion,
        Detalle: row.Detalle,
        Adjunto_URL: row.Adjunto_URL
      };
      setSeleccion(detail);
      setTimeout(() => scrollTo(detailRef), 0);
    } catch (e) {
      console.error(e); alert("No se pudo abrir el detalle.");
    } finally { setBusy(false); }
  };

  const onHistDelete = async (folio) => {
    if (!confirm(`¿Eliminar el requerimiento ${folio}? Esta acción no se puede deshacer.`)) return;
    try {
      setBusy(true);
      // UI optimista
      setHistorial((prev) => (prev || []).filter((h) => (h.Folio || h.ID_Req) !== folio));
      setPendientes((prev) => (prev || []).filter((p) => p.Folio !== folio));
      // await ReqsAPI.eliminarPorFolio(folio);
      alert("🗑️ Eliminado.");
      if (seleccion?.Folio === folio) setSeleccion(null);
    } catch (e) {
      console.error(e); alert("No se pudo eliminar.");
    } finally { setBusy(false); }
  };

  const hasDetail = Boolean(seleccion);

  return (
    <div className="cd" ref={topRef}>
      {/* Header */}
      <header className="cd__header">
        <div className="cd__headerRow">
          <h1 className="cd__title">Requerimientos</h1>
          <div className="cd__actionsTop">
            {/* SIN exportación (eliminado) */}
            <button className="cd__btn cd__btn--ghost" onClick={toggleHistory}>
              {showHistory ? "Ocultar historial" : "Historial"}
            </button>
          </div>
        </div>
        <p className="cd__desc">
          Gestiona <strong>requerimientos pendientes</strong> y consulta el <strong>historial</strong>.
        </p>
      </header>

      {/* Main */}
      <section className={`cd__gridMain ${hasDetail ? "has-detail" : ""}`}>
        {/* Pendientes */}
        <section className="cd__card cd__list">
          <div className="cd__listHead">
            <h2>Requerimientos (Pendientes)</h2>
            <label className="cd__order">
              Ordenar por{" "}
              <select value={orden} onChange={(e) => setOrden(e.target.value)} aria-label="Ordenar lista">
                <option value="recientes">Más recientes</option>
              </select>
            </label>
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
                    <td><button className="cd__btn cd__btn--ghost" onClick={() => openDetail(r)}>Revisar</button></td>
                  </tr>
                ))}
                {!loadingList && pendientesOrdenados.length === 0 && <tr><td colSpan="6">Sin requerimientos pendientes.</td></tr>}
              </tbody>
            </table>
          </div>
        </section>

        {/* Detalle */}
        {hasDetail && (
          <section className="cd__card cd__detail" ref={detailRef} id="cd-detail">
            <div className="cd__detailHead">
              <h2>Detalle del requerimiento</h2>
              <button className="cd__btn cd__btn--ghost" onClick={closeDetail}>Cerrar</button>
            </div>

            <div className="cd__detailGrid">
              <div className="cd__kv"><span className="cd__k">Folio</span><span className="cd__v">{seleccion.Folio}</span></div>
              <div className="cd__kv"><span className="cd__k">Socio</span><span className="cd__v">{seleccion.Socio} {seleccion.Telefono ? `· ${seleccion.Telefono}` : ""}</span></div>
              <div className="cd__kv"><span className="cd__k">Dirección</span><span className="cd__v">{seleccion.Direccion || "-"}</span></div>
              <div className="cd__kv"><span className="cd__k">Tipo</span><span className="cd__v">{seleccion.Tipo}</span></div>
              <div className="cd__kv"><span className="cd__k">Estado</span><span className="cd__v"><span className="cd__badge is-review">{seleccion.Estado}</span></span></div>

              <div className="cd__block">
                <span className="cd__k">Detalle</span>
                <div className="cd__v cd__textBlock">{seleccion.Detalle || "-"}</div>
              </div>

              {seleccion.Adjunto_URL && (
                <div className="cd__block">
                  <span className="cd__k">Adjunto</span>
                  <div className="cd__file">
                    <img src={seleccion.Adjunto_URL} alt={`Adjunto del requerimiento ${seleccion.Folio}`} />
                  </div>
                </div>
              )}

              <div className="cd__actionsRow">
                <button className="cd__btn cd__btn--ok" onClick={abrirConfirmAprobar} disabled={busy}>Aprobar</button>
                <button className="cd__btn cd__btn--danger" onClick={abrirConfirmRechazar} disabled={busy}>Rechazar</button>
                <button className="cd__btn cd__btn--warn" onClick={pedirMasInfo} disabled={busy}>Pedir más info</button>
              </div>

              <div className="cd__resp">
                <label htmlFor="resp">Comentario para el vecino</label>
                <textarea
                  id="resp" rows={4}
                  value={respuesta}
                  onChange={(e) => setRespuesta(e.target.value)}
                  placeholder="Escribe aquí tu comentario…"
                />
              </div>
            </div>
          </section>
        )}
      </section>

      {/* Historial */}
      {showHistory && (
        <section className="cd__card cd__history" ref={historyRef} id="cd-history">
          <div className="cd__historyHead">
            <h2>Historial de Requerimientos</h2>
            <label className="cd__order">
              Filtrar{" "}
              <select value={histOrder} onChange={(e) => setHistOrder(e.target.value)}>
                <option value="recientes">Recientes</option>
                <option value="antiguos">Antiguos</option>
                <option value="aprobados">Aprobados</option>
                <option value="rechazados">Rechazados</option>
                <option value="pendientes">Pendientes</option>
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
                  <tr key={`${h.folio}-${h.ts}`}>
                    <td>{h.folio}</td>
                    <td>{h.socio}</td>
                    <td>{h.tipo}</td>
                    <td>{fmtDate(h.ts)}</td>
                    <td>
                      <span className={"cd__badge " + (h.estado === "Pendiente" ? "is-pending" : h.estado === "Aprobado" ? "is-ok" : "is-bad")}>
                        {h.estado}
                      </span>
                    </td>
                    <td className="cd__td--icons">
                      <button className="cd__iconBtn" title="Ver" onClick={() => onHistView(h.folio)}><IconoVer /></button>
                      {/* Sin editar en requerimientos */}
                      <button className="cd__iconBtn" title="Eliminar" onClick={() => onHistDelete(h.folio)}><IconoEliminar /></button>
                    </td>
                  </tr>
                ))}
                {!loadingHist && histList.length === 0 && <tr><td colSpan="6">Sin registros.</td></tr>}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Modales de confirmación */}
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
    </div>
  );
}

/* =================== Wrapper =================== */
export default function RequerimientosDirectiva() {
  const user = { nombre: "Nombre Directiva", cargo: "Cargo" };
  return (
    <PanelLateralD title="Requerimientos" user={user} showTopUser={false}>
      <RequerimientosContent />
    </PanelLateralD>
  );
}
