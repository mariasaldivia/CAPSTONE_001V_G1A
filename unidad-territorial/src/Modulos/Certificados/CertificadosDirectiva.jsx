// src/pages/directiva/CertificadosDirectiva.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import PanelLateralD from "../../components/PanelLateralD";
import { CertAPI } from "../../api/certificados";
import "./CertificadosDirectiva.css";

/* ======================================================
   🧩 HELPERS (formatos y utilidades)
   ====================================================== */
const fmtDate = (iso) =>
  iso
    ? new Date(iso).toLocaleDateString(undefined, {
        year: "2-digit",
        month: "2-digit",
        day: "2-digit",
      })
    : "-";

function formatearRut(input) {
  if (!input) return "";
  let v = input.replace(/\./g, "").replace(/\s+/g, "").toUpperCase();
  v = v.replace(/[^0-9K]/gi, "");
  if (v.length < 2) return v;
  const cuerpo = v.slice(0, -1);
  const dv = v.slice(-1);
  const cuerpoMiles = cuerpo.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `${cuerpoMiles}-${dv}`;
}

const esPDFurl = (s = "") => s.toLowerCase().endsWith(".pdf");
const esIMGurl = (s = "") =>
  s.toLowerCase().endsWith(".jpg") ||
  s.toLowerCase().endsWith(".jpeg") ||
  s.toLowerCase().endsWith(".png") ||
  s.startsWith("data:image/");

// ✅ Resolver URL absoluta para archivos servidos por el backend
function resolveComprobanteUrl(u) {
  if (!u) return null;
  if (/^https?:\/\//i.test(u)) return u; // ya es absoluta
  const BASE =
    (import.meta.env?.VITE_API_BASE &&
      String(import.meta.env.VITE_API_BASE).replace(/\/$/, "")) ||
    "http://localhost:4010";
  return `${BASE}${u.startsWith("/") ? u : `/${u}`}`;
}

/* ======================================================
   🎛️ ÍCONOS (SVG inline)
   ====================================================== */
const IconoVer = () => (
  <svg viewBox="0 0 24 24" className="cd__icon" aria-hidden="true">
    <path d="M12 5c5 0 9 5 9 7s-4 7-9 7-9-5-9-7 4-7 9-7zm0 2C8 7 4.9 10.5 4.2 12 4.9 13.5 8 17 12 17s7.1-3.5 7.8-5C19.1 10.5 16 7 12 7zm0 2a3 3 0 110 6 3 3 0 010-6z"/>
  </svg>
);
const IconoEditar = () => (
  <svg viewBox="0 0 24 24" className="cd__icon" aria-hidden="true">
    <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1 1 0 000-1.42l-2.34-2.34a1 1 0 00-1.42 0l-1.83 1.83 3.75 3.75 1.82-1.82z"/>
  </svg>
);
const IconoEliminar = () => (
  <svg viewBox="0 0 24 24" className="cd__icon" aria-hidden="true">
    <path d="M6 7h12v2H6V7zm2 3h8l-1 10H9L8 10zm3-7h2l1 2h4v2H4V5h4l1-2z"/>
  </svg>
);

/* ======================================================
   🧱 MODAL CONFIRMACIÓN (aprobación irreversible)
   ====================================================== */
function ApproveConfirmModal({
  open,
  onClose,
  onConfirm,
  checkbox,
  setCheckbox,
  folio,
  datos,
}) {
  if (!open) return null;
  return (
    <div className="cd__modalBack" role="dialog" aria-modal="true" aria-labelledby="cd-approve-title">
      <div className="cd__modal">
        <div className="cd__modalHead">
          <span className="cd__modalAttention">ATENCIÓN</span>
          <h3 id="cd-approve-title">Confirmar aprobación</h3>
        </div>

        <div className="cd__modalBody">
          <p>
            Estás a punto de <strong>aprobar</strong> la solicitud de certificado
            {folio ? <> con folio <strong>{folio}</strong></> : null}. Esta acción es
            <strong> irreversible</strong> y al confirmar se enviará automáticamente el
            certificado al correo del socio.
          </p>

          <p style={{ marginTop: 12 }}>
            <strong>Verifica que los datos del solicitante y dirección sean correctos:</strong>
          </p>

          {datos && (
            <div className="cd__modalData">
              <p><b>Nombre:</b> {datos.nombre || "-"}</p>
              <p><b>RUT:</b> {datos.rut || "-"}</p>
              <p><b>Dirección:</b> {datos.direccion || "-"}</p>
              <p><b>Correo:</b> {datos.email || "-"}</p>
            </div>
          )}

          <ul className="cd__modalList">
            <li>El estado de la solicitud se moverá al historial como <strong>Aprobado</strong>.</li>
            <li>El certificado será enviado al correo indicado.</li>
          </ul>

          <label className="cd__checkRow">
            <input
              type="checkbox"
              checked={checkbox}
              onChange={(e) => setCheckbox(e.target.checked)}
            />
            <span>Descargar PDF al confirmar</span>
          </label>
        </div>

        <div className="cd__modalActions">
          <button className="cd__btn cd__btn--ghost" onClick={onClose}>
            Cancelar
          </button>
          <button className="cd__btn cd__btn--ok" onClick={onConfirm}>
            Confirmar
          </button>
        </div>
      </div>
    </div>
  );
}

/* ======================================================
   🧠 CONTENIDO PRINCIPAL
   ====================================================== */
function CertificadosContent() {
  /* ----- UI state ----- */
  const [mode, setMode] = useState("list"); // "list" | "manual"
  const [orden, setOrden] = useState("recientes");
  const [seleccion, setSeleccion] = useState(null);
  const [respuesta, setRespuesta] = useState("");
  const [showHistory, setShowHistory] = useState(false);
  const [histOrder, setHistOrder] = useState("recientes");
  const [busy, setBusy] = useState(false);
  const [loadingList, setLoadingList] = useState(false);
  const [loadingHist, setLoadingHist] = useState(false);

  // Modal confirmación de aprobación
  const [showApprove, setShowApprove] = useState(false);
  const [wantDownload, setWantDownload] = useState(false);

  /* ----- Edit context ----- */
  const [editId, setEditId] = useState(null);
  const [editFolio, setEditFolio] = useState(null);

  /* ----- Form manual ----- */
  const [manualForm, setManualForm] = useState({
    nombre: "",
    rut: "",
    direccion: "",
    email: "",
    metodoPago: "transferencia",
    comprobante: null,
    comprobanteName: "",
  });

  /* ----- Data ----- */
  const [pendientes, setPendientes] = useState([]);
  const [historial, setHistorial] = useState([]);

  /* ----- Refs ----- */
  const topRef = useRef(null);
  const detailRef = useRef(null);
  const historyRef = useRef(null);

  /* ======================================================
     🔁 INIT
     ====================================================== */
  useEffect(() => {
    (async () => {
      await refreshList();
      await refreshHist();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function refreshList() {
    try {
      setLoadingList(true);
      const arr = await CertAPI.listarPendientes();
      setPendientes(arr || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingList(false);
    }
  }

  async function refreshHist() {
    try {
      setLoadingHist(true);
      const arr = await CertAPI.historial();
      setHistorial(arr || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingHist(false);
    }
  }

  /* ======================================================
     🧮 DERIVACIONES
     ====================================================== */
  const pendientesOrdenados = useMemo(() => {
    const base = [...pendientes];
    if (orden === "recientes") {
      return base.sort(
        (a, b) =>
          new Date(b.Fecha_Solicitud || b.Fecha_Cambio || 0) -
          new Date(a.Fecha_Solicitud || a.Fecha_Cambio || 0)
      );
    }
    return base;
  }, [orden, pendientes]);

  const histList = useMemo(() => {
    const rows = (historial || []).map((h) => ({
      folio: h.Folio || h.ID_Cert || "-",
      nombre: h.Nombre || "",
      rut: h.RUT || "",
      estado: h.Estado || "",
      ts: h.Fecha_Cambio || h.Fecha_Solicitud || h.ts || "",
      idCert: h.ID_Cert,
    }));
    const byTsDesc = (a, b) => new Date(b.ts) - new Date(a.ts);
    const byTsAsc = (a, b) => new Date(a.ts) - new Date(b.ts);
    switch (histOrder) {
      case "antiguos":
        return rows.sort(byTsAsc);
      case "aprobados":
        return rows.filter((r) => r.estado === "Aprobado").sort(byTsDesc);
      case "rechazados":
        return rows.filter((r) => r.estado === "Rechazado").sort(byTsDesc);
      case "pendientes":
        return rows.filter((r) => r.estado === "Pendiente").sort(byTsDesc);
      default:
        return rows.sort(byTsDesc);
    }
  }, [histOrder, historial]);

  /* ======================================================
     🧭 HELPERS UI
     ====================================================== */
  const scrollTo = (ref) =>
    ref?.current?.scrollIntoView({ behavior: "smooth", block: "start" });

  const openDetail = (row) => {
    setSeleccion(row);
    setMode("list");
    setTimeout(() => scrollTo(detailRef), 0);
  };

  const closeDetail = () => {
    setSeleccion(null);
    setTimeout(() => scrollTo(topRef), 0);
  };

  const openManual = () => {
    setSeleccion(null);
    setShowHistory(false);
    setEditId(null);
    setEditFolio(null);
    setMode("manual");
    setManualForm({
      nombre: "",
      rut: "",
      direccion: "",
      email: "",
      metodoPago: "transferencia",
      comprobante: null,
      comprobanteName: "",
    });
    setTimeout(() => scrollTo(topRef), 0);
  };

  const cancelManual = () => {
    setMode("list");
    setEditId(null);
    setEditFolio(null);
    setManualForm({
      nombre: "",
      rut: "",
      direccion: "",
      email: "",
      metodoPago: "transferencia",
      comprobante: null,
      comprobanteName: "",
    });
    setTimeout(() => scrollTo(topRef), 0);
  };

  /* ======================================================
     ✍️ FORM MANUAL (onChange)
     ====================================================== */
  const onManualChange = (e) => {
    const { name, value, files } = e.target;
    if (name === "rut") {
      return setManualForm((s) => ({ ...s, rut: formatearRut(value) }));
    }
    if (name === "metodoPago") {
      return setManualForm((s) => ({
        ...s,
        metodoPago: value,
        comprobante: null,
        comprobanteName: "",
      }));
    }
    if (name === "comprobante") {
      const f = files?.[0] ?? null;
      return setManualForm((s) => ({
        ...s,
        comprobante: f,
        comprobanteName: f?.name || "",
      }));
    }
    setManualForm((s) => ({ ...s, [name]: value }));
  };

  /* ======================================================
     ✅ APROBAR / ❌ RECHAZAR
     ====================================================== */
  const aprobar = async () => {
    if (!seleccion) return;
    setWantDownload(false);
    setShowApprove(true);
  };

  const confirmarAprobacion = async () => {
    if (!seleccion) return;
    try {
      setBusy(true);
      setShowApprove(false);
      await CertAPI.cambiarEstado(seleccion.ID_Cert, {
        estado: "Aprobado",
        comentario: respuesta || "Aprobado",
        validadorId: null,
      });

      if (wantDownload) {
        const BASE = import.meta.env.VITE_API_BASE || "http://localhost:4010";
        const urlPDF = `${BASE}/api/certificados/${encodeURIComponent(
          seleccion.ID_Cert
        )}/pdf`;
        window.open(urlPDF, "_blank", "noopener,noreferrer");
      }

      await Promise.all([refreshList(), refreshHist()]);
      setSeleccion(null);
      setRespuesta("");
      alert("✅ Certificado aprobado.");
    } catch (e) {
      console.error(e);
      alert("No se pudo aprobar.");
    } finally {
      setBusy(false);
    }
  };

  const rechazar = async () => {
    if (!seleccion) return;
    try {
      setBusy(true);
      await CertAPI.cambiarEstado(seleccion.ID_Cert, {
        estado: "Rechazado",
        comentario: respuesta || "Rechazado",
        validadorId: null,
      });
      await Promise.all([refreshList(), refreshHist()]);
      setSeleccion(null);
      setRespuesta("");
      alert("❌ Certificado rechazado.");
    } catch (e) {
      console.error(e);
      alert("No se pudo rechazar.");
    } finally {
      setBusy(false);
    }
  };

  /* ======================================================
     💾 GUARDAR
     ====================================================== */
  const saveManual = async (e) => {
    e.preventDefault();

    const payload = {
      nombre: manualForm.nombre,
      rut: manualForm.rut,
      direccion: manualForm.direccion,
      email: manualForm.email,
      metodoPago:
        manualForm.metodoPago.toLowerCase() === "fisico" ? "Fisico" : "Transferencia",
      // comprobanteUrl: (si habilitas subida más adelante)
    };

    try {
      setBusy(true);

      if (editFolio) {
        if (editId) {
          await Promise.all([
            CertAPI.actualizar(editId, payload),
            CertAPI.actualizarHist(editFolio, payload),
          ]);
        } else {
          await CertAPI.actualizarHist(editFolio, payload);
        }

        await Promise.all([refreshList(), refreshHist()]);
        setMode("list");
        setEditFolio(null);
        setEditId(null);
        setManualForm({
          nombre: "",
          rut: "",
          direccion: "",
          email: "",
          metodoPago: "transferencia",
          comprobante: null,
          comprobanteName: "",
        });
        alert("✅ Cambios guardados.");
        return;
      }

      if (editId) {
        await CertAPI.actualizar(editId, payload);
        await Promise.all([refreshList(), refreshHist()]);
        setMode("list");
        setEditId(null);
        setManualForm({
          nombre: "",
          rut: "",
          direccion: "",
          email: "",
          metodoPago: "transferencia",
          comprobante: null,
          comprobanteName: "",
        });
        alert("✅ Registro actualizado.");
        return;
      }

      alert("Guardado manual (solo UI). Conectaremos el POST real luego.");
      cancelManual();
    } catch (err) {
      console.error(err);
      alert("No se pudo guardar.");
    } finally {
      setBusy(false);
    }
  };

  /* ======================================================
     🗂️ HISTORIAL
     ====================================================== */
  const onHistView = async (folio) => {
    try {
      setBusy(true);
      const row = await CertAPI.obtenerPorFolio(folio);
      setSeleccion(row);
      setMode("list");
      if (!showHistory) setShowHistory(true);
      setTimeout(() => scrollTo(detailRef), 0);
    } catch (e) {
      alert("No se pudo abrir el detalle.");
      console.error(e);
    } finally {
      setBusy(false);
    }
  };

  const onHistEdit = async (folio) => {
    try {
      setBusy(true);
      const row = await CertAPI.obtenerPorFolio(folio);

      setEditFolio(folio);

      const estado = String(row?.Estado || "").toLowerCase();
      if (estado === "pendiente") {
        setEditId(row.ID_Cert ?? null);
      } else {
        setEditId(null);
      }

      setManualForm({
        nombre: row.Nombre || "",
        rut: row.RUT || "",
        direccion: row.Direccion || "",
        email: row.Email || "",
        metodoPago:
          row.Metodo_Pago?.toLowerCase() === "fisico" ? "fisico" : "transferencia",
        comprobante: null,
        comprobanteName: "",
      });

      setMode("manual");
      setTimeout(() => scrollTo(topRef), 0);
    } catch (e) {
      alert("No se pudo abrir para editar.");
      console.error(e);
    } finally {
      setBusy(false);
    }
  };

  const onHistDelete = async (folio) => {
    if (!confirm(`¿Eliminar la solicitud ${folio}? Esta acción no se puede deshacer.`)) return;

    // 🔧 FIX: eliminación por FOLIO en ambas tablas + actualización optimista en UI
    try {
      setBusy(true);

      // 1) Optimista: saca la fila del historial al tiro
      setHistorial((prev) => (prev || []).filter((h) => (h.Folio || h.ID_Cert) !== folio));
      // Y si existe en la lista de pendientes con ese mismo folio, también sácalo
      setPendientes((prev) => (prev || []).filter((p) => p.Folio !== folio));

      // 2) Llamar a endpoint que elimine por FOLIO en ambas tablas
      await CertAPI.eliminarPorFolio(folio);

      // 3) Re-sincroniza desde el backend para quedar consistentes
      await Promise.all([refreshList(), refreshHist()]);

      // 4) Limpia selección si mirabas el detalle de ese folio
      if (seleccion?.Folio === folio) setSeleccion(null);

      alert("🗑️ Eliminado.");
    } catch (e) {
      console.error(e);
      alert("No se pudo eliminar.");
      // Si falló, recargamos para revertir la eliminación optimista
      await Promise.all([refreshList(), refreshHist()]);
    } finally {
      setBusy(false);
    }
  };

  /* ======================================================
     🔧 OTROS
     ====================================================== */
  const toggleHistory = () => {
    setShowHistory((s) => !s);
    setSeleccion(null);
    setTimeout(() => scrollTo(historyRef), 0);
  };

  const exportHistoryToPDF = () => {
    const was = showHistory;
    if (!was) setShowHistory(true);
    setTimeout(() => {
      window.print();
      if (!was) setShowHistory(false);
    }, 50);
  };

  const hasDetail = Boolean(seleccion) && mode === "list";

  /* ======================================================
     🖼️ RENDER
     ====================================================== */
  return (
    <div className="cd" ref={topRef}>
      {/* ----- HEADER ----- */}
      <header className="cd__header">
        <div className="cd__headerRow">
          <h1 className="cd__title">Certificados de Residencia</h1>
          <div className="cd__actionsTop">
            <button className="cd__btn" onClick={openManual}>Ingreso manual</button>
            <button className="cd__btn cd__btn--ghost" onClick={toggleHistory}>
              {showHistory ? "Ocultar historial" : "Historial"}
            </button>
            <button className="cd__btn cd__btn--ghost" onClick={exportHistoryToPDF}>
              Exportar PDF
            </button>
          </div>
        </div>
        <p className="cd__desc">
          Gestiona <strong>solicitudes pendientes</strong>, revisa detalles, crea registros manuales
          y consulta el <strong>historial</strong>.
        </p>
      </header>

      {/* ----- ZONA PRINCIPAL ----- */}
      {mode === "manual" ? (
        /* ===== INGRESO / EDICIÓN MANUAL ===== */
        <section className="cd__card cd__manual">
          <div className="cd__manualHead">
            <h2>{editId || editFolio ? "Editar solicitud" : "Ingreso manual de solicitud"}</h2>
            <button className="cd__btn cd__btn--ghost" onClick={cancelManual}>Cerrar</button>
          </div>

          <form className="cd__form" onSubmit={saveManual}>
            <div className="cd__gridForm">
              <label className="cd__group">
                <span>Nombre</span>
                <input name="nombre" value={manualForm.nombre} onChange={onManualChange} required />
              </label>
              <label className="cd__group">
                <span>RUT</span>
                <input name="rut" value={manualForm.rut} onChange={onManualChange} placeholder="12.345.678-5" required />
              </label>
              <label className="cd__group">
                <span>Correo</span>
                <input type="email" name="email" value={manualForm.email} onChange={onManualChange} required />
              </label>
              <label className="cd__group cd__group--full">
                <span>Dirección</span>
                <input name="direccion" value={manualForm.direccion} onChange={onManualChange} required />
              </label>
              <label className="cd__group">
                <span>Método de pago</span>
                <select name="metodoPago" value={manualForm.metodoPago} onChange={onManualChange}>
                  <option value="transferencia">Transferencia</option>
                  <option value="fisico">Pago presencial</option>
                </select>
              </label>

              {/* Campo de archivo también cuando es "fisico" (opcional) */}
              {(manualForm.metodoPago === "transferencia" || manualForm.metodoPago === "fisico") && (
                <label className="cd__group cd__group--full">
                  <span>
                    {manualForm.metodoPago === "transferencia"
                      ? "Comprobante (jpg, png, pdf)"
                      : "Comprobante presencial (opcional: boleta en jpg/png/pdf)"}
                  </span>
                  <input
                    type="file"
                    name="comprobante"
                    accept=".jpg,.jpeg,.png,.pdf"
                    onChange={onManualChange}
                  />
                  {manualForm.comprobanteName && (
                    <small className="cd__hint">Archivo: {manualForm.comprobanteName}</small>
                  )}
                </label>
              )}
            </div>

            <div className="cd__actionsRow" style={{ justifyContent: "flex-end" }}>
              <button type="button" className="cd__btn cd__btn--ghost" onClick={cancelManual} disabled={busy}>
                Cancelar
              </button>
              <button type="submit" className="cd__btn cd__btn--ok" disabled={busy}>
                {editId || editFolio ? "Guardar cambios" : "Guardar"}
              </button>
            </div>
          </form>
        </section>
      ) : (
        <section className={`cd__gridMain ${hasDetail ? "has-detail" : ""}`}>
          {/* ===== LISTA: PENDIENTES ===== */}
          <section className="cd__card cd__list">
            <div className="cd__listHead">
              <h2>Solicitudes (Pendientes)</h2>
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
                    <th>N°</th>
                    <th>Nombre</th>
                    <th>RUT</th>
                    <th>Fecha</th>
                    <th>Estado</th>
                    <th>Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {loadingList && (
                    <tr>
                      <td colSpan="6">Cargando…</td>
                    </tr>
                  )}
                  {!loadingList &&
                    pendientesOrdenados.map((r) => (
                      <tr key={r.ID_Cert} className={seleccion?.ID_Cert === r.ID_Cert ? "is-sel" : ""}>
                        <td>{r.Folio}</td>
                        <td>{r.Nombre}</td>
                        <td>{formatearRut(r.RUT)}</td>
                        <td>{fmtDate(r.Fecha_Solicitud)}</td>
                        <td>
                          <span className="cd__badge is-pending">Pendiente</span>
                        </td>
                        <td>
                          <button className="cd__btn cd__btn--ghost" onClick={() => openDetail(r)}>
                            Revisar
                          </button>
                        </td>
                      </tr>
                    ))}
                  {!loadingList && pendientesOrdenados.length === 0 && (
                    <tr>
                      <td colSpan="6">Sin solicitudes pendientes.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          {/* ===== DETALLE: PENDIENTE SELECCIONADO ===== */}
          {hasDetail && (
            <section className="cd__card cd__detail" ref={detailRef} id="cd-detail">
              <div className="cd__detailHead">
                <h2>Detalle de la solicitud</h2>
                <button className="cd__btn cd__btn--ghost" onClick={closeDetail}>
                  Cerrar
                </button>
              </div>

              <div className="cd__detailGrid">
                <div className="cd__kv">
                  <span className="cd__k">Folio</span>
                  <span className="cd__v">{seleccion.Folio}</span>
                </div>
                <div className="cd__kv">
                  <span className="cd__k">Solicitante</span>
                  <span className="cd__v">{seleccion.Nombre}</span>
                </div>
                <div className="cd__kv">
                  <span className="cd__k">RUT</span>
                  <span className="cd__v">{formatearRut(seleccion.RUT)}</span>
                </div>
                <div className="cd__kv">
                  <span className="cd__k">Dirección</span>
                  <span className="cd__v">{seleccion.Direccion}</span>
                </div>
                <div className="cd__kv">
                  <span className="cd__k">Correo</span>
                  <span className="cd__v">
                    <a className="cd__link" href={`mailto:${seleccion.Email}`}>
                      {seleccion.Email}
                    </a>
                  </span>
                </div>
                <div className="cd__kv">
                  <span className="cd__k">Estado</span>
                  <span className="cd__v">
                    <span className="cd__badge is-review">{seleccion.Estado}</span>
                  </span>
                </div>

                {seleccion.Comprobante_URL && (
                  <div className="cd__block">
                    <span className="cd__k">Comprobante</span>
                    <div className="cd__file">
                      {(() => {
                        const abs = resolveComprobanteUrl(seleccion.Comprobante_URL);
                        return (
                          <>
                            {esIMGurl(abs) && (
                              <div className="cd__imgWrap">
                                <a href={abs} download className="cd__dl" title="Descargar">
                                  <svg viewBox="0 0 24 24">
                                    <path d="M12 3a1 1 0 0 1 1 1v8.586l2.293-2.293a1 1 0 1 1 1.414 1.414l-4 4a1 1 0 0 1-1.414 0l-4-4a1 1 0 1 1 1.414-1.414L11 12.586V4a1 1 0 0 1 1-1zM5 20a1 1 0 1 1 0-2h14a1 1 0 1 1 0 2H5z" />
                                  </svg>
                                </a>
                                <img src={abs} alt="Comprobante" />
                              </div>
                            )}
                            {esPDFurl(abs) && (
                              <embed src={abs} type="application/pdf" width="100%" height="360" />
                            )}
                          </>
                        );
                      })()}
                    </div>
                  </div>
                )}

                <div className="cd__actionsRow">
                  <button className="cd__btn cd__btn--ok" onClick={aprobar} disabled={busy}>
                    Aprobar
                  </button>
                  <button className="cd__btn cd__btn--danger" onClick={rechazar} disabled={busy}>
                    Rechazar
                  </button>
                  <button
                    className="cd__btn cd__btn--warn"
                    onClick={() => alert(`📨 Pedir más info a ${seleccion.Email}`)}
                    disabled={busy}
                  >
                    Pedir más info
                  </button>
                </div>

                <div className="cd__resp">
                  <label htmlFor="resp">Comentario para el vecino</label>
                  <textarea
                    id="resp"
                    rows={4}
                    value={respuesta}
                    onChange={(e) => setRespuesta(e.target.value)}
                    placeholder="Escribe aquí tu comentario…"
                  />
                </div>
              </div>
            </section>
          )}
        </section>
      )}

      {/* ===== HISTORIAL ===== */}
      {showHistory && (
        <section className="cd__card cd__history" ref={historyRef} id="cd-history">
          <div className="cd__historyHead">
            <h2>Historial</h2>
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
                  <th>N°</th>
                  <th>Nombre</th>
                  <th>RUT</th>
                  <th>Fecha</th>
                  <th>Estado</th>
                  <th className="cd__th--icons">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {loadingHist && (
                  <tr>
                    <td colSpan="6">Cargando…</td>
                  </tr>
                )}
                {!loadingHist &&
                  histList.map((h) => (
                    <tr key={`${h.folio}-${h.ts}`}>
                      <td>{h.folio}</td>
                      <td>{h.nombre}</td>
                      <td>{formatearRut(h.rut)}</td>
                      <td>{fmtDate(h.ts)}</td>
                      <td>
                        <span
                          className={
                            "cd__badge " +
                            (h.estado === "Pendiente"
                              ? "is-pending"
                              : h.estado === "Aprobado"
                              ? "is-ok"
                              : "is-bad")
                          }
                        >
                          {h.estado}
                        </span>
                      </td>
                      <td className="cd__td--icons">
                        <button
                          className="cd__iconBtn"
                          title="Ver"
                          onClick={() => onHistView(h.folio)}
                        >
                          <IconoVer />
                        </button>
                        <button
                          className="cd__iconBtn"
                          title="Editar"
                          onClick={() => onHistEdit(h.folio)}
                        >
                          <IconoEditar />
                        </button>
                        <button
                          className="cd__iconBtn"
                          title="Eliminar"
                          onClick={() => onHistDelete(h.folio)}
                        >
                          <IconoEliminar />
                        </button>
                      </td>
                    </tr>
                  ))}
                {!loadingHist && histList.length === 0 && (
                  <tr>
                    <td colSpan="6">Sin registros.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* ===== MODAL: Confirmación de Aprobación ===== */}
      <ApproveConfirmModal
        open={showApprove}
        onClose={() => setShowApprove(false)}
        onConfirm={confirmarAprobacion}
        checkbox={wantDownload}
        setCheckbox={setWantDownload}
        folio={seleccion?.Folio}
        datos={{
          nombre: seleccion?.Nombre,
          rut: formatearRut(seleccion?.RUT || ""),
          direccion: seleccion?.Direccion,
          email: seleccion?.Email,
        }}
      />
    </div>
  );
}

/* ======================================================
   🚪 WRAPPER CON PANEL LATERAL
   ====================================================== */
export default function CertificadosDirectiva() {
  const user = { nombre: "Nombre Directiva", cargo: "Cargo" };
  return (
    <PanelLateralD title="Certificados" user={user} showTopUser={false}>
      <CertificadosContent />
    </PanelLateralD>
  );
}
