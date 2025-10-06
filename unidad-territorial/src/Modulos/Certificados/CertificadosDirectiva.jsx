import { useMemo, useRef, useState } from "react";
import PanelLateralD from "../../components/PanelLateralD";
import "./CertificadosDirectiva.css";

/* Utilidad: mostrar fecha/hora legible */
const fmtDate = (iso) =>
  new Date(iso).toLocaleDateString(undefined, { year: "2-digit", month: "2-digit", day: "2-digit" });
const fmtTime = (iso) =>
  new Date(iso).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });

/* (Opcional) utilidades de RUT si te sirven en detalle */
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

/* MOCK de solicitudes entrantes */
const MOCK = [
  {
    id: "C-00041",
    creado_ts: "2025-09-30T18:12:00",
    nombre: "Claudia Pérez",
    rut: "12.345.678-5",
    direccion: "Calle 12 #345, Villa X",
    email: "claudia@example.com",
    comprobante: {
      name: "deposito_4132.jpg",
      type: "image/jpeg",
      url: "https://images.unsplash.com/photo-1518779578993-ec3579fee39f?q=80&w=1200&auto=format&fit=crop",
    },
    estado: "Pendiente", // Pendiente | En revisión | Aprobado | Rechazado
    notas: "",
  },
  {
    id: "C-00042",
    creado_ts: "2025-10-01T09:35:00",
    nombre: "Jorge Soto",
    rut: "15.678.123-3",
    direccion: "Los Robles 221, Villa Y",
    email: "jorge@example.com",
    comprobante: {
      name: "deposito_7710.pdf",
      type: "application/pdf",
      url: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
    },
    estado: "En revisión",
    notas: "Revisar monto",
  },
  {
    id: "C-00043",
    creado_ts: "2025-10-01T10:20:00",
    nombre: "Fauget Salinas",
    rut: "8.345.121-9",
    direccion: "Av. Central 123",
    email: "fauget@example.com",
    comprobante: {
      name: "deposito_5521.jpg",
      type: "image/jpeg",
      url: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=1200&auto=format&fit=crop",
    },
    estado: "Pendiente",
    notas: "",
  },
];

/* Historial simple */
const MOCK_HISTORY = [
  { id: "C-00041", accion: "Pendiente", ts: "2025-09-30T18:12:00" },
  { id: "C-00042", accion: "En revisión", ts: "2025-10-01T09:35:00" },
];

function CertificadosContent() {
  const [orden, setOrden] = useState("recientes"); // recientes | pendientes
  const [seleccion, setSeleccion] = useState(null);
  const [respuesta, setRespuesta] = useState("");
  const [showHistory, setShowHistory] = useState(false);
  const [histOrder, setHistOrder] = useState("recientes");

  const detailRef = useRef(null);
  const historyRef = useRef(null);

  const list = useMemo(() => {
    const base = [...MOCK];
    if (orden === "recientes") {
      return base.sort((a, b) => new Date(b.creado_ts) - new Date(a.creado_ts));
    }
    if (orden === "pendientes") {
      return base.sort((a, b) =>
        (a.estado === "Pendiente" ? -1 : 1) - (b.estado === "Pendiente" ? -1 : 1)
      );
    }
    return base;
  }, [orden]);

  const histList = useMemo(() => {
    let arr = [...MOCK_HISTORY];
    const byTsDesc = (a, b) => new Date(b.ts) - new Date(a.ts);
    const byTsAsc = (a, b) => new Date(a.ts) - new Date(b.ts);
    switch (histOrder) {
      case "antiguos":
        return arr.sort(byTsAsc);
      case "aprobados":
        return arr.filter((h) => h.accion.toLowerCase() === "aprobado").sort(byTsDesc);
      case "rechazados":
        return arr.filter((h) => h.accion.toLowerCase() === "rechazado").sort(byTsDesc);
      case "pendientes":
        return arr.filter((h) => h.accion.toLowerCase() === "pendiente").sort(byTsDesc);
      case "en_revision":
        return arr.filter((h) => h.accion.toLowerCase() === "en revisión").sort(byTsDesc);
      default:
        return arr.sort(byTsDesc);
    }
  }, [histOrder]);

  const scrollTo = (ref) => ref?.current?.scrollIntoView({ behavior: "smooth", block: "start" });

  const onRevisar = (row) => {
    setSeleccion(row);
    setTimeout(() => scrollTo(detailRef), 0);
  };

  const onToggleHistory = () => {
    setShowHistory((s) => !s);
    setTimeout(() => scrollTo(historyRef), 0);
  };

  const exportHistoryToPDF = () => {
    const wasVisible = showHistory;
    if (!wasVisible) setShowHistory(true);
    setTimeout(() => {
      window.print();
      if (!wasVisible) setShowHistory(false);
    }, 50);
  };

  const aprobar = () => {
    if (!seleccion) return;
    alert(`✅ Certificado ${seleccion.id} APROBADO`);
    // aquí guardarías en backend y empujarías al historial
  };
  const rechazar = () => {
    if (!seleccion) return;
    alert(`❌ Certificado ${seleccion.id} RECHAZADO`);
  };
  const solicitarInfo = () => {
    if (!seleccion) return;
    alert(`📨 Pedir más información a ${seleccion.email}`);
  };

  const esPDF = (file) =>
    file?.type === "application/pdf" || (file?.name || "").toLowerCase().endsWith(".pdf");
  const esIMG = (file) => file?.type?.startsWith("image/");

  return (
    <div className="cd">
      <header className="cd__header">
        <div className="cd__headerRow">
          <h1 className="cd__title">Certificados de Residencia</h1>

          <div className="cd__actionsTop">
            <button
              type="button"
              className="cd__btn cd__btn--ghost"
              onClick={onToggleHistory}
              aria-expanded={showHistory}
              aria-controls="cd-history"
            >
              {showHistory ? "Ocultar historial" : "Historial"}
            </button>
            <button
              type="button"
              className="cd__btn cd__btn--ghost"
              onClick={exportHistoryToPDF}
            >
              Exportar PDF
            </button>
          </div>
        </div>

        <p className="cd__desc">
          Revisa los datos enviados por los vecinos, valida el <strong>comprobante</strong> y{" "}
          <strong>aprueba</strong> o <strong>rechaza</strong> la solicitud. Puedes dejar un{" "}
          <strong>comentario</strong> para el solicitante.
        </p>
      </header>

      <section className="cd__grid">
        {/* LISTA */}
        <section className="cd__card cd__list">
          <div className="cd__listHead">
            <h2>Solicitudes</h2>
            <label className="cd__order">
              Ordenar por{" "}
              <select
                value={orden}
                onChange={(e) => setOrden(e.target.value)}
                aria-label="Ordenar lista"
              >
                <option value="recientes">Más recientes</option>
                <option value="pendientes">Pendientes primero</option>
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
                {list.map((r) => (
                  <tr
                    key={r.id}
                    className={seleccion?.id === r.id ? "is-sel" : ""}
                  >
                    <td>{r.id}</td>
                    <td>{r.nombre}</td>
                    <td>{formatearRut(r.rut)}</td>
                    <td>
                      {fmtDate(r.creado_ts)} · {fmtTime(r.creado_ts)}
                    </td>
                    <td>
                      <span
                        className={
                          "cd__badge " +
                          (r.estado === "Pendiente"
                            ? "is-pending"
                            : r.estado === "En revisión"
                            ? "is-review"
                            : r.estado === "Aprobado"
                            ? "is-ok"
                            : "is-bad")
                        }
                      >
                        {r.estado}
                      </span>
                    </td>
                    <td>
                      <button
                        className="cd__btn cd__btn--ghost"
                        onClick={() => onRevisar(r)}
                      >
                        Revisar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* DETALLE */}
        <section className="cd__card cd__detail" ref={detailRef} id="cd-detail">
          <h2>Detalle de la solicitud</h2>

          {seleccion ? (
            <div className="cd__detailGrid">
              <div className="cd__kv">
                <span className="cd__k">Solicitante</span>
                <span className="cd__v">{seleccion.nombre}</span>
              </div>
              <div className="cd__kv">
                <span className="cd__k">RUT</span>
                <span className="cd__v">{formatearRut(seleccion.rut)}</span>
              </div>
              <div className="cd__kv">
                <span className="cd__k">Dirección</span>
                <span className="cd__v">{seleccion.direccion}</span>
              </div>
              <div className="cd__kv">
                <span className="cd__k">Correo</span>
                <span className="cd__v">
                  <a href={`mailto:${seleccion.email}`} className="cd__link">
                    {seleccion.email}
                  </a>
                </span>
              </div>
              <div className="cd__kv">
                <span className="cd__k">Estado</span>
                <span className="cd__v">
                  <span className="cd__badge is-review">{seleccion.estado}</span>
                </span>
              </div>

              <div className="cd__block">
                <span className="cd__k">Comprobante</span>
                <div className="cd__file">
                  {esIMG(seleccion.comprobante) && (
                    <img
                      src={seleccion.comprobante.url}
                      alt={seleccion.comprobante.name}
                    />
                  )}
                  {esPDF(seleccion.comprobante) && (
                    <embed
                      src={seleccion.comprobante.url}
                      type="application/pdf"
                      width="100%"
                      height="240"
                    />
                  )}
                  {!esIMG(seleccion.comprobante) && !esPDF(seleccion.comprobante) && (
                    <a
                      className="cd__btn cd__btn--ghost"
                      href={seleccion.comprobante.url}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Ver archivo
                    </a>
                  )}
                </div>
              </div>

              <div className="cd__actionsRow">
                <button className="cd__btn cd__btn--ok" onClick={aprobar}>
                  Aprobar
                </button>
                <button className="cd__btn cd__btn--danger" onClick={rechazar}>
                  Rechazar
                </button>
                <button className="cd__btn cd__btn--warn" onClick={solicitarInfo}>
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
          ) : (
            <div className="cd__empty">
              Selecciona <strong>Revisar</strong> en una solicitud para ver el detalle.
            </div>
          )}
        </section>

        {/* HISTORIAL (condicional) */}
        {showHistory && (
          <section
            className="cd__card cd__history is-open"
            ref={historyRef}
            id="cd-history"
          >
            <div className="cd__historyHead">
              <h2>Historial</h2>
              <div className="cd__historyActions">
                <label className="cd__order">
                  Ordenar por{" "}
                  <select
                    value={histOrder}
                    onChange={(e) => setHistOrder(e.target.value)}
                    aria-label="Ordenar historial"
                  >
                    <option value="recientes">Más recientes</option>
                    <option value="antiguos">Más antiguos</option>
                    <option value="aprobados">Aprobados</option>
                    <option value="rechazados">Rechazados</option>
                    <option value="pendientes">Pendientes</option>
                    <option value="en_revision">En revisión</option>
                  </select>
                </label>
                <button
                  type="button"
                  className="cd__btn cd__btn--ghost"
                  onClick={() => setShowHistory(false)}
                >
                  Cerrar
                </button>
              </div>
            </div>

            <ul className="cd__timeline">
              {histList.map((h, i) => (
                <li key={i}>
                  <span className="cd__tWhen">
                    {fmtDate(h.ts)} · {fmtTime(h.ts)}
                  </span>
                  <span className="cd__tDot" />
                  <span className="cd__tTxt">
                    <strong>{h.id}</strong>{" "}
                    {h.accion === "Pendiente" ? "marcado como" : "cambiado a"}{" "}
                    <em>{h.accion}</em>.
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}
      </section>
    </div>
  );
}

export default function CertificadosDirectiva() {
  const user = { nombre: "Nombre Directiva", cargo: "Cargo" }; // rellena con datos reales
  return (
    <PanelLateralD title="Certificados" user={user} showTopUser={false}>
      <CertificadosContent />
    </PanelLateralD>
  );
}
