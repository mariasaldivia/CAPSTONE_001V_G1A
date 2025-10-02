// src/Modulos/Requerimientos/RequerimientosDirectiva.jsx
import { useMemo, useRef, useState } from "react";
import PanelLateralD from "../../components/PanelLateralD";
import "./RequerimientosDirectiva.css";

const MOCK = [
  {
    id: "R10234",
    socio: "Claudia",
    tipo: "Seguridad",
    fecha: "2025-10-01T12:00:00",
    fechaLabel: "Hoy",
    estado: "Pendiente",
    telefono: "+569 9999 9999",
    direccion: "Calle 12 #345, Villa X",
    detalle:
      "Solicito revisión de cámaras por incidentes ocurridos anoche en la calle 12.",
    adjunto:
      "https://images.unsplash.com/photo-1509099836639-18ba1795216d?q=80&w=1200&auto=format&fit=crop",
    creado_hace: "5m",
  },
  {
    id: "R10235",
    socio: "Jorge",
    tipo: "Mejoras",
    fecha: "2025-09-01T10:00:00",
    fechaLabel: "01/09/25",
    estado: "En revisión",
    telefono: "+569 8888 8888",
    direccion: "Los Robles 221, Villa Y",
    detalle:
      "Petición de cambio de escaños en la plaza por desgaste y astillas.",
    adjunto:
      "https://images.unsplash.com/photo-1460353581641-37baddab0fa2?q=80&w=1200&auto=format&fit=crop",
    creado_hace: "2h",
  },
  {
    id: "R10236",
    socio: "Fauget",
    tipo: "Actividades",
    fecha: "2025-10-01T12:20:00",
    fechaLabel: "Hoy",
    estado: "Pendiente",
    telefono: "+569 7777 7777",
    direccion: "Av. Central 123",
    detalle: "Solicitud de permiso para actividad recreativa comunitaria.",
    adjunto:
      "https://images.unsplash.com/photo-1542044801-7ea5c6e69e7a?q=80&w=1200&auto=format&fit=crop",
    creado_hace: "12m",
  },
];

const MOCK_HISTORY = [
  { id: "R10234", accion: "Pendiente",    ts: "2025-10-01T09:20:00" },
  { id: "R10235", accion: "En revisión",  ts: "2025-10-01T09:35:00" },
  { id: "R10230", accion: "Aprobado",     ts: "2025-09-30T18:12:00" },
  { id: "R10229", accion: "Rechazado",    ts: "2025-09-29T14:05:00" },
  { id: "R10228", accion: "Pendiente",    ts: "2025-09-29T08:41:00" },
];

function RequerimientosContent() {
  // Lista
  const [orden, setOrden] = useState("recientes");
  const [seleccion, setSeleccion] = useState(null);

  // Historial
  const [showHistory, setShowHistory] = useState(false);
  const [histOrder, setHistOrder] = useState("recientes"); // recientes | antiguos | aprobados | rechazados | pendientes | en_revision

  // Otros
  const [respuesta, setRespuesta] = useState("");
  const detailRef = useRef(null);
  const historyRef = useRef(null);

  const list = useMemo(() => {
    const base = [...MOCK];
    if (orden === "recientes") {
      return base.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
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
      case "recientes":
      default:
        return arr.sort(byTsDesc);
    }
  }, [histOrder]);

  const aprobar = () => seleccion && alert(`Aprobado ${seleccion.id}`);
  const rechazar = () => seleccion && alert(`Rechazado ${seleccion.id}`);
  const derivar = () => seleccion && alert(`Derivado ${seleccion.id}`);

  const scrollTo = (ref) =>
    ref?.current?.scrollIntoView({ behavior: "smooth", block: "start" });

  const onRevisar = (r) => {
    setSeleccion(r);
    scrollTo(detailRef);
  };

  const onToggleHistory = () => {
    setShowHistory((s) => !s);
    setTimeout(() => scrollTo(historyRef), 0);
  };

  const exportHistoryToPDF = () => {
    // Asegura que el historial esté visible durante la impresión
    const wasVisible = showHistory;
    if (!wasVisible) setShowHistory(true);
    setTimeout(() => {
      window.print();
      if (!wasVisible) setShowHistory(false);
    }, 50);
  };

  const fmtHour = (iso) =>
    new Date(iso).toLocaleTimeString(undefined, {
      hour: "2-digit",
      minute: "2-digit",
    });

  const fmtDay = (iso) =>
    new Date(iso).toLocaleDateString(undefined, {
      year: "2-digit",
      month: "2-digit",
      day: "2-digit",
    });

  return (
    <div className="rd">
      <header className="rd__header">
        <div className="rd__headerRow">
          <h1 className="rd__title">Requerimientos</h1>

          {/* Acciones top: Historial + Exportar PDF */}
          <div className="rd__actionsTop">
            <button
              type="button"
              className="rd__btn rd__btn--ghost"
              onClick={onToggleHistory}
              aria-expanded={showHistory}
              aria-controls="rd-history"
            >
              {showHistory ? "Ocultar historial" : "Historial"}
            </button>
            <button
              type="button"
              className="rd__btn rd__btn--ghost"
              onClick={exportHistoryToPDF}
              aria-label="Exportar historial a PDF"
            >
              Exportar PDF
            </button>
          </div>
        </div>

        <p className="rd__desc">
          En este espacio podrás <strong>revisar</strong>,{" "}
          <strong>aceptar</strong> o <strong>rechazar</strong> los
          requerimientos enviados por los vecinos, y dejar comentarios cuando
          corresponda.
        </p>
      </header>

      <section className="rd__grid">
        {/* LISTA */}
        <section className="rd__card rd__list">
          <div className="rd__listHead">
            <h2>Requerimientos pendientes</h2>
            <label className="rd__order">
              Ordenar por{" "}
              <select
                value={orden}
                onChange={(e) => setOrden(e.target.value)}
                aria-label="Ordenar lista"
              >
                <option value="recientes">Recientes</option>
                <option value="pendientes">Pendientes</option>
              </select>
            </label>
          </div>

          <div className="rd__tableWrap">
            <table className="rd__table">
              <thead>
                <tr>
                  <th>N°</th>
                  <th>Socio</th>
                  <th>Tipo</th>
                  <th>Fecha</th>
                  <th>Estado</th>
                  <th>Acción</th>
                </tr>
              </thead>
              <tbody>
                {list.map((r) => (
                  <tr key={r.id} className={seleccion?.id === r.id ? "is-sel" : ""}>
                    <td>{r.id}</td>
                    <td>{r.socio}</td>
                    <td>{r.tipo}</td>
                    <td>{r.fechaLabel ?? fmtDay(r.fecha)}</td>
                    <td>
                      <span
                        className={
                          "rd__badge " +
                          (r.estado === "Pendiente"
                            ? "is-pending"
                            : r.estado === "En revisión"
                            ? "is-review"
                            : "is-ok")
                        }
                      >
                        {r.estado}
                      </span>
                    </td>
                    <td>
                      <button
                        className="rd__btn rd__btn--ghost"
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

          <div className="rd__listFooter">
            <button className="rd__link" type="button">
              Ver todos los requerimientos
            </button>
          </div>
        </section>

        {/* DETALLE */}
        <section className="rd__card rd__detail" ref={detailRef} id="rd-detail">
          <h2>Detalle del requerimiento</h2>

          {seleccion ? (
            <div className="rd__detailGrid">
              <div className="rd__kv">
                <span className="rd__k">Solicitante</span>
                <span className="rd__v">
                  {seleccion.socio} · {seleccion.telefono}
                </span>
              </div>

              <div className="rd__kv">
                <span className="rd__k">Tipo</span>
                <span className="rd__v">{seleccion.tipo}</span>
              </div>

              <div className="rd__kv">
                <span className="rd__k">Dirección</span>
                <span className="rd__v">{seleccion.direccion}</span>
              </div>

              <div className="rd__kv">
                <span className="rd__k">Estado</span>
                <span className="rd__v">
                  <span className="rd__badge is-review">{seleccion.estado}</span>
                </span>
              </div>

              <div className="rd__block">
                <span className="rd__k">Detalle</span>
                <p className="rd__text">{seleccion.detalle}</p>
              </div>

              <div className="rd__block">
                <span className="rd__k">Adjunto</span>
                <div className="rd__img">
                  <img src={seleccion.adjunto} alt="Adjunto del requerimiento" />
                </div>
              </div>

              <div className="rd__actions">
                <button className="rd__btn rd__btn--ok" onClick={aprobar}>
                  Aprobar
                </button>
                <button className="rd__btn rd__btn--danger" onClick={rechazar}>
                  Rechazar
                </button>
                <button className="rd__btn rd__btn--warn" onClick={derivar}>
                  Derivar
                </button>
              </div>

              <div className="rd__resp">
                <label htmlFor="resp">Agregar comentario de respuesta</label>
                <textarea
                  id="resp"
                  rows={4}
                  value={respuesta}
                  onChange={(e) => setRespuesta(e.target.value)}
                  placeholder="Escribe aquí el comentario para el vecino…"
                />
              </div>
            </div>
          ) : (
            <div className="rd__empty">
              Selecciona <strong>Revisar</strong> en un requerimiento para ver el detalle.
            </div>
          )}
        </section>

        {/* HISTORIAL: solo visible cuando showHistory === true */}
        {showHistory && (
          <section
            className="rd__card rd__history is-open"
            ref={historyRef}
            id="rd-history"
          >
            <div className="rd__historyHead">
              <h2>Historial</h2>
              <div className="rd__historyActions">
                <label className="rd__order">
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
                {/* Botón para cerrar el historial */}
                <button
                  type="button"
                  className="rd__btn rd__btn--ghost"
                  onClick={() => setShowHistory(false)}
                >
                  Cerrar
                </button>
              </div>
            </div>

            <ul className="rd__timeline">
              {histList.map((h, i) => (
                <li key={i}>
                  <span className="rd__tWhen">
                    {fmtDay(h.ts)} · {fmtHour(h.ts)}
                  </span>
                  <span className="rd__tDot" />
                  <span className="rd__tTxt">
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

export default function RequerimientosDirectiva() {
  const user = { nombre: "Nombre Directiva", cargo: "Cargo" }; // reemplaza por los reales
  return (
    <PanelLateralD title="Requerimientos" user={user} showTopUser={false}>
      <RequerimientosContent />
    </PanelLateralD>
  );
}
