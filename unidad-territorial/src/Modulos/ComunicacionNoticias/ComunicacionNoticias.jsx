import { useEffect, useState } from "react";
import "./ComunicacionNoticias.css";

/* =========================
   Datos de ejemplo (8 items)
========================= */
const NEWS = [
  {
    id: 1,
    titulo: "Más verde para Mirador de Volcanes IV",
    fecha: "2025-10-04",
    imagen: "/img/principal.png",
    imagenes: ["/img/secu1.png", "/img/secu2.png"],
  resumen: "Jornada comunitaria de plantación sumó nuevas especies al parque del barrio, mejorando sombra, aire y biodiversidad. La directiva llamó a cuidar y regar los ejemplares jóvenes.",
  cuerpo: `Vecinos y vecinas del sector participaron en una nueva jornada de plantación de especies que ayudará a recuperar áreas verdes y mejorar el entorno del parque del barrio.

Durante la actividad, se incorporaron árboles y arbustos acordes al clima local, con el objetivo de sumar sombra en verano, absorber agua de lluvia y aportar belleza al espacio público. La instancia también sirvió para encontrarnos, conversar y organizar el cuidado posterior de las plantas, fortaleciendo los lazos entre residentes.

La directiva agradeció la participación y el compromiso de quienes asistieron, y anunció que se mantendrán estas jornadas de forma periódica para seguir ampliando la superficie arbolada del sector.

## ¿Por qué importa?
- **Más sombra** y mejor **calidad del aire**.
- Mayor **biodiversidad** y refugio para aves e insectos.
- Espacios que invitan al **cuidado** y al **encuentro comunitario**.

## Cómo puedes aportar
- **Protege** los árboles jóvenes: evita quebrar ramas o retirar tutores.
- **No pises el alcorque** y, si puedes, **riega** en días secos.
- **Reporta** daños o faltantes a la directiva por los canales habituales.


 💙 Pequeñas acciones, grandes cambios.`,
  },
  {
  id: 2,
  titulo: "Constructora despeja aguas estancadas",
  fecha: "2025-10-12",
  imagen: "/img/N2_despues.png",
  imagenes: ["/img/N2_durante.png", "/img/N2_antes.png"],
  resumen: "La Constructora JOMAR colaboró en la limpieza y habilitación del escurrimiento de aguas en calle Margot Loyola, mejorando el entorno del sector.",
  cuerpo: `Durante la jornada de ayer, la Constructora JOMAR brindó un importante apoyo a la comunidad del sector, colaborando en la limpieza y habilitación del escurrimiento de aguas estancadas en la calle Margot Loyola.

Gracias al uso de maquinaria retroexcavadora, fue posible liberar el agua acumulada, la cual generaba malos olores y molestias para los vecinos del sector.

A esta labor se sumó la valiosa participación de dos vecinos, quienes contribuyeron con la limpieza manual de la vía y el retiro de residuos. Gracias a este trabajo conjunto, la calle recuperó su aspecto habitual, mejorando la circulación y el bienestar de quienes transitan por el área.

## Agradecimientos
La directiva de la Junta de Vecinos expresó su agradecimiento a la Constructora JOMAR por su disposición y compromiso con el barrio, así como a los residentes que colaboraron de manera voluntaria.

 “Este tipo de acciones demuestran que cuando comunidad y empresas locales trabajan unidas, se logran grandes resultados”, señalaron desde la directiva.

 **Con esta intervención, el sector luce más limpio, ordenado y seguro para todos.**

💙 Seguimos trabajando por un mejor barrio.`
},

  {
  id: 3,
  titulo: "Vecino repara los columpios del parque",
  fecha: "2025-10-13",
  imagen: "/img/N3_columpios1.png",
  imagenes: ["/img/N3_columpios2.png"],
  resumen: "Un vecino voluntario reparó los columpios del área de juegos, devolviendo la diversión y seguridad a los niños del sector.",
  cuerpo: `Un especial agradecimiento a nuestro vecino que, de manera voluntaria, reparó los columpios del área de juegos del barrio, permitiendo que los niños y niñas vuelvan a disfrutar con seguridad y alegría de este espacio comunitario. 👧🧒

Gracias a su tiempo, compromiso y habilidades, se reforzaron las estructuras y se ajustaron las cadenas, asegurando su correcto funcionamiento. Este gesto demuestra el espíritu solidario y colaborativo que caracteriza a nuestra comunidad.

> “Pequeñas acciones hacen grandes diferencias cuando se hacen con cariño”, destacaron desde la directiva vecinal.

💙 *Seguimos construyendo juntos un barrio mejor para todos.*`
},

  {
  id: 4,
  titulo: "Celebramos el Mes del Adulto Mayor con diversas actividades comunitarias",
  fecha: "2025-10-30",
  imagen: "/img/N4_adumayor1.jpeg",
  imagenes: ["/img/N4_adumayor2.jpeg", ],
  resumen: "Nuestra comunidad participó en las actividades del Mes del Adulto Mayor, promoviendo la vida activa, la salud y la integración social.",
  cuerpo: `Durante este mes, nuestra comunidad participó activamente en las **actividades del Mes del Adulto Mayor**, organizadas por la **Dirección de Desarrollo Comunitario (DIDECO)**. Estas jornadas tuvieron como objetivo **promover la participación, el bienestar y la vida activa de las personas mayores** de Puerto Montt. 👵👴

El programa incluyó una amplia variedad de instancias, como **operativos de salud, bingos, ferias comunitarias, talleres de lectura, charlas nutricionales y encuentros recreativos**, todos pensados para fortalecer el vínculo social y reconocer el aporte invaluable de nuestros adultos mayores.

Las actividades se desarrollaron en distintos puntos de la ciudad, entre ellos la **Delegación Mirasol, la Biblioteca Municipal, la Escuela Las Camelias, el Teatro Diego Rivera y el Parque Costanera**, convocando a decenas de vecinos y vecinas que disfrutaron de momentos de aprendizaje, compañía y alegría.

> “Queremos seguir generando espacios donde nuestros adultos mayores se sientan valorados, escuchados y parte activa de la comunidad”, destacaron desde la organización.

💙 *Agradecemos la participación de todos quienes hicieron posible este mes lleno de energía, convivencia y cariño.*`
}
,
 
 {
  id: 5,
  titulo: "Presente en el desfile cívico: orgullo y representación de nuestra comunidad",
  fecha: "2025-10-10",
  imagen: "/img/N8_desfile1.png",
  imagenes: ["/img/N8_desfile2.png", "/img/N8_desfile3.png"],
  resumen: "La Junta de Vecinos Mirador de Volcanes IV participó en el desfile cívico, representando al barrio con orgullo y unidad.",
  cuerpo: `Nuestra Junta de Vecinos Mirador de Volcanes IV estuvo presente en el desfile cívico, participando con entusiasmo y compromiso en la conmemoración de nuestra identidad local. 🇨🇱

Integrantes de la directiva y vecinos del sector se unieron para representar al barrio en este importante evento, que reunió a organizaciones sociales, establecimientos educacionales y autoridades comunales.

La participación destacó por su espíritu de unidad y orgullo comunitario, reflejando el compromiso constante por mantener viva la historia, la cultura y los valores que nos unen como vecinos.

 “Ser parte de este desfile nos recuerda que juntos construimos comunidad y fortalecemos nuestro sentido de pertenencia”, expresó la directiva.

💙 *Agradecemos a todos quienes representaron con orgullo a nuestro barrio y a quienes asistieron para acompañar esta jornada de encuentro y celebración.*`
}
,
/*  { id: 6, titulo: "Taller de reciclaje domiciliario", fecha: "2025-10-05", imagen: "", resumen: "Clasificación y puntos limpios cercanos." },
  { id: 7, titulo: "Corte programado de agua (sector norte)", fecha: "2025-10-03", imagen: "", resumen: "Trabajos entre 10:00 y 14:00 hrs." },
  { id: 8, titulo: "Inscripciones: campeonato de babyfútbol", fecha: "2025-10-02", imagen: "", resumen: "Partidos en la multicancha." },*/
];

/* ===== Markdown ligerito ===== */
function renderRich(text) {
  if (!text) return null;
  const lines = text.split("\n");
  const out = [];
  let list = [];

  const flush = () => {
    if (list.length) {
      out.push(
        <ul className="r-ul" key={`ul-${out.length}`}>
          {list.map((li, i) => <li key={i}>{inline(li)}</li>)}
        </ul>
      );
      list = [];
    }
  };

  function inline(s) {
    const parts = [];
    let rest = s;
    const re = /(\*\*([^*]+)\*\*|_([^_]+)_)/;
    while (true) {
      const m = rest.match(re);
      if (!m) { parts.push(rest); break; }
      const [full, , bold, italic] = m;
      const idx = rest.indexOf(full);
      if (idx > 0) parts.push(rest.slice(0, idx));
      parts.push(bold ? <strong key={parts.length}>{bold}</strong> : <em key={parts.length}>{italic}</em>);
      rest = rest.slice(idx + full.length);
    }
    return <>{parts}</>;
  }

  lines.forEach((raw, i) => {
    const line = raw.trim();
    if (!line) { flush(); return; }
    if (line.startsWith("## ")) { flush(); out.push(<h2 className="r-h2" key={`h2-${i}`}>{line.slice(3)}</h2>); return; }
    if (line.startsWith("> "))  { flush(); out.push(<blockquote className="r-quote" key={`q-${i}`}>{inline(line.slice(2))}</blockquote>); return; }
    if (line.startsWith("- "))  { list.push(line.slice(2)); return; }
    flush(); out.push(<p className="reader-text" key={`p-${i}`}>{inline(line)}</p>);
  });

  flush();
  const fp = out.findIndex(el => el?.type === "p" || el?.props?.className?.includes("reader-text"));
  if (fp !== -1) out[fp] = <p className="reader-text lead">{out[fp].props.children}</p>;
  return out;
}

/* ===== Barra de suscripción ===== */
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
  const abrir = (n) => {
    setDetalle(n);
    setTimeout(() => window.scrollTo({ top: 0, behavior: "smooth" }), 0);
  };

  // Scroll helper hacia la grilla de noticias pequeñas
  const scrollToGrid = () => {
    const el = document.getElementById("inicio-noticias");
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const volver = () => {
    setDetalle(null);
    setTimeout(scrollToGrid, 0);
  };

  // Si el usuario entra con hash #inicio-noticias (por el navbar), scrollea a la grilla
  useEffect(() => {
    if (!detalle && window.location.hash === "#inicio-noticias") {
      scrollToGrid();
    }
  }, [detalle]);

  const [sub, setSub] = useState({ email: "", whatsapp: "" });
  const suscribir = (e) => {
    e.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(sub.email)) return alert("Ingresa un correo válido");
    alert("Suscripción registrada ✅");
    setSub({ email: "", whatsapp: "" });
  };

  /* ===== DETALLE: título grande + grid texto/fotos ===== */
  if (detalle) {
    const base = [
      ...(detalle.imagen ? [detalle.imagen] : []),
      ...(Array.isArray(detalle.imagenes) ? detalle.imagenes : []),
    ];
    const fotos = Array.from(new Set(base)).slice(0, 3);

    return (
      <div className="page noticias">
        <article className="news-detail card">
          <header className="news-detail__head">
            <h1 className="news-detail__title">{detalle.titulo}</h1>
            <p className="news-detail__sub">{detalle.resumen || detalle.fecha}</p>
          </header>

          <section className="news-detail__grid">
            {/* Cuerpo a la izquierda */}
            <div className="news-detail__body">{renderRich(detalle.cuerpo)}</div>

            {/* Fotos a la derecha */}
            {fotos.length > 0 && (
              <aside
                className={`news-detail__photosCol ${
                  fotos.length === 3 ? "is-three" : fotos.length === 2 ? "is-two" : ""
                }`}
              >
                {fotos.map((src, i) => (
                  <figure
                    key={i}
                    className={`photo ${fotos.length === 3 && i === 0 ? "photo--wide" : ""}`}
                  >
                    <img src={src} alt={`Imagen ${i + 1} de la noticia`} />
                  </figure>
                ))}
              </aside>
            )}
          </section>

          {/* ← Volver SIEMPRE al final */}
          <div className="back-row">
            <button className="back-btn" onClick={volver}>← Volver</button>
          </div>
        </article>

        <SubscribeBar sub={sub} setSub={setSub} onSubmit={suscribir} />
      </div>
    );
  }

  /* ===== LISTA: 8 noticias (4 y 4) ===== */
  return (
    <div className="page noticias">
      <header className="news-section-head" id="inicio-noticias">
        <h2 className="news-section-title">Noticias</h2>
        <p className="news-section-sub">Información útil y cercana.</p>
      </header>

      <section className="grid-cards grid-4">
        {NEWS.slice(0, 8).map((n) => (
          <article key={n.id} className="news-card">
            <div className="news-img"><img src={n.imagen} alt={n.titulo} /></div>
            <div className="news-body">
              <span className="news-tag">{n.fecha}</span>
              <h3 className="news-title">{n.titulo}</h3>
              <button className="news-more" onClick={() => abrir(n)}>
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
