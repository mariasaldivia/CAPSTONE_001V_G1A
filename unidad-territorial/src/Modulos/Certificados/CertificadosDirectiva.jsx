import { useMemo, useRef, useState } from "react";
import PanelLateralD from "../../components/PanelLateralD";
import "./CertificadosDirectiva.css";

/* Fecha corta */
const fmtDate = (iso) =>
  new Date(iso).toLocaleDateString(undefined, {
    year: "2-digit",
    month: "2-digit",
    day: "2-digit",
  });

/* RUT helper (solo formatea) */
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

/* Íconos */
function IconoVer() {
  return (
    <svg viewBox="0 0 24 24" className="cd__icon" aria-hidden="true">
      <path d="M12 5c5 0 9 5 9 7s-4 7-9 7-9-5-9-7 4-7 9-7zm0 2C8 7 4.9 10.5 4.2 12 4.9 13.5 8 17 12 17s7.1-3.5 7.8-5C19.1 10.5 16 7 12 7zm0 2a3 3 0 110 6 3 3 0 010-6z"/>
    </svg>
  );
}
function IconoEditar() {
  return (
    <svg viewBox="0 0 24 24" className="cd__icon" aria-hidden="true">
      <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1 1 0 000-1.42l-2.34-2.34a1 1 0 00-1.42 0l-1.83 1.83 3.75 3.75 1.82-1.82z"/>
    </svg>
  );
}
function IconoEliminar() {
  return (
    <svg viewBox="0 0 24 24" className="cd__icon" aria-hidden="true">
      <path d="M6 7h12v2H6V7zm2 3h8l-1 10H9L8 10zm3-7h2l1 2h4v2H4V5h4l1-2z"/>
    </svg>
  );
}

/* MOCKS (luego los reemplazamos por fetch al backend) */
const MOCK = [
  {
    id: "C-00041",
    creado_ts: "2025-09-30T18:12:00",
    nombre: "Jorge Soto",
    rut: "15.678.123-3",
    direccion: "Los Pinos 345",
    email: "jorgesoto@gmail.com",
    comprobante: { name: "deposito_4132.jpg", type: "image/jpeg", url: "/img/comprobante.jpg" },
    estado: "Pendiente",
    notas: "",
  },
  {
    id: "C-00042",
    creado_ts: "2025-10-01T09:35:00",
    nombre: "Camila Reyes",
    rut: "15.678.123-3",
    direccion: "El Aromo 456",
    email: "camilareyes@gmail.com",
    comprobante: { name: "deposito_7710.jpg", type: "image/jpeg", url: "/img/comprobante.jpg" },
    estado: "Aprobado",
    notas: "OK",
  },
  {
    id: "C-00043",
    creado_ts: "2025-10-01T10:20:00",
    nombre: "Ana Torres",
    rut: "8.345.121-9",
    direccion: "Av. Central 123",
    email: "torresana@gmail.com",
    comprobante: { name: "deposito_5521.jpg", type: "image/jpeg", url: "/img/comprobante.jpg" },
    estado: "Pendiente",
    notas: "",
  },
];

const MOCK_HISTORY = [
  { id: "C-00041", nombre: "Jorge Soto",  rut: "15.678.123-3", estado: "Pendiente", ts: "2025-09-30T18:12:00" },
  { id: "C-00042", nombre: "Camila Reyes", rut: "15.678.123-3", estado: "Aprobado",  ts: "2025-10-01T09:35:00" },
  { id: "C-00043", nombre: "Ana Torres",   rut: "8.345.121-9", estado: "Pendiente", ts: "2025-10-01T10:20:00" },
];

function CertificadosContent() {
  /* modos: list | manual */
  const [mode, setMode] = useState("list");
  const [orden, setOrden] = useState("recientes");
  const [seleccion, setSeleccion] = useState(null);
  const [respuesta, setRespuesta] = useState("");

  const [showHistory, setShowHistory] = useState(false);
  const [histOrder, setHistOrder] = useState("recientes");

  const [manualForm, setManualForm] = useState({
    nombre: "", rut: "", direccion: "", email: "",
    metodoPago: "transferencia",
    comprobante: null, comprobanteName: ""
  });

  const topRef = useRef(null);
  const detailRef = useRef(null);
  const historyRef = useRef(null);

  /* SOLO pendientes en la lista principal */
  const pendientes = useMemo(() => {
    const base = MOCK.filter(x => x.estado === "Pendiente");
    if (orden === "recientes") {
      return base.sort((a,b) => new Date(b.creado_ts) - new Date(a.creado_ts));
    }
    return base;
  }, [orden]);

  /* Historial: todos */
  const histList = useMemo(() => {
    let arr = [...MOCK_HISTORY];
    const byTsDesc = (a,b)=> new Date(b.ts) - new Date(a.ts);
    const byTsAsc  = (a,b)=> new Date(a.ts) - new Date(b.ts);
    switch (histOrder) {
      case "antiguos":   return arr.sort(byTsAsc);
      case "aprobados":  return arr.filter(h=>h.estado.toLowerCase()==="aprobado").sort(byTsDesc);
      case "rechazados": return arr.filter(h=>h.estado.toLowerCase()==="rechazado").sort(byTsDesc);
      case "pendientes": return arr.filter(h=>h.estado.toLowerCase()==="pendiente").sort(byTsDesc);
      default:           return arr.sort(byTsDesc);
    }
  }, [histOrder]);

  /* helpers UI */
  const scrollTo = (ref)=> ref?.current?.scrollIntoView({behavior:"smooth", block:"start"});
  const openDetail = (row) => { setSeleccion(row); setMode("list"); setTimeout(()=>scrollTo(detailRef), 0); };
  const closeDetail = () => { setSeleccion(null); setTimeout(()=>scrollTo(topRef), 0); };

  const openManual = () => {
    setSeleccion(null);
    setShowHistory(false);
    setMode("manual");
    setTimeout(()=>scrollTo(topRef), 0);
  };
  const cancelManual = () => {
    setMode("list");
    setManualForm({ nombre:"", rut:"", direccion:"", email:"", metodoPago:"transferencia", comprobante:null, comprobanteName:"" });
    setTimeout(()=>scrollTo(topRef), 0);
  };
  const onManualChange = (e) => {
    const { name, value, files } = e.target;
    if (name === "rut") return setManualForm(s => ({...s, rut: formatearRut(value)}));
    if (name === "metodoPago") return setManualForm(s=>({...s, metodoPago:value, comprobante:null, comprobanteName:""}));
    if (name === "comprobante") {
      const f = files?.[0] ?? null;
      return setManualForm(s=>({...s, comprobante:f, comprobanteName:f?.name || ""}));
    }
    setManualForm(s=>({...s, [name]: value}));
  };
  const saveManual = (e) => {
    e.preventDefault();
    alert(`Ingreso manual (UI): ${manualForm.nombre} - ${manualForm.rut} (${manualForm.metodoPago}${manualForm.comprobanteName?": "+manualForm.comprobanteName:""})`);
    cancelManual();
  };

  const toggleHistory = () => {
    setShowHistory(s=>!s);
    setSeleccion(null);
    setTimeout(()=>scrollTo(historyRef), 0);
  };
  const exportHistoryToPDF = () => {
    const was = showHistory;
    if (!was) setShowHistory(true);
    setTimeout(()=>{ window.print(); if (!was) setShowHistory(false); }, 50);
  };

  /* acciones (UI) */
  const aprobar = ()=> seleccion && alert(`✅ Aprobado ${seleccion.id}`);
  const rechazar = ()=> seleccion && alert(`❌ Rechazado ${seleccion.id}`);
  const pedirInfo = ()=> seleccion && alert(`📨 Pedir más info a ${seleccion.email}`);

  const esPDF = (f)=> f?.type==="application/pdf" || (f?.name||"").toLowerCase().endsWith(".pdf");
  const esIMG = (f)=> f?.type?.startsWith("image/");

  /* layout flags */
  const hasDetail = Boolean(seleccion) && mode === "list";

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
            <button className="cd__btn cd__btn--ghost" onClick={exportHistoryToPDF}>Exportar PDF</button>
          </div>
        </div>
        <p className="cd__desc">
          Gestiona <strong>solicitudes pendientes</strong>. Al presionar <em>Revisar</em>, verás el
          <strong> detalle</strong> a la derecha. <strong>Ingreso manual</strong> abre un formulario
          de registro presencial. El <strong>historial</strong> incluye pendientes y resueltas.
        </p>
      </header>

      {/* ZONA PRINCIPAL: lista/detalle ó ingreso manual */}
      {mode === "manual" ? (
        <section className="cd__card cd__manual">
          <div className="cd__manualHead">
            <h2>Ingreso manual de solicitud</h2>
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
                  <option value="fisico">Pago físico presencial</option>
                </select>
              </label>
              {manualForm.metodoPago === "transferencia" && (
                <label className="cd__group cd__group--full">
                  <span>Comprobante (jpg, png, pdf)</span>
                  <input type="file" name="comprobante" accept=".jpg,.jpeg,.png,.pdf" onChange={onManualChange} required />
                  {manualForm.comprobanteName && <small className="cd__hint">Archivo: {manualForm.comprobanteName}</small>}
                </label>
              )}
            </div>

            <div className="cd__actionsRow" style={{ justifyContent: "flex-end" }}>
              <button type="button" className="cd__btn cd__btn--ghost" onClick={cancelManual}>Cancelar</button>
              <button type="submit" className="cd__btn cd__btn--ok">Guardar</button>
            </div>
          </form>
        </section>
      ) : (
        <section className={`cd__gridMain ${hasDetail ? "has-detail" : ""}`}>
          {/* LISTA */}
          <section className="cd__card cd__list">
            <div className="cd__listHead">
              <h2>Solicitudes (Pendientes)</h2>
              <label className="cd__order">
                Ordenar por{" "}
                <select value={orden} onChange={(e)=>setOrden(e.target.value)} aria-label="Ordenar lista">
                  <option value="recientes">Más recientes</option>
                  <option value="pendientes">Pendientes primero</option>
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
                  {pendientes.map(r=>(
                    <tr key={r.id} className={seleccion?.id===r.id ? "is-sel" : ""}>
                      <td>{r.id}</td>
                      <td>{r.nombre}</td>
                      <td>{formatearRut(r.rut)}</td>
                      <td>{fmtDate(r.creado_ts)}</td>
                      <td><span className="cd__badge is-pending">Pendiente</span></td>
                      <td>
                        <button className="cd__btn cd__btn--ghost" onClick={()=>openDetail(r)}>Revisar</button>
                      </td>
                    </tr>
                  ))}
                  {pendientes.length===0 && (
                    <tr><td colSpan="6">Sin solicitudes pendientes.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          {/* DETALLE (sólo visible con selección) */}
          {hasDetail && (
            <section className="cd__card cd__detail" ref={detailRef} id="cd-detail">
              <div className="cd__detailHead">
                <h2>Detalle de la solicitud</h2>
                <button className="cd__btn cd__btn--ghost" onClick={closeDetail}>Cerrar</button>
              </div>

              <div className="cd__detailGrid">
                <div className="cd__kv"><span className="cd__k">Solicitante</span><span className="cd__v">{seleccion.nombre}</span></div>
                <div className="cd__kv"><span className="cd__k">RUT</span><span className="cd__v">{formatearRut(seleccion.rut)}</span></div>
                <div className="cd__kv"><span className="cd__k">Dirección</span><span className="cd__v">{seleccion.direccion}</span></div>
                <div className="cd__kv"><span className="cd__k">Correo</span><span className="cd__v"><a className="cd__link" href={`mailto:${seleccion.email}`}>{seleccion.email}</a></span></div>
                <div className="cd__kv"><span className="cd__k">Estado</span><span className="cd__v"><span className="cd__badge is-review">En revisión</span></span></div>

                <div className="cd__block">
                  <span className="cd__k">Comprobante</span>
                  <div className="cd__file">
                    {esIMG(seleccion.comprobante) && (
                      <div className="cd__imgWrap">
                        <a href={seleccion.comprobante.url} download={seleccion.comprobante.name || "comprobante"} className="cd__dl" title="Descargar">
                          <svg viewBox="0 0 24 24"><path d="M12 3a1 1 0 0 1 1 1v8.586l2.293-2.293a1 1 0 1 1 1.414 1.414l-4 4a1 1 0 0 1-1.414 0l-4-4a1 1 0 1 1 1.414-1.414L11 12.586V4a1 1 0 0 1 1-1zM5 20a1 1 0 1 1 0-2h14a1 1 0 1 1 0 2H5z"/></svg>
                        </a>
                        <img src={seleccion.comprobante.url} alt={seleccion.comprobante.name} />
                      </div>
                    )}
                    {esPDF(seleccion.comprobante) && (
                      <embed src={seleccion.comprobante.url} type="application/pdf" width="100%" height="240" />
                    )}
                  </div>
                </div>

                <div className="cd__actionsRow">
                  <button className="cd__btn cd__btn--ok" onClick={aprobar}>Aprobar</button>
                  <button className="cd__btn cd__btn--danger" onClick={rechazar}>Rechazar</button>
                  <button className="cd__btn cd__btn--warn" onClick={pedirInfo}>Pedir más info</button>
                </div>

                <div className="cd__resp">
                  <label htmlFor="resp">Comentario para el vecino</label>
                  <textarea id="resp" rows={4} value={respuesta} onChange={e=>setRespuesta(e.target.value)} placeholder="Escribe aquí tu comentario…" />
                </div>
              </div>
            </section>
          )}
        </section>
      )}

      {/* HISTORIAL (siempre debajo) */}
      {showHistory && (
        <section className="cd__card cd__history" ref={historyRef} id="cd-history">
          <div className="cd__historyHead">
            <h2>Historial</h2>
            <label className="cd__order">
              Filtrar{" "}
              <select value={histOrder} onChange={(e)=>setHistOrder(e.target.value)}>
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
                  <th>N°</th><th>Nombre</th><th>RUT</th><th>Fecha</th><th>Estado</th>
                  <th className="cd__th--icons">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {histList.map(h=>(
                  <tr key={h.id}>
                    <td>{h.id}</td>
                    <td>{h.nombre}</td>
                    <td>{formatearRut(h.rut)}</td>
                    <td>{fmtDate(h.ts)}</td>
                    <td>
                      <span className={
                        "cd__badge " + (h.estado==="Pendiente" ? "is-pending" :
                                        h.estado==="Aprobado" ? "is-ok" : "is-bad")
                      }>{h.estado}</span>
                    </td>
                    <td className="cd__td--icons">
                      <button className="cd__iconBtn" title="Ver"><IconoVer/></button>
                      <button className="cd__iconBtn" title="Editar"><IconoEditar/></button>
                      <button className="cd__iconBtn" title="Eliminar"><IconoEliminar/></button>
                    </td>
                  </tr>
                ))}
                {histList.length===0 && <tr><td colSpan="6">Sin registros.</td></tr>}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}

export default function CertificadosDirectiva() {
  const user = { nombre: "Nombre Directiva", cargo: "Cargo" };
  return (
    <PanelLateralD title="Certificados" user={user} showTopUser={false}>
      <CertificadosContent />
    </PanelLateralD>
  );
}
