// src/pages/directiva/CertificadosDirectiva.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import PanelLateralD from "../../components/PanelLateralD";
import { CertAPI } from "../../api/certificados";
import "./CertificadosDirectiva.css";

/* =================== Helpers =================== */
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

/* RUT utils */
function limpiarRut(r) {
  return String(r || "").toUpperCase().replace(/[^0-9K]/g, "");
}
function calcularDV(numStr) {
  let M = 0,
    S = 1;
  for (let i = numStr.length - 1; i >= 0; i--) {
    S = (S + Number(numStr[i]) * (9 - (M % 6))) % 11;
    M++;
  }
  return S ? String(S - 1) : "K";
}
function validarRut(rutConFormato) {
  const limpio = limpiarRut(rutConFormato);
  if (!/^[0-9]+[0-9K]$/.test(limpio)) return false;
  const cuerpo = limpio.slice(0, -1);
  const dv = limpio.slice(-1);
  if (cuerpo.length < 7) return false;
  const dvCalc = calcularDV(cuerpo);
  return dvCalc === dv;
}
function normalizarRut(rutConFormato) {
  const limpio = limpiarRut(rutConFormato);
  if (limpio.length < 2) return limpio;
  const cuerpo = limpiarRut(limpio.slice(0, -1)).replace(/^0+/, "");
  const dv = limpio.slice(-1);
  return `${cuerpo}-${dv}`;
}

const esPDFurl = (s = "") => s.toLowerCase().endsWith(".pdf");
const esIMGurl = (s = "") =>
  s.toLowerCase().endsWith(".jpg") ||
  s.toLowerCase().endsWith(".jpeg") ||
  s.toLowerCase().endsWith(".png") ||
  s.startsWith("data:image/");
function resolveComprobanteUrl(u) {
  if (!u) return null;
  if (/^https?:\/\//i.test(u)) return u;
  const BASE =
    (import.meta.env?.VITE_API_BASE &&
      String(import.meta.env.VITE_API_BASE).replace(/\/$/, "")) ||
    "http://localhost:4010";
  return `${BASE}${u.startsWith("/") ? u : `/${u}`}`;
}

/* =================== Íconos =================== */
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

/* =================== Modales =================== */
function ApproveConfirmModal({ open, onClose, onConfirm, checkbox, setCheckbox, folio, datos }) {
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
            Estás a punto de <strong>aprobar</strong> la solicitud
            {folio ? <> con folio <strong>{folio}</strong></> : null}. Esta acción es
            <strong> irreversible</strong> y al confirmar se enviará automáticamente el
            certificado al correo del socio.
          </p>

          {datos && (
            <div className="cd__modalData">
              <p><b>Nombre:</b> {datos.nombre || "-"}</p>
              <p><b>RUT:</b> {datos.rut || "-"}</p>
              <p><b>Dirección:</b> {datos.direccion || "-"}</p>
              <p><b>Correo:</b> {datos.email || "-"}</p>
            </div>
          )}

          <label className="cd__checkRow">
            <input type="checkbox" checked={checkbox} onChange={(e) => setCheckbox(e.target.checked)} />
            <span>Descargar PDF al confirmar</span>
          </label>
        </div>

        <div className="cd__modalActions">
          <button className="cd__btn cd__btn--ghost" onClick={onClose}>Cancelar</button>
          <button className="cd__btn cd__btn--ok" onClick={onConfirm}>Confirmar</button>
        </div>
      </div>
    </div>
  );
}

function SaveConfirmModal({ open, onCancel, onAccept, datos }) {
  if (!open) return null;
  return (
    <div className="cd__modalBack" role="dialog" aria-modal="true" aria-labelledby="cd-save-title">
      <div className="cd__modal">
        <div className="cd__modalHead">
          <span className="cd__modalAttention">ATENCIÓN</span>
          <h3 id="cd-save-title">Confirmar ingreso</h3>
        </div>

        <div className="cd__modalBody">
          <p>Este ingreso <b>manual</b> quedará registrado y se <b>aprobará de inmediato</b> (pasará al historial).</p>
          {datos && (
            <div className="cd__modalData">
              <p><b>Nombre:</b> {datos.nombre || "-"}</p>
              <p><b>RUT:</b> {datos.rut || "-"}</p>
              <p><b>Dirección:</b> {datos.direccion || "-"}</p>
              <p><b>Correo:</b> {datos.email || "-"}</p>
              <p><b>Método de pago:</b> {datos.metodoPago || "-"}</p>
            </div>
          )}
        </div>

        <div className="cd__modalActions">
          <button className="cd__btn cd__btn--ghost" onClick={onCancel}>Cancelar</button>
          <button className="cd__btn cd__btn--ok" onClick={onAccept}>Aceptar</button>
        </div>
      </div>
    </div>
  );
}

/* =================== Página =================== */
function CertificadosContent() {
  const [mode, setMode] = useState("list"); // list | manual
  const [orden, setOrden] = useState("recientes");
  const [seleccion, setSeleccion] = useState(null);
  const [respuesta, setRespuesta] = useState("");
  const [showHistory, setShowHistory] = useState(true);
  const [histOrder, setHistOrder] = useState("recientes");
  const [busy, setBusy] = useState(false);
  const [loadingList, setLoadingList] = useState(false);
  const [loadingHist, setLoadingHist] = useState(false);

  const [showApprove, setShowApprove] = useState(false);
  const [wantDownload, setWantDownload] = useState(false);

  const [showSaveConfirm, setShowSaveConfirm] = useState(false);
  const [pendingPayload, setPendingPayload] = useState(null);

  const [editId, setEditId] = useState(null);
  const [editFolio, setEditFolio] = useState(null);

  const [manualForm, setManualForm] = useState({
    nombre: "", rut: "", direccion: "", email: "",
    metodoPago: "transferencia",
    comprobante: null, comprobanteName: "",
  });
  const [rutError, setRutError] = useState("");

  const [pendientes, setPendientes] = useState([]);
  const [historial,   setHistorial]   = useState([]);

  const topRef = useRef(null);
  const detailRef = useRef(null);
  const historyRef = useRef(null);

  /* ===== Init ===== */
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
      const arr = await CertAPI.historial(); // ← debe traer Direccion, Email, Metodo_Pago, etc.
      setHistorial(arr || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingHist(false);
    }
  }

  /* ===== Derivaciones ===== */
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
      case "antiguos":    return rows.sort(byTsAsc);
      case "aprobados":   return rows.filter((r) => r.estado === "Aprobado").sort(byTsDesc);
      case "rechazados":  return rows.filter((r) => r.estado === "Rechazado").sort(byTsDesc);
      case "pendientes":  return rows.filter((r) => r.estado === "Pendiente").sort(byTsDesc);
      default:            return rows.sort(byTsDesc);
    }
  }, [histOrder, historial]);

  /* ===== Helpers UI ===== */
  const scrollTo = (ref) => ref?.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  const openDetail = (row) => { setSeleccion(row); setMode("list"); setTimeout(() => scrollTo(detailRef), 0); };
  const closeDetail = () => { setSeleccion(null); setTimeout(() => scrollTo(topRef), 0); };

  const openManual = () => {
    setSeleccion(null); setShowHistory(false); setEditId(null); setEditFolio(null);
    setMode("manual"); setRutError("");
    setManualForm({ nombre: "", rut: "", direccion: "", email: "", metodoPago: "transferencia", comprobante: null, comprobanteName: "" });
    setTimeout(() => scrollTo(topRef), 0);
  };
  const cancelManual = () => {
    setMode("list"); setEditId(null); setEditFolio(null); setRutError("");
    setManualForm({ nombre: "", rut: "", direccion: "", email: "", metodoPago: "transferencia", comprobante: null, comprobanteName: "" });
    setTimeout(() => scrollTo(topRef), 0);
  };

  /* ===== Form Manual onChange ===== */
  const onManualChange = (e) => {
    const { name, value, files } = e.target;
    if (name === "rut") {
      const f = formatearRut(value);
      setManualForm((s) => ({ ...s, rut: f }));
      if (f.length >= 3) setRutError(!validarRut(f) ? "RUT inválido. Verifica dígito verificador." : "");
      else setRutError("");
      return;
    }
    if (name === "metodoPago") {
      return setManualForm((s) => ({ ...s, metodoPago: value, comprobante: null, comprobanteName: "" }));
    }
    if (name === "comprobante") {
      const f = files?.[0] ?? null;
      return setManualForm((s) => ({ ...s, comprobante: f, comprobanteName: f?.name || "" }));
    }
    setManualForm((s) => ({ ...s, [name]: value }));
  };

  /* ===== Aprobar / Rechazar ===== */
  const aprobar = async () => { if (!seleccion) return; setWantDownload(false); setShowApprove(true); };
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
        const urlPDF = `${BASE}/api/certificados/${encodeURIComponent(seleccion.ID_Cert)}/pdf`;
        window.open(urlPDF, "_blank", "noopener,noreferrer");
      }
      await Promise.all([refreshList(), refreshHist()]);
      setSeleccion(null); setRespuesta("");
      alert("✅ Certificado aprobado.");
    } catch (e) {
      console.error(e);
      alert("No se pudo aprobar.");
    } finally { setBusy(false); }
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
      setSeleccion(null); setRespuesta("");
      alert("❌ Certificado rechazado.");
    } catch (e) { console.error(e); alert("No se pudo rechazar."); }
    finally { setBusy(false); }
  };

  /* ===== Guardar Manual ===== */
  const doSaveManualNew = async (payload) => {
    const creado = await CertAPI.solicitarDesdeWeb(payload);
    const nuevoId = creado?.ID_Cert;
    if (nuevoId && manualForm.comprobante) {
      await CertAPI.subirComprobante(nuevoId, manualForm.comprobante);
    }
    await CertAPI.cambiarEstado(nuevoId, {
      estado: "Aprobado",
      comentario: "Aprobado (ingreso manual)",
      validadorId: null,
    });
    await Promise.all([refreshList(), refreshHist()]);
    setMode("list");
    setManualForm({ nombre: "", rut: "", direccion: "", email: "", metodoPago: "transferencia", comprobante: null, comprobanteName: "" });
    alert("✅ Ingreso manual registrado y aprobado.");
  };

  const saveManual = async (e) => {
    e.preventDefault();
    if (!validarRut(manualForm.rut)) { setRutError("RUT inválido. Verifica dígito verificador."); return; }
    const payload = {
      nombre: manualForm.nombre,
      rut: normalizarRut(manualForm.rut),
      direccion: manualForm.direccion,
      email: manualForm.email,
      metodoPago: manualForm.metodoPago.toLowerCase() === "fisico" ? "Fisico" : "Transferencia",
      notas: "Ingreso manual por directiva",
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
        setMode("list"); setEditFolio(null); setEditId(null);
        setManualForm({ nombre: "", rut: "", direccion: "", email: "", metodoPago: "transferencia", comprobante: null, comprobanteName: "" });
        alert("✅ Cambios guardados.");
        return;
      }
      if (editId) {
        await CertAPI.actualizar(editId, payload);
        await Promise.all([refreshList(), refreshHist()]);
        setMode("list"); setEditId(null);
        setManualForm({ nombre: "", rut: "", direccion: "", email: "", metodoPago: "transferencia", comprobante: null, comprobanteName: "" });
        alert("✅ Registro actualizado.");
        return;
      }
      setPendingPayload(payload);
      setShowSaveConfirm(true);
    } catch (err) {
      console.error(err);
      alert("No se pudo guardar el ingreso manual.");
    } finally { setBusy(false); }
  };

  const confirmSaveAccept = async () => {
    if (!pendingPayload) return setShowSaveConfirm(false);
    try { setBusy(true); setShowSaveConfirm(false); await doSaveManualNew(pendingPayload); }
    catch (e) { console.error(e); alert("No se pudo completar el ingreso manual."); }
    finally { setBusy(false); setPendingPayload(null); }
  };
  const confirmSaveCancel = () => { setShowSaveConfirm(false); setPendingPayload(null); };

  /* ===== Historial – acciones ===== */
  const onHistView = async (folio) => {
    try {
      setBusy(true);
      const row = await CertAPI.obtenerPorFolio(folio);
      setSeleccion(row); setMode("list");
      if (!showHistory) setShowHistory(true);
      setTimeout(() => scrollTo(detailRef), 0);
    } catch (e) { alert("No se pudo abrir el detalle."); console.error(e); }
    finally { setBusy(false); }
  };

  const onHistEdit = async (folio) => {
    try {
      setBusy(true);
      const row = await CertAPI.obtenerPorFolio(folio);
      setEditFolio(folio);
      const estado = String(row?.Estado || "").toLowerCase();
      setEditId(estado === "pendiente" ? (row.ID_Cert ?? null) : null);
      setManualForm({
        nombre: row.Nombre || "",
        rut: row.RUT || "",
        direccion: row.Direccion || "",
        email: row.Email || "",
        metodoPago: row.Metodo_Pago?.toLowerCase() === "fisico" ? "fisico" : "transferencia",
        comprobante: null, comprobanteName: "",
      });
      setMode("manual"); setRutError("");
      setTimeout(() => scrollTo(topRef), 0);
    } catch (e) { alert("No se pudo abrir para editar."); console.error(e); }
    finally { setBusy(false); }
  };

  const onHistDelete = async (folio) => {
    if (!confirm(`¿Eliminar la solicitud ${folio}? Esta acción no se puede deshacer.`)) return;
    try {
      setBusy(true);
      // Optimista en UI
      setHistorial((prev) => (prev || []).filter((h) => (h.Folio || h.ID_Cert) !== folio));
      setPendientes((prev) => (prev || []).filter((p) => p.Folio !== folio));
      await CertAPI.eliminarPorFolio(folio);
      await Promise.all([refreshList(), refreshHist()]);
      if (seleccion?.Folio === folio) setSeleccion(null);
      alert("🗑️ Eliminado.");
    } catch (e) {
      console.error(e); alert("No se pudo eliminar.");
      await Promise.all([refreshList(), refreshHist()]);
    } finally { setBusy(false); }
  };

  /* ===== Exportar Excel (XLSX estilizado) ===== */
  async function loadExcelJS() {
    if (window.ExcelJS) return window.ExcelJS;
    await new Promise((resolve, reject) => {
      const s = document.createElement("script");
      s.src = "https://cdn.jsdelivr.net/npm/exceljs/dist/exceljs.min.js";
      s.onload = resolve;
      s.onerror = reject;
      document.head.appendChild(s);
    });
    return window.ExcelJS;
  }

  const exportHistoryToXLSX = async () => {
    if (!historial || !historial.length) {
      alert("No hay datos para exportar.");
      return;
    }

    let ExcelJS;
    try {
      ExcelJS = await loadExcelJS();
    } catch (e) {
      console.error("No se pudo cargar ExcelJS:", e);
      alert("Error al cargar ExcelJS. Ver consola.");
      return;
    }

    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet("Historial");

    // Layout general
    ws.properties.defaultRowHeight = 22;
    ws.mergeCells("A1:I1");
    const title = ws.getCell("A1");
    title.value = "Historial – Certificados de Residencia solicitados";
    title.font = { bold: true, size: 16 };
    title.alignment = { horizontal: "center", vertical: "middle" };
    title.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFEFF6FF" } };

    // Cabecera
    const headers = [
      "Folio",
      "Nombre",
      "RUT",
      "Dirección",
      "Email",
      "Estado",
      "Origen",
      "Método de pago",
      "Fecha",
    ];
    const headerRow = ws.addRow(headers);
    headerRow.eachCell((cell) => {
      cell.font = { bold: true, color: { argb: "FF1E293B" } };
      cell.alignment = { horizontal: "center", vertical: "middle" };
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFDCEBFF" } };
      cell.border = {
        top: { style: "thin", color: { argb: "FFCBD5E1" } },
        left: { style: "thin", color: { argb: "FFCBD5E1" } },
        bottom: { style: "thin", color: { argb: "FFCBD5E1" } },
        right: { style: "thin", color: { argb: "FFCBD5E1" } },
      };
    });

    ws.columns = [
      { key: "folio", width: 10 },
      { key: "nombre", width: 25 },
      { key: "rut", width: 15 },
      { key: "direccion", width: 35 },
      { key: "email", width: 28 },
      { key: "estado", width: 15 },
      { key: "origen", width: 12 },
      { key: "metodoPago", width: 18 },
      { key: "fecha", width: 14 },
    ];

    // Cuerpo
    const rows = historial.map((h) => {
      const comentario = h.Comentario || "";
      const origenManual =
        (typeof h.Manual === "boolean" && h.Manual) ||
        (typeof h.Ingreso_Manual === "boolean" && h.Ingreso_Manual) ||
        (typeof h.Notas === "string" && h.Notas.toLowerCase().includes("ingreso manual")) ||
        comentario.toLowerCase().includes("ingreso manual");

      return {
        folio: h.Folio || h.ID_Cert || "",
        nombre: h.Nombre || "",
        rut: h.RUT || "",
        direccion: h.Direccion || "",
        email: h.Email || "",
        estado: h.Estado || "",
        origen: origenManual ? "Manual" : "Web",
        metodoPago: h.Metodo_Pago || "",
        fecha: h.Fecha_Cambio ? new Date(h.Fecha_Cambio) : "",
      };
    });

    rows.forEach((r) => {
      const row = ws.addRow(Object.values(r));
      row.height = 22;
      row.alignment = { vertical: "middle" };

      // Color del Estado
      const estadoCell = row.getCell(6);
      const estado = String(r.estado || "").toLowerCase();
      if (estado === "aprobado") estadoCell.font = { color: { argb: "FF16A34A" }, bold: true };
      else if (estado === "rechazado") estadoCell.font = { color: { argb: "FFDC2626" }, bold: true };
      else if (estado === "pendiente") estadoCell.font = { color: { argb: "FFEAB308" }, bold: true };

      // Fecha con formato
      const fechaCell = row.getCell(9);
      if (r.fecha && r.fecha instanceof Date && !isNaN(r.fecha))
        fechaCell.numFmt = "dd-mm-yy";
    });

    // Bordes suaves
    ws.eachRow({ includeEmpty: false }, (row) => {
      row.eachCell((cell) => {
        cell.border = {
          top: { style: "thin", color: { argb: "FFE5E7EB" } },
          left: { style: "thin", color: { argb: "FFE5E7EB" } },
          bottom: { style: "thin", color: { argb: "FFE5E7EB" } },
          right: { style: "thin", color: { argb: "FFE5E7EB" } },
        };
      });
    });

    // Descargar
    const fechaHoy = new Date().toISOString().slice(0, 10);
    const buffer = await wb.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `historial_certificados_${fechaHoy}.xlsx`;
    a.click();
    URL.revokeObjectURL(url);
  };

  /* ===== Otros ===== */
  const toggleHistory = () => { setShowHistory((s) => !s); setSeleccion(null); setTimeout(() => scrollTo(historyRef), 0); };

  const hasDetail = Boolean(seleccion) && mode === "list";
  const isFinal = !!seleccion && ["Aprobado", "Rechazado"].includes(String(seleccion.Estado || "").trim());
  const isManual =
    !!seleccion &&
    (
      seleccion.Ingreso_Manual === true ||
      seleccion.Manual === true ||
      (typeof seleccion.Notas === "string" && seleccion.Notas.toLowerCase().includes("ingreso manual")) ||
      (typeof seleccion.Comentario === "string" && seleccion.Comentario.toLowerCase().includes("ingreso manual"))
    );

  /* =================== Render =================== */
  return (
    <div className="cd" ref={topRef}>
      {/* Header */}
      <header className="cd__header">
        <div className="cd__headerRow">
          <h1 className="cd__title">Certificados de Residencia</h1>
          <div className="cd__actionsTop">
            <button className="cd__btn" onClick={openManual}>Ingreso manual</button>
            <button className="cd__btn cd__btn--ghost" onClick={toggleHistory}>
              {showHistory ? "Ocultar historial" : "Historial"}
            </button>
            {/* Exportar Excel */}
            <button className="cd__btn cd__btn--ghost" onClick={exportHistoryToXLSX}>
              Exportar Excel
            </button>
          </div>
        </div>
        <p className="cd__desc">
          Gestiona <strong>solicitudes pendientes</strong>, crea registros manuales y consulta el <strong>historial</strong>.
        </p>
      </header>

      {/* Main */}
      {mode === "manual" ? (
        <section className="cd__card cd__manual">
          <div className="cd__manualHead">
            <h2>{editId || editFolio ? "Editar solicitud" : "Ingreso manual de solicitud"}</h2>
            <button className="cd__btn cd__btn--ghost" onClick={cancelManual}>Cerrar</button>
          </div>

          <form className="cd__form" onSubmit={saveManual}>
            <div className="cd__gridForm">
              <label className="cd__group"><span>Nombre</span>
                <input name="nombre" value={manualForm.nombre} onChange={onManualChange} required />
              </label>
              <label className="cd__group"><span>RUT</span>
                <input name="rut" value={manualForm.rut} onChange={onManualChange} placeholder="12.345.678-5" required aria-invalid={!!rutError}/>
                {rutError && <small className="cd__error">{rutError}</small>}
              </label>
              <label className="cd__group"><span>Correo</span>
                <input type="email" name="email" value={manualForm.email} onChange={onManualChange} required />
              </label>
              <label className="cd__group cd__group--full"><span>Dirección</span>
                <input name="direccion" value={manualForm.direccion} onChange={onManualChange} required />
              </label>
              <label className="cd__group"><span>Método de pago</span>
                <select name="metodoPago" value={manualForm.metodoPago} onChange={onManualChange}>
                  <option value="transferencia">Transferencia</option>
                  <option value="fisico">Pago presencial</option>
                </select>
              </label>
              {(manualForm.metodoPago === "transferencia" || manualForm.metodoPago === "fisico") && (
                <label className="cd__group cd__group--full">
                  <span>{manualForm.metodoPago === "transferencia" ? "Comprobante (jpg, png, pdf)" : "Comprobante presencial (opcional boleta)"}</span>
                  <input type="file" name="comprobante" accept=".jpg,.jpeg,.png,.pdf" onChange={onManualChange}/>
                  {manualForm.comprobanteName && <small className="cd__hint">Archivo: {manualForm.comprobanteName}</small>}
                </label>
              )}
            </div>

            <div className="cd__actionsRow" style={{ justifyContent: "flex-end" }}>
              <button type="button" className="cd__btn cd__btn--ghost" onClick={cancelManual} disabled={busy}>Cancelar</button>
              <button type="submit" className="cd__btn cd__btn--ok" disabled={busy}>
                {editId || editFolio ? "Guardar cambios" : "Guardar"}
              </button>
            </div>
          </form>
        </section>
      ) : (
        <section className={`cd__gridMain ${hasDetail ? "has-detail" : ""}`}>
          {/* Pendientes */}
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
                    <th>N°</th><th>Nombre</th><th>RUT</th><th>Fecha</th><th>Estado</th><th>Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {loadingList && <tr><td colSpan="6">Cargando…</td></tr>}
                  {!loadingList && pendientesOrdenados.map((r) => (
                    <tr key={r.ID_Cert} className={seleccion?.ID_Cert === r.ID_Cert ? "is-sel" : ""}>
                      <td>{r.Folio}</td>
                      <td>{r.Nombre}</td>
                      <td>{formatearRut(r.RUT)}</td>
                      <td>{fmtDate(r.Fecha_Solicitud)}</td>
                      <td><span className="cd__badge is-pending">Pendiente</span></td>
                      <td><button className="cd__btn cd__btn--ghost" onClick={() => openDetail(r)}>Revisar</button></td>
                    </tr>
                  ))}
                  {!loadingList && pendientesOrdenados.length === 0 && <tr><td colSpan="6">Sin solicitudes pendientes.</td></tr>}
                </tbody>
              </table>
            </div>
          </section>

          {/* Detalle */}
          {hasDetail && (
            <section className="cd__card cd__detail" ref={detailRef} id="cd-detail">
              <div className="cd__detailHead">
                <h2>Detalle de la solicitud</h2>
                <button className="cd__btn cd__btn--ghost" onClick={closeDetail}>Cerrar</button>
              </div>

              <div className="cd__detailGrid">
                <div className="cd__kv"><span className="cd__k">Folio</span><span className="cd__v">{seleccion.Folio}</span></div>
                <div className="cd__kv"><span className="cd__k">Solicitante</span><span className="cd__v">{seleccion.Nombre}</span></div>
                <div className="cd__kv"><span className="cd__k">RUT</span><span className="cd__v">{formatearRut(seleccion.RUT)}</span></div>
                <div className="cd__kv"><span className="cd__k">Dirección</span><span className="cd__v">{seleccion.Direccion}</span></div>
                <div className="cd__kv"><span className="cd__k">Correo</span>
                  <span className="cd__v"><a className="cd__link" href={`mailto:${seleccion.Email}`}>{seleccion.Email}</a></span>
                </div>
                <div className="cd__kv"><span className="cd__k">Estado</span>
                  <span className="cd__v"><span className="cd__badge is-review">{seleccion.Estado}</span></span>
                </div>

                {/* Origen sin color (solo texto) */}
                {isManual && (
                  <div className="cd__kv">
                    <span className="cd__k">Origen</span>
                    <span className="cd__v">Ingreso manual</span>
                  </div>
                )}

                {seleccion.Metodo_Pago && (
                  <div className="cd__kv">
                    <span className="cd__k">Método de pago</span>
                    <span className="cd__v">{seleccion.Metodo_Pago}</span>
                  </div>
                )}

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
                                  <svg viewBox="0 0 24 24"><path d="M12 3a1 1 0 0 1 1 1v8.586l2.293-2.293a1 1 0 1 1 1.414 1.414l-4 4a1 1 0 0 1-1.414 0l-4-4a1 1 0 1 1 1.414-1.414L11 12.586V4a1 1 0 0 1 1-1zM5 20a1 1 0 1 1 0-2h14a1 1 0 1 1 0 2H5z"/></svg>
                                </a>
                                <img src={abs} alt="Comprobante" />
                              </div>
                            )}
                            {esPDFurl(abs) && <embed src={abs} type="application/pdf" width="100%" height="360" />}
                          </>
                        );
                      })()}
                    </div>
                  </div>
                )}

                {!isFinal && (
                  <div className="cd__actionsRow">
                    <button className="cd__btn cd__btn--ok" onClick={aprobar} disabled={busy}>Aprobar</button>
                    <button className="cd__btn cd__btn--danger" onClick={rechazar} disabled={busy}>Rechazar</button>
                    <button className="cd__btn cd__btn--warn" onClick={() => alert(`📨 Pedir más info a ${seleccion.Email}`)} disabled={busy}>Pedir más info</button>
                  </div>
                )}

                <div className="cd__resp">
                  <label htmlFor="resp">Comentario para el vecino</label>
                  <textarea id="resp" rows={4} value={respuesta} onChange={(e) => setRespuesta(e.target.value)} placeholder="Escribe aquí tu comentario…"/>
                </div>
              </div>
            </section>
          )}
        </section>
      )}

      {/* Historial */}
      {showHistory && (
        <section className="cd__card cd__history" ref={historyRef} id="cd-history">
          <div className="cd__historyHead">
            <h2>Historial de Certificados solicitados</h2>
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
                  <th>N°</th><th>Nombre</th><th>RUT</th><th>Fecha</th><th>Estado</th><th className="cd__th--icons">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {loadingHist && <tr><td colSpan="6">Cargando…</td></tr>}
                {!loadingHist && histList.map((h) => (
                  <tr key={`${h.folio}-${h.ts}`}>
                    <td>{h.folio}</td>
                    <td>{h.nombre}</td>
                    <td>{formatearRut(h.rut)}</td>
                    <td>{fmtDate(h.ts)}</td>
                    <td>
                      <span className={"cd__badge " + (h.estado === "Pendiente" ? "is-pending" : h.estado === "Aprobado" ? "is-ok" : "is-bad")}>
                        {h.estado}
                      </span>
                    </td>
                    <td className="cd__td--icons">
                      <button className="cd__iconBtn" title="Ver" onClick={() => onHistView(h.folio)}><IconoVer /></button>
                      <button className="cd__iconBtn" title="Editar" onClick={() => onHistEdit(h.folio)}><IconoEditar /></button>
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

      {/* Modales */}
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
      <SaveConfirmModal
        open={showSaveConfirm}
        onCancel={confirmSaveCancel}
        onAccept={confirmSaveAccept}
        datos={{
          nombre: pendingPayload?.nombre,
          rut: formatearRut(pendingPayload?.rut || ""),
          direccion: pendingPayload?.direccion,
          email: pendingPayload?.email,
          metodoPago: pendingPayload?.metodoPago,
        }}
      />
    </div>
  );
}

/* =================== Wrapper =================== */
export default function CertificadosDirectiva() {
  const user = { nombre: "Nombre Directiva", cargo: "Cargo" };
  return (
    <PanelLateralD title="Certificados" user={user} showTopUser={false}>
      <CertificadosContent />
    </PanelLateralD>
  );
}
