// src/Modulos/Requerimientos/RequerimientosDirectiva.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import PanelLateralD from "../../components/PanelLateralD";
import "./RequerimientosDirectiva.css";

/* =================== Config =================== */
const API_BASE = (
  import.meta.env.VITE_API_URL ||
  import.meta.env.VITE_API_BASE ||
  "http://localhost:4010"
).replace(/\/+$/, "");

/* =================== Helpers =================== */
const fmtDate = (iso) =>
  iso
    ? new Date(iso).toLocaleDateString(undefined, {
        year: "2-digit",
        month: "2-digit",
        day: "2-digit",
      })
    : "-";

/** Asegura URL pública para adjuntos (maneja \, relativas, /uploads, nombre suelto) */
const normalizeUrl = (u) => {
  if (!u) return null;
  let s = String(u).trim().replace(/\\/g, "/");
  if (/^https?:\/\//i.test(s)) return s;
  if (s.startsWith("/")) return `${API_BASE}${s}`;
  if (s.startsWith("uploads/")) return `${API_BASE}/${s}`;
  return `${API_BASE}/uploads/requerimientos/${s}`;
};

/** Normaliza un registro de requerimientos (tabla principal) al shape del detalle */
const normRequer = (r) => ({
  ID_Req: r.ID ?? r.Id ?? r.id ?? null,
  Folio: r.FOLIO ?? r.Folio ?? "-",
  Rut: r.PERFIL_RUT ?? r.Rut ?? r.RUT ?? "",
  Socio: r.NOMBRE_SOLICITANTE ?? r.Socio ?? "",
  Telefono: r.TELEFONO ?? r.Telefono ?? "", // ← vendrá del JOIN con SOCIOS
  Email: r.EMAIL_SOLICITANTE ?? r.EMAIL ?? r.Email ?? "",
  Tipo: r.ASUNTO ?? r.Tipo ?? "",
  Direccion: r.DIRECCION ?? r.Direccion ?? "",
  Detalle: r.DESCRIPCION ?? r.Detalle ?? "",
  Estado: r.ESTADO ?? r.Estado ?? "Pendiente",
  Fecha_Solicitud: r.CREATED_AT ?? r.CreatedAt ?? null,
  Adjunto_URL: normalizeUrl(r.IMAGEN_URL ?? r.Adjunto_URL ?? null),
  Actor: r.ACTOR_NOMBRE ?? r.VALIDADOR_NOMBRE ?? r.Actor ?? null,
});

/** Normaliza un registro de historial al shape usado en la tabla de historial */
const normHistRow = (h) => ({
  folio: h.FOLIO ?? h.Folio,
  socio: h.NOMBRE_SOLICITANTE ?? h.Socio ?? "",
  tipo: h.ASUNTO ?? h.Tipo ?? "",
  estado: h.ESTADO ?? h.Estado ?? "",
  ts: h.UPDATED_AT || h.CREATED_AT || null,
  idReq: h.ID ?? h.Id ?? null,
  direccion: h.DIRECCION ?? "",
  detalle: h.DESCRIPCION ?? "",
  imagen: normalizeUrl(h.IMAGEN_URL ?? null),
  validador: h.VALIDADOR_NOMBRE ?? null,
});

/* =================== API wrapper (alineado a tus rutas) =================== */
const ReqsAPI = {
  async listarPendientes() {
    const resp = await fetch(`${API_BASE}/api/requerimientos?estado=Pendiente`, {
      credentials: "include",
    });
    const json = await resp.json().catch(() => ({}));
    if (!resp.ok || json?.ok === false) {
      throw new Error(json?.error || "No se pudo cargar pendientes");
    }
    const rows = json?.data || json || [];
    return rows.map(normRequer);
  },

  async listarHistorial(estado = "") {
    const qs = estado ? `?estado=${encodeURIComponent(estado)}` : "";
    const resp = await fetch(`${API_BASE}/api/requerimientos/_historial/lista/all${qs}`, {
      credentials: "include",
    });
    const json = await resp.json().catch(() => ({}));
    if (!resp.ok || json?.ok === false) {
      throw new Error(json?.error || "No se pudo cargar historial");
    }
    const rows = json?.data || json || [];
    return rows.map(normHistRow);
  },

  async cambiarEstado(id, { estado, validadorNombre, comentario }) {
    const resp = await fetch(`${API_BASE}/api/requerimientos/${id}/estado`, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ estado, validadorNombre, comentario }),
    });
    const json = await resp.json().catch(() => ({}));
    if (!resp.ok || json?.ok === false) {
      throw new Error(json?.error || "No se pudo cambiar el estado");
    }
    return json?.data ?? {};
  },

  async eliminarPorFolio(folio) {
    const resp = await fetch(`${API_BASE}/api/requerimientos/folio/${encodeURIComponent(folio)}`, {
      method: "DELETE",
      credentials: "include",
    });
    const json = await resp.json().catch(() => ({}));
    if (!resp.ok || json?.ok === false) {
      throw new Error(json?.error || "No se pudo eliminar");
    }
    return true;
  },

  async obtenerPorFolio(folio) {
    const resp = await fetch(`${API_BASE}/api/requerimientos/folio/${encodeURIComponent(folio)}`, {
      credentials: "include",
    });
    const json = await resp.json().catch(() => ({}));
    if (!resp.ok || json?.ok === false) {
      throw new Error(json?.error || "No se pudo obtener el folio");
    }
    return normRequer(json?.data ?? json);
  },
};

/* =================== Modal de Confirmación (como Certificados) =================== */
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

  const topRef = useRef(null);
  const detailRef = useRef(null);
  const historyRef = useRef(null);

  // Carga inicial
  useEffect(() => {
    (async () => {
      setLoadingList(true);
      setLoadingHist(true);
      try {
        const [p, h] = await Promise.all([
          ReqsAPI.listarPendientes(),
          ReqsAPI.listarHistorial(""),
        ]);
        setPendientes(p);
        setHistorial(h);
      } catch (e) {
        console.error(e);
        alert(`No se pudo cargar la información inicial.\n${e.message || ""}`);
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
      folio: h.folio,
      socio: h.socio,
      tipo: h.tipo,
      estado: h.estado,
      ts: h.ts,
      idReq: h.idReq,
      imagen: h.imagen,
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

  /* ===== Acciones ===== */
  const aprobar = async () => {
    if (!seleccion?.ID_Req) return;
    try {
      setBusy(true);
      await ReqsAPI.cambiarEstado(seleccion.ID_Req, {
        estado: "Aprobado",
        validadorNombre: directivaNombre,
        comentario: respuesta?.trim() || "Aprobado",
      });

      // UI: remover de pendientes y mover a historial
      setPendientes((prev) => prev.filter((p) => p.ID_Req !== seleccion.ID_Req));
      setHistorial((prev) => [
        {
          folio: seleccion.Folio,
          socio: seleccion.Socio,
          tipo: seleccion.Tipo,
          estado: "Aprobado",
          ts: new Date().toISOString(),
          idReq: seleccion.ID_Req,
          imagen: seleccion.Adjunto_URL || null,
        },
        ...prev,
      ]);

      // Actualiza el detalle para ocultar botones
      setSeleccion((s) => s ? { ...s, Estado: "Aprobado", Actor: directivaNombre } : s);
      setRespuesta("");
      alert("✅ Requerimiento aprobado.");
    } catch (e) {
      console.error(e);
      alert(e.message || "No se pudo aprobar.");
    } finally {
      setBusy(false);
    }
  };

  const rechazar = async () => {
    if (!seleccion?.ID_Req) return;
    try {
      setBusy(true);
      await ReqsAPI.cambiarEstado(seleccion.ID_Req, {
        estado: "Rechazado",
        validadorNombre: directivaNombre,
        comentario: respuesta?.trim() || "Rechazado",
      });

      setPendientes((prev) => prev.filter((p) => p.ID_Req !== seleccion.ID_Req));
      setHistorial((prev) => [
        {
          folio: seleccion.Folio,
          socio: seleccion.Socio,
          tipo: seleccion.Tipo,
          estado: "Rechazado",
          ts: new Date().toISOString(),
          idReq: seleccion.ID_Req,
          imagen: seleccion.Adjunto_URL || null,
        },
        ...prev,
      ]);

      setSeleccion((s) => s ? { ...s, Estado: "Rechazado", Actor: directivaNombre } : s);
      setRespuesta("");
      alert("❌ Requerimiento rechazado.");
    } catch (e) {
      console.error(e);
      alert(e.message || "No se pudo rechazar.");
    } finally {
      setBusy(false);
    }
  };

  const abrirConfirmAprobar = () => { if (!seleccion) return; setShowApprove(true); };
  const abrirConfirmRechazar = () => { if (!seleccion) return; setShowReject(true); };
  const confirmarAprobar = async () => { setShowApprove(false); await aprobar(); };
  const confirmarRechazar = async () => { setShowReject(false); await rechazar(); };

  const onHistView = async (folio) => {
    try {
      setBusy(true);
      // Preferimos API para obtener lo más fresco (incluye Telefono/Email si el backend hace JOIN)
      const det = await ReqsAPI.obtenerPorFolio(folio).catch(() => null);

      if (det) {
        openDetail(det);
        return;
      }

      // Fallback desde la fila del historial en memoria
      const h = historial.find((x) => x.folio === folio);
      if (h) {
        openDetail({
          ID_Req: h.idReq ?? null,
          Folio: h.folio,
          Socio: h.socio,
          Telefono: "", // no viene en historial por defecto
          Email: "",
          Tipo: h.tipo,
          Estado: h.estado,
          Fecha_Solicitud: h.ts,
          Direccion: h.direccion || "-",
          Detalle: h.detalle || "-",
          Adjunto_URL: h.imagen || null,
        });
        return;
      }

      alert("No se encontró el folio.");
    } catch (e) {
      console.error(e);
      alert("No se pudo abrir el detalle.");
    } finally {
      setBusy(false);
    }
  };

  const onHistDelete = async (folio) => {
    if (!confirm(`¿Eliminar el requerimiento ${folio}? Esta acción no se puede deshacer.`)) return;
    try {
      setBusy(true);
      // UI optimista
      setHistorial((prev) => prev.filter((h) => h.folio !== folio));
      setPendientes((prev) => prev.filter((p) => p.Folio !== folio));
      await ReqsAPI.eliminarPorFolio(folio);
      if (seleccion?.Folio === folio) setSeleccion(null);
      alert("🗑️ Eliminado.");
    } catch (e) {
      console.error(e);
      alert(e.message || "No se pudo eliminar.");
    } finally {
      setBusy(false);
    }
  };

  const hasDetail = Boolean(seleccion);
  const isFinal = hasDetail && (seleccion.Estado === "Aprobado" || seleccion.Estado === "Rechazado");

  return (
    <div className="cd" ref={topRef}>
      {/* Header */}
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

        {/* Detalle */}
        {hasDetail && (
          <section className="cd__card cd__detail" ref={detailRef} id="cd-detail">
            <div className="cd__detailHead">
              <h2>Detalle del requerimiento</h2>
              <button className="cd__btn cd__btn--ghost" onClick={closeDetail}>Cerrar</button>
            </div>

            <div className="cd__detailGrid">
              <div className="cd__kv"><span className="cd__k">Folio</span><span className="cd__v">{seleccion.Folio}</span></div>

              <div className="cd__kv">
                <span className="cd__k">Socio</span>
                <span className="cd__v">{seleccion.Socio}</span>
              </div>

              <div className="cd__kv">
                <span className="cd__k">Teléfono</span>
                <span className="cd__v">{seleccion.Telefono || "-"}</span>
              </div>

              <div className="cd__kv">
                <span className="cd__k">Correo</span>
                <span className="cd__v">{seleccion.Email || "-"}</span>
              </div>

              <div className="cd__kv"><span className="cd__k">Dirección</span><span className="cd__v">{seleccion.Direccion || "-"}</span></div>
              <div className="cd__kv"><span className="cd__k">Tipo</span><span className="cd__v">{seleccion.Tipo}</span></div>

              <div className="cd__kv">
                <span className="cd__k">Estado</span>
                <span className="cd__v">
                  <span className={"cd__badge " + (isFinal ? (seleccion.Estado === "Aprobado" ? "is-ok" : "is-bad") : "is-review")}>
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
                      onError={(e) => { e.currentTarget.src = `${API_BASE}/uploads/placeholder-image.png`; }}
                      loading="lazy"
                    />
                  </div>
                </div>
              )}

              <div className="cd__actionsRow">
                {!isFinal && (
                  <>
                    <button className="cd__btn cd__btn--ok" onClick={abrirConfirmAprobar} disabled={busy}>Aprobar</button>
                    <button className="cd__btn cd__btn--danger" onClick={abrirConfirmRechazar} disabled={busy}>Rechazar</button>
                  </>
                )}
                {/* Botón "Pedir más info" eliminado */}
              </div>

              {!isFinal && (
                <div className="cd__resp">
                  <label htmlFor="resp">Comentario para el vecino</label>
                  <textarea
                    id="resp" rows={4}
                    value={respuesta}
                    onChange={(e) => setRespuesta(e.target.value)}
                    placeholder="Escribe aquí tu comentario…"
                  />
                </div>
              )}

              {isFinal && seleccion?.Actor && (
                <div className="cd__kv">
                  <span className="cd__k">Validado por</span>
                  <span className="cd__v">{seleccion.Actor}</span>
                </div>
              )}
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
                      <button className="cd__chipIcon" title="Ver" onClick={() => onHistView(h.folio)}>
                        <span className="ico ico-view" aria-hidden />
                      </button>
                      <button className="cd__chipIcon" title="Eliminar" onClick={() => onHistDelete(h.folio)}>
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
  // cámbialo por el nombre real de quien valida (sesión)
  const user = { nombre: "Nombre Directiva", cargo: "Directiva" };

  return (
    <PanelLateralD title="Requerimientos" user={user} showTopUser={false}>
      <RequerimientosContent directivaNombre={user.nombre} />
    </PanelLateralD>
  );
}
