import { useEffect, useRef, useState, useMemo } from "react";
import DatePicker from "react-datepicker";
import { es } from "date-fns/locale";
import "react-datepicker/dist/react-datepicker.css";
import "./ComunicacionNoticias.css";


export default function ComunicacionNoticias() {
  
 
  // Noticias que rotan en el slider (izquierda)
  const [noticiasSlider, setNoticiasSlider] = useState([
    {
      id: 201,
      titulo: "Asamblea Extraordinaria",
      fecha: "2025-09-22",
      resumen:
        "Se convoca a reunión en la sede este viernes a las 19:00. Tema principal: seguridad comunitaria.",
      imagen: null, // aquí va la URL de imagen
    },
    {
      id: 202,
      titulo: "Operativo de Limpieza",
      fecha: "2025-09-18",
      resumen:
        "Este sábado a las 10:00 nos juntamos en la plaza. Llevar guantes. Habrá hidratación.",
      imagen: null,
    },
    {
      id: 203,
      titulo: "Vacunatorio Móvil",
      fecha: "2025-09-10",
      resumen:
        "Martes de 15:00 a 17:00 frente a la sede vecinal. Traer cédula. Dosis influenza y Covid.",
      imagen: null,
    },
  ]);

  // Noticias fijas (derecha)
  const [noticiasFijas] = useState([
    { id: 301, titulo: "Corte de Luz Programado", fecha: "2025-09-26", resumen: "Habrá interrupción de energía de 10:00 a 12:00 en el sector norte." },
    { id: 302, titulo: "Feria de las Pulgas", fecha: "2025-09-28", resumen: "Domingo en la plaza central desde las 9:00. Trae lo que no uses y cámbialo." },
    { id: 303, titulo: "Taller de Reciclaje", fecha: "2025-10-02", resumen: "Capacitación gratuita en la sede. Inscripciones al correo de la junta." },
    { id: 304, titulo: "Campeonato de Babyfútbol", fecha: "2025-10-05", resumen: "Equipos de vecinos se enfrentarán en la multicancha. Premios a los ganadores." },
  ]);

  /* =========================
     2) SLIDER (izquierda)
  ========================== */
  const [idx, setIdx] = useState(0);         // cuál noticia se muestra
  const [expandir, setExpandir] = useState(false); // mostrar/ocultar resumen largo
  const autoRef = useRef(null);              // guarda el setInterval
  const actual = noticiasSlider[idx] || null;

  // Cambio automático cada 5s
  useEffect(() => {
    if (!noticiasSlider.length) return;
    if (autoRef.current) clearInterval(autoRef.current);
    autoRef.current = setInterval(() => {
      setIdx((i) => (i + 1) % noticiasSlider.length);
      setExpandir(false);
    }, 5000);
    return () => clearInterval(autoRef.current);
  }, [noticiasSlider.length]);

  // Botones prev/next
  const previo = () => {
    if (!noticiasSlider.length) return;
    setIdx((i) => (i - 1 + noticiasSlider.length) % noticiasSlider.length);
    setExpandir(false);
  };
  const siguiente = () => {
    if (!noticiasSlider.length) return;
    setIdx((i) => (i + 1) % noticiasSlider.length);
    setExpandir(false);
  };

  /* ==========================================
     3) FORM “PUBLICAR” (agrega al slider) 
  =========================================== */
  const [nueva, setNueva] = useState({ titulo: "", fecha: "", resumen: "" });

  // Atajo: fecha seleccionada en objeto Date (para el DatePicker)
  const nuevaFechaDate = useMemo(
    () => (nueva.fecha ? new Date(nueva.fecha) : null),
    [nueva.fecha]
  );

  const publicar = (e) => {
    e.preventDefault();
    if (!nueva.titulo || !nueva.fecha || !nueva.resumen) return;
    // Agrego al principio del slider
    setNoticiasSlider((prev) => [{ id: Date.now(), imagen: null, ...nueva }, ...prev]);
    // Reseteo el form
    setNueva({ titulo: "", fecha: "", resumen: "" });
    // Muestro la noticia nueva
    setIdx(0);
    setExpandir(false);
    alert("Publicado (demo) en el slider.");
  };

  /* ==========================================
     4) FORM “SUSCRIPCIÓN” 
  =========================================== */
  const [sub, setSub] = useState({ email: "", whatsapp: "" });

  const suscribir = (e) => {
    e.preventDefault();
    if (!sub.email) return;
    alert("Suscripción registrada (demo).");
    setSub({ email: "", whatsapp: "" });
  };

  /* ==========================================
     5) “MÁS NOTICIAS” (derecha) expandibles
  =========================================== */
  const [idExpandida, setIdExpandida] = useState(null);

  return (
    <div className="page comu">

      {/* 📰 Sección principal: slider + más noticias */}
      <section id="noticias" className="card comu-hero">
        {/* IZQUIERDA: Slider */}
        <div className="comu-hero-left">
          {actual ? (
            <>
              {/* Imagen de la noticia (si no hay, un placeholder) */}
              <div className="comu-slide-img">
                {/* Si luego tienen imagen real: <img src={actual.imagen} alt={actual.titulo} /> */}
                <div className="comu-img-placeholder">Espacio para imagen</div>
              </div>

              {/* Texto de la noticia actual */}
              <div className="comu-slide-info">
                <div className="comu-slide-fecha">{actual.fecha}</div>
                <h2 className="comu-slide-title">{actual.titulo}</h2>

                {!expandir ? (
                  <button className="btn btn-ghost" onClick={() => setExpandir(true)}>
                    Mostrar más
                  </button>
                ) : (
                  <>
                    <p className="comu-slide-resumen">{actual.resumen}</p>
                    <button className="btn btn-ghost" onClick={() => setExpandir(false)}>
                      Ocultar
                    </button>
                  </>
                )}
              </div>

              {/* Flechas del slider */}
              <button className="comu-arrow left" onClick={previo} aria-label="Previo">
                ‹
              </button>
              <button className="comu-arrow right" onClick={siguiente} aria-label="Siguiente">
                ›
              </button>

              {/* Puntitos para saltar entre noticias */}
              <div className="comu-dots">
                {noticiasSlider.map((n, i) => (
                  <button
                    key={n.id}
                    className={`comu-dot ${i === idx ? "activa" : ""}`}
                    onClick={() => {
                      setIdx(i);
                      setExpandir(false);
                    }}
                    aria-label={`Ir a ${i + 1}`}
                  />
                ))}
              </div>
            </>
          ) : (
            <div className="comu-slide-vacio">No hay noticias para mostrar.</div>
          )}
        </div>

        {/* DERECHA: Más noticias (expandibles) */}
        <aside className="comu-hero-right">
          <h3 className="comu-mini-title">Más noticias</h3>
          <ul className="comu-mini-list">
            {noticiasFijas.map((n) => (
              <li
                key={n.id}
                className={`comu-mini-item ${idExpandida === n.id ? "abierta" : ""}`}
                onClick={() => setIdExpandida(idExpandida === n.id ? null : n.id)}
              >
                <div className="comu-mini-dot" />
                <div className="comu-mini-texts">
                  <div className="comu-mini-row">
                    <div className="comu-mini-t">{n.titulo}</div>
                    <div className="comu-mini-f">{n.fecha}</div>
                  </div>
                  {idExpandida === n.id && (
                    <p className="comu-mini-resumen">{n.resumen}</p>
                  )}
                </div>
                <span className="comu-mini-caret">
                  {idExpandida === n.id ? "▾" : "▸"}
                </span>
              </li>
            ))}
          </ul>
        </aside>
      </section>

      {/* ⬇️ Parte de abajo: Publicar + Suscripción */}
      <section className="comu-grid-2col">
        {/* Publicar noticia (agrega al slider) */}
        <form id="publicar" className="card form comu-card" onSubmit={publicar}>
          <h3 className="comu-titulo">Publicar noticia / aviso</h3>

          <div className="group">
            <label>Título</label>
            <input
              name="titulo"
              value={nueva.titulo}
              onChange={(e) => setNueva((v) => ({ ...v, titulo: e.target.value }))}
              required
            />
          </div>

          <div className="group">
            <label>Fecha</label>
            {/* Calendario para elegir fecha → guardamos "YYYY-MM-DD" */}
            <DatePicker
              selected={nuevaFechaDate}
              onChange={(d) =>
                setNueva((v) => ({ ...v, fecha: d ? d.toISOString().slice(0, 10) : "" }))
              }
              placeholderText="Selecciona fecha"
              dateFormat="yyyy-MM-dd"
              locale={es}
              className="input-fecha"
              wrapperClassName="picker-wrap"
              // minDate={new Date()} // si quieren bloquear fechas pasadas
            />
          </div>

          <div className="group">
            <label>Resumen</label>
            <textarea
              rows={3}
              name="resumen"
              value={nueva.resumen}
              onChange={(e) => setNueva((v) => ({ ...v, resumen: e.target.value }))}
              required
            />
          </div>

          <button className="btn">Publicar</button>
          <p className="legal">* En producción, solo la Directiva podrá publicar.</p>
        </form>

        {/* Suscripción a avisos  */}
        <form id="suscripcion" className="card form comu-card" onSubmit={suscribir}>
          <h3 className="comu-titulo">Suscripción a notificaciones</h3>

          <div className="group">
            <label>Correo electrónico</label>
            <input
              type="email"
              name="email"
              value={sub.email}
              onChange={(e) => setSub((s) => ({ ...s, email: e.target.value }))}
              placeholder="tucorreo@ejemplo.cl"
              required
            />
          </div>

          <div className="group">
            <label>WhatsApp (opcional)</label>
            <input
              name="whatsapp"
              value={sub.whatsapp}
              onChange={(e) => setSub((s) => ({ ...s, whatsapp: e.target.value }))}
              placeholder="+56 9 1234 5678"
            />
          </div>

          <button className="btn">Suscribirme</button>
          <p className="legal">Recibirás avisos y noticias oficiales.</p>
        </form>
      </section>
    </div>
  );
}
