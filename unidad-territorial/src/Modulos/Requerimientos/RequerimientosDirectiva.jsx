import { useMemo, useState } from "react";
import "./RequerimientosDirectiva.css";

// Datos de ejemplo (puedes reemplazar por tu fetch a API)
const PENDIENTES_MOCK = [
  { id: "R0001", socio: "Fauget", tipo: "Actividades", fecha: "Hoy", estado: "Pendiente" },
  { id: "R0002", socio: "Claudia", tipo: "Seguridad",  fecha: "Hoy (2m)", estado: "En revisión" },
  { id: "R0003", socio: "Jorge",   tipo: "Mejoras",    fecha: "01/09/25", estado: "Aprobado" },
];

const HISTORIAL_MOCK = [
  { id: "R0003", socio: "Jorge",   tipo: "Mejoras",   fecha: "01/09/25",  estado: "Aprobado" },
  { id: "R0004", socio: "María",   tipo: "Ambiente",  fecha: "28/08/25",  estado: "Rechazado" },
  { id: "R0005", socio: "Pedro",   tipo: "Seguridad", fecha: "21/08/25",  estado: "Derivado" },
];

export default function RequerimientosDirectiva() {
  // Lista principal (puedes separar en "pendientes" y "historial")
  const [pendientes, setPendientes] = useState(PENDIENTES_MOCK);
  const [historial, setHistorial] = useState(HISTORIAL_MOCK);

  // Fila seleccionada para revisar
  const [seleccion, setSeleccion] = useState(null);

  // Comentario de respuesta
  const [comentario, setComentario] = useState("");

  // Acciones
  const revisar = (req) => {
    setSeleccion({
      ...req,
      // Detalle ficticio para mostrar abajo
      detalle:
        "Solicito revisar cámaras de seguridad del pasaje. Ayer hubo un robo de bicicleta.",
      adjunto:
        "https://images.unsplash.com/photo-1485965120184-e220f721d03e?w=1200&q=80&auto=format&fit=crop",
    });
  };

  const moverAPasado = (req, nuevoEstado) => {
    // quita de pendientes
    setPendientes((p) => p.filter((x) => x.id !== req.id));
    // agrega al historial
    setHistorial((h) => [
      { ...req, estado: nuevoEstado, fecha: "Hoy" },
      ...h,
    ]);
    // limpia panel
    setSeleccion(null);
    setComentario("");
  };

  const aprobar = () => { if (seleccion) moverAPasado(seleccion, "Aprobado"); };
  const rechazar = () => { if (seleccion) moverAPasado(seleccion, "Rechazado"); };
  const derivar  = () => { if (seleccion) moverAPasado(seleccion, "Derivado"); };

  // Exportar a “PDF”: usa impresión del navegador sobre el área #admin-export
  const exportarPDF = () => {
    window.print();
  };

  // Conteos para “torta” (simple)
  const totales = useMemo(() => {
    const base = { Pendiente: 0, "En revisión": 0, Aprobado: 0, Rechazado: 0, Derivado: 0 };
    [...pendientes, ...historial].forEach((r) => {
      if (r.estado === "Pendiente") base["Pendiente"]++;
      else if (r.estado === "En revisión") base["En revisión"]++;
      else if (r.estado === "Aprobado") base["Aprobado"]++;
      else if (r.estado === "Rechazado") base["Rechazado"]++;
      else base["Derivado"]++;
    });
    return base;
  }, [pendientes, historial]);

  return (
    <div className="adm">
      {/* Sidebar propia (esta vista no usa la Navbar global) */}
      <aside className="adm__aside">
        <div className="adm__brand">
          <img src={import.meta.env.BASE_URL + "logo.png"} alt="JVVV" />
          <div className="adm__brand-name">Panel Directiva</div>
        </div>

        <nav className="adm__menu">
          <button className="adm__item">Dashboard</button>
          <button className="adm__item">Socios</button>
          <button className="adm__item">Pagos y Cuotas</button>
          <button className="adm__item">Certificados</button>
         

          <button className="adm__item adm__item--active">Solicitudes</button>

          
          <button className="adm__item">Documentos</button>
          <button className="adm__item">Noticias</button>

          <div className="adm__spacer" />
          <button className="adm__item">Cuenta</button>
          <button className="adm__item">Configuración</button>
          <button className="adm__item">Centro de Ayuda</button>
          <button className="adm__item">Cerrar sesión</button>
        </nav>
      </aside>

      {/* Contenido */}
      <main className="adm__main">
        {/* Encabezado: bienvenida + búsqueda */}
        <header className="adm__top">
          <h1>Bienvenid@ Directiva</h1>
          <div className="adm__search">
            
            <div className="adm__user">
              <span>Nombre directiva</span>
              <small>Cargo</small>
            </div>
          </div>
        </header>

        {/* Bloque principal con tabla + gráfico + botones */}
        <section id="admin-export" className="adm__card">
          <div className="adm__card-head">
            <h2>Requerimientos Pendientes</h2>
            <div className="adm__actions">
              <button className="btn btn-ghost" onClick={() => alert("Mostrando historial debajo")}>
                Historial
              </button>
              <button className="btn" onClick={exportarPDF}>Exportar</button>
            </div>
          </div>

          <div className="adm__grid2">
            {/* Tabla pendientes */}
            <div className="adm__table-wrap">
              <table className="adm__table">
                <thead>
                  <tr>
                    <th>N°</th>
                    <th>Socio</th>
                    <th>Tipo de R.</th>
                    <th>Fecha</th>
                    <th>Estado</th>
                    <th>Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {pendientes.map((r) => (
                    <tr key={r.id}>
                      <td>{r.id}</td>
                      <td>{r.socio}</td>
                      <td>{r.tipo}</td>
                      <td>{r.fecha}</td>
                      <td>
                        <span className={`pill pill--${r.estado.replace(" ", "").toLowerCase()}`}>
                          {r.estado}
                        </span>
                      </td>
                      <td>
                        <button className="btn btn-small" onClick={() => revisar(r)}>
                          Revisar
                        </button>
                      </td>
                    </tr>
                  ))}
                  {pendientes.length === 0 && (
                    <tr>
                      <td colSpan={6} style={{ textAlign: "center", opacity: .8 }}>
                        No hay pendientes
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
              <button className="linklike" onClick={() => alert("Ir a un listado completo")}>
                Ver todos los Requerimientos
              </button>
            </div>

            {/* “Gráfico” simple de conteos (texto) */}
            <div className="adm__counts">
              <h3>Resumen</h3>
              <ul>
                <li>En revisión: {totales["En revisión"]}</li>
                <li>Pendientes: {totales["Pendiente"]}</li>
                <li>Aprobados: {totales["Aprobado"]}</li>
                <li>Rechazados: {totales["Rechazado"]}</li>
                <li>Derivados: {totales["Derivado"]}</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Panel de detalle (aparece al presionar “Revisar”) */}
        <section className="adm__card">
          <div className="adm__detail">
            <div className="adm__detail-left">
              <h3>Datos de solicitante</h3>
              {seleccion ? (
                <>
                  <div className="row"><strong>Socio:</strong> {seleccion.socio}</div>
                  <div className="row"><strong>ID:</strong> {seleccion.id}</div>
                  <div className="row"><strong>Tipo:</strong> {seleccion.tipo}</div>
                  <div className="row"><strong>Fecha:</strong> {seleccion.fecha}</div>

                  <h4>Detalle del Requerimiento</h4>
                  <p className="adm__detalle-text">{seleccion.detalle}</p>

                  <h4>Archivo Adjunto</h4>
                  <div className="adm__adjunto">
                    <img src={seleccion.adjunto} alt="Adjunto" />
                  </div>
                </>
              ) : (
                <p style={{opacity:.8}}>Selecciona un requerimiento para revisarlo.</p>
              )}
            </div>

            <div className="adm__detail-right">
              <h3>Acción</h3>
              <div className="adm__botones">
                <button className="btn ok"     disabled={!seleccion} onClick={aprobar}>Aprobar</button>
                <button className="btn danger" disabled={!seleccion} onClick={rechazar}>Rechazar</button>
                <button className="btn warn"   disabled={!seleccion} onClick={derivar}>Derivar</button>
              </div>

              <label className="adm__label">Agregar comentario de respuesta</label>
              <textarea
                className="adm__textarea"
                rows={4}
                placeholder="Escribe un comentario para el vecino…"
                value={comentario}
                onChange={(e) => setComentario(e.target.value)}
                disabled={!seleccion}
              />
            </div>
          </div>
        </section>

        {/* Historial simple */}
        <section className="adm__card">
          <h2>Historial</h2>
          <table className="adm__table">
            <thead>
              <tr>
                <th>N°</th>
                <th>Socio</th>
                <th>Tipo</th>
                <th>Fecha</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {historial.map((r) => (
                <tr key={r.id}>
                  <td>{r.id}</td>
                  <td>{r.socio}</td>
                  <td>{r.tipo}</td>
                  <td>{r.fecha}</td>
                  <td>
                    <span className={`pill pill--${r.estado.replace(" ", "").toLowerCase()}`}>
                      {r.estado}
                    </span>
                  </td>
                </tr>
              ))}
              {historial.length === 0 && (
                <tr><td colSpan={5} style={{textAlign:"center", opacity:.8}}>Sin historial</td></tr>
              )}
            </tbody>
          </table>
        </section>
      </main>
    </div>
  );
}
