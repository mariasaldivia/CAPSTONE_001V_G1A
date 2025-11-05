import { useEffect, useState } from "react";
import "./ComunicacionNoticias.css";
import { NoticiasAPI } from "../../api/noticias";

/* Respaldo por si la API falla */
const FALLBACK_NEWS = [];

/* Helper: absolutizar URLs de imágenes */
const API_BASE = import.meta.env?.VITE_API_BASE || "http://localhost:4010";
const toAbs = (url) => {
  if (!url) return url;
  if (/^https?:\/\//i.test(url)) return url;
  if (url.startsWith("/")) return `${API_BASE}${url}`;
  return `${API_BASE}/${url}`;
};

function SubscribeBar({ sub, setSub, onSubmit }) {
  return (
    <form className="subscribe-bar mt-before-footer" onSubmit={onSubmit}>
      <div className="sb-text">
        <strong>Suscríbete a nuestro boletín</strong>
        <span>Recibe noticias y avisos oficiales en tu correo o WhatsApp.</span>
      </div>
      <input
        type="email"
        placeholder="tucorreo@ejemplo.cl"
        value={sub.email}
        onChange={(e) => setSub((s) => ({ ...s, email: e.target.value }))}
        required
      />
      <input
        placeholder="WhatsApp (opcional)"
        value={sub.whatsapp}
        onChange={(e) => setSub((s) => ({ ...s, whatsapp: e.target.value }))}
      />
      <button className="sb-btn">Suscribirme</button>
    </form>
  );
}

export default function ComunicacionNoticias() {
  const [detalle, setDetalle] = useState(null);
  const [noticias, setNoticias] = useState(FALLBACK_NEWS);
  const [sub, setSub] = useState({ email: "", whatsapp: "" });

  const scrollToGrid = () => {
    const el = document.getElementById("inicio-noticias");
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const volver = () => {
    setDetalle(null);
    setTimeout(scrollToGrid, 0);
  };

  // Cargar noticias PUBLICADAS desde backend
  useEffect(() => {
    (async () => {
      try {
        const data = await (NoticiasAPI.listarPublicadas
          ? NoticiasAPI.listarPublicadas()
          : NoticiasAPI.listarHistorial());

        const list = (Array.isArray(data) ? data : [])
          .filter((n) => (n.estado ?? 1) === 1) // 1 = PUBLICADA
          .map((n) => {
            console.log('Tipo recibido de la API:', `'${n.tipo}'`);
            const imagenPrincipal =
              toAbs(n.imagen_principal_url) ||
              toAbs(n.imagen_principal) ||
              "/img/principal.png";

            // Secundarias desde columnas (opcionales)
            const secundarias = [toAbs(n.imagen_sec_1), toAbs(n.imagen_sec_2)]
              .filter(Boolean);

            const cuerpoHtml = (n.cuerpo_html || n.cuerpo || n.contenido || "").toString();

            const tipoLimpio = (n.tipo || 'Junta de vecino').trim();

            return {
              id: n.id,
              titulo: n.titulo || "",
              subtitulo: n.subtitulo || "",
              fecha: (n.publish_at || n.created_at || "").slice(0, 10),
              imagen: imagenPrincipal,     // principal
              imagenes: secundarias,       // 0..2 secundarias
              resumen: n.resumen || "",
              cuerpo_html: cuerpoHtml,
              tipo: tipoLimpio,
            };
          });

        if (list.length) setNoticias(list);
      } catch (e) {
        console.warn("No se pudieron cargar noticias públicas:", e?.message || e);
      }
    })();
  }, []);

  useEffect(() => {
    if (!detalle && window.location.hash === "#inicio-noticias") {
      const el = document.getElementById("inicio-noticias");
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [detalle]);

  const suscribir = (e) => {
    e.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(sub.email)) return alert("Ingresa un correo válido");
    alert("Suscripción registrada ✅");
    setSub({ email: "", whatsapp: "" });
  };

  /* ===== DETALLE ===== */
  if (detalle) {
    // Columna derecha: principal + secundarias (sin duplicados, sin relleno)
    const fotosDerecha = Array.from(
      new Set(
        [
          detalle.imagen, // principal primero
          ...(Array.isArray(detalle.imagenes) ? detalle.imagenes : []), // luego secundarias
        ].filter(Boolean)
      )
    ).slice(0, 3);

    return (
      <div className="page noticias">
        <article 
          className={`news-detail card ${
          detalle.tipo === 'Municipalidad'
            ? 'news-card--muni'
            : 'news-card--jv'
          }`}
        >
          <header className="news-detail__head">
            <h1 className="news-detail__title">{detalle.titulo}</h1>
            <p className="news-detail__sub">{detalle.subtitulo || detalle.fecha}</p>
          </header>

          <section className="news-detail__grid">
            {/* Cuerpo a la izquierda */}
            <div className="news-detail__body">
              {detalle.cuerpo_html ? (
                <div dangerouslySetInnerHTML={{ __html: detalle.cuerpo_html }} />
              ) : null}
            </div>

            {/* Imágenes a la derecha: 1..3 sin repeticiones ni rellenos */}
            {fotosDerecha.length > 0 && (
              <aside
                className={`news-detail__photosCol ${
                  fotosDerecha.length === 3
                    ? "is-three"
                    : fotosDerecha.length === 2
                    ? "is-two"
                    : ""
                }`}
              >
                {fotosDerecha.map((src, i) => (
                  <figure
                    key={i}
                    className={`photo ${fotosDerecha.length === 3 && i === 0 ? "photo--wide" : ""}`}
                  >
                    <img src={src} alt={`Imagen ${i + 1} de la noticia`} />
                  </figure>
                ))}
              </aside>
            )}
          </section>

          <div className="back-row">
            <button className="back-btn" onClick={volver}>← Volver</button>
          </div>
        </article>

        <SubscribeBar sub={sub} setSub={setSub} onSubmit={suscribir} />
      </div>
    );
  }

  /* ===== LISTA ===== */
  return (
    <div className="page noticias">
      <header className="news-section-head" id="inicio-noticias">
        <h2 className="news-section-title">Noticias</h2>
        <p className="news-section-sub">Información útil y cercana.</p>
      </header>

      <section className="grid-cards grid-4">
        {noticias.slice(0, 8).map((n) => (
          <article 
            key={n.id} 
            className={`news-card ${
              n.tipo === 'Municipalidad' 
                ? 'news-card--muni' 
                : 'news-card--jv'
            }`} 
          >
            <div className="news-img">
              <img src={n.imagen} alt={n.titulo} />
            </div>
            <div className="news-body">
              <span className="news-tag">{n.fecha}</span>
              <h3 className="news-title">{n.titulo}</h3>
              <button className="news-more" onClick={() => setDetalle(n)}>
                Ver más <span className="arrow-cta">→</span>
              </button>
            </div>
          </article>
        ))}
      </section>

      <SubscribeBar sub={sub} setSub={setSub} onSubmit={suscribir} />
    </div>
  );
}
