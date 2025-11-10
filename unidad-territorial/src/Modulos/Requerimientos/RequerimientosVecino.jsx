// src/Modulos/Requerimientos/RequerimientosVecino.jsx
import { useState, useEffect, useRef } from "react";
import "./RequerimientosVecino.css";

const API_BASE = (
  import.meta.env.VITE_API_URL ||
  import.meta.env.VITE_API_BASE ||
  "http://localhost:4010"
).replace(/\/+$/, "");

function SuccessPanel({ data, onClose }) {
  const { folio, tipo, direccion, fecha, adjuntoURL } = data || {};
  const fechaFmt = fecha
    ? new Date(fecha).toLocaleString(undefined, {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "-";

  return (
    <section className="card success">
      <div className="success__icon" aria-hidden>✅</div>
      <h2 className="success__title">Requerimiento enviado correctamente</h2>
      <p className="success__desc">
        Hemos recibido tu requerimiento. <br />
        <strong>Plazo de respuesta:</strong> dentro de 48–72 horas hábiles.
      </p>

      <div className="success__info">
        <div><span className="tag">Folio</span> <strong>{folio || "—"}</strong></div>
        <div><span className="tag">Tipo</span> {tipo || "—"}</div>
        <div><span className="tag">Dirección</span> {direccion || "—"}</div>
        <div><span className="tag">Fecha</span> {fechaFmt}</div>
        {adjuntoURL && (
          <div>
            <span className="tag">Adjunto</span>{" "}
            <a href={adjuntoURL} target="_blank" rel="noreferrer">Ver imagen</a>
          </div>
        )}
      </div>

      <div className="success__actions">
        <button type="button" className="btn" onClick={onClose}>Cerrar</button>
      </div>
    </section>
  );
}
// ... (Aquí termina el código de SuccessPanel)
function leerUsuarioSesion() {
  try {
    const raw = localStorage.getItem("usuario") || sessionStorage.getItem("usuario");
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}
// --- AÑADE ESTA FUNCIÓN DE API ---
async function obtenerDatosSocioPorId(idUsuario) {
  const url = `${API_BASE}/api/socios/detalles/${idUsuario}`; 
  try {
    const response = await fetch(url, { credentials: "include" });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Error al cargar datos del socio');
    }
    const data = await response.json();
    return data.socio; // Devuelve el objeto { Nombres, RUT, Telefono, ... }
  } catch (error) {
    console.error("Fallo al obtener datos del socio:", error);
    throw error;
  }
}
// --- FIN DE LA FUNCIÓN ---


export default function RequerimientosVecino() {
  const [sessionUser, setSessionUser] = useState(null);
  const [form, setForm] = useState({
    socioNombre: "",
    rut: "",
    telefono: "",   // ✅ nuevo campo
    tipo: "",
    direccion: "",
    comentarios: "",
    imagen: null,
  });

  const [fileName, setFileName] = useState("");
  const [previewURL, setPreviewURL] = useState(null);
  const [sending, setSending] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successData, setSuccessData] = useState(null);
  const titleRef = useRef(null);

  const readLocalUser = () => {
    const keys = ["user", "usuario", "currentUser"];
    for (const k of keys) {
      try {
        const raw = localStorage.getItem(k);
        if (!raw) continue;
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === "object") return parsed;
      } catch {}
    }
    return null;
  };

// --- REEMPLAZA TU USEEFFECT COMPLETO POR ESTE ---
  useEffect(() => {
    // 1. Lee la sesión (igual que en Perfil)
    const usuarioGuardado = leerUsuarioSesion();
    
    // (Buscamos en el objeto 'usuario' anidado, o en la raíz)
    const usuarioData = usuarioGuardado?.usuario || usuarioGuardado;
    setSessionUser(usuarioData);

    // 2. Buscamos el ID (igual que en Perfil)
    const idParaBuscar = usuarioData ? (usuarioData.ID_Usuario || usuarioData.id) : null;

    // 3. Si se encontró un ID, llamamos a la API (igual que en Perfil)
    if (idParaBuscar) { 
      
      obtenerDatosSocioPorId(idParaBuscar)
        .then(data => {
          // ¡ÉXITO! 'data' es el objeto COMPLETO de la tabla SOCIOS
          
          // 4. ¡AQUÍ ESTÁ EL ARREGLO!
          // Rellenamos el formulario con los datos correctos
          setForm((s) => ({
            ...s, // Mantenemos los campos vacíos (direccion, tipo, etc.)
            socioNombre: data.Nombres ? `${data.Nombres} ${data.Apellidos}` : (usuarioData.nombre || ''),
            rut: data.RUT || '',
            telefono: data.Telefono || ''
          }));
        })
        .catch(err => {
          // Si falla, usamos el plan B (los datos incompletos del login)
          console.warn("No se pudo autocompletar desde BDD, usando datos de sesión:", err.message);
          setForm((s) => ({
            ...s,
            socioNombre: usuarioData.nombre || '',
            rut: usuarioData.rut || '',
            telefono: usuarioData.telefono || ''
          }));
        });

    } else {
      // No hay usuario en sesión
      console.log("No hay usuario en sesión para autocompletar.");
    }
  }, []); // El array vacío [] asegura que esto se ejecute solo una vez
  // --- FIN DEL REEMPLAZO ---

  useEffect(() => () => previewURL && URL.revokeObjectURL(previewURL), [previewURL]);
  useEffect(() => { if (titleRef.current) titleRef.current.focus(); window.scrollTo({ top: 0, behavior: "smooth" }); }, [successData]);

  const onChange = (e) => {
    const { name, value, files } = e.target;
    if (name === "imagen") {
      const f = files?.[0] ?? null;
      setForm((s) => ({ ...s, imagen: f }));
      if (previewURL) URL.revokeObjectURL(previewURL);
      if (f) {
        setFileName(f.name);
        setPreviewURL(f.type?.startsWith("image/") ? URL.createObjectURL(f) : null);
      } else {
        setFileName("");
        setPreviewURL(null);
      }
      return;
    }
    setForm((s) => ({ ...s, [name]: value }));
  };

  const puedeEnviar =
    form.tipo.trim() && form.direccion.trim() && form.socioNombre.trim() && form.rut.trim() && form.telefono.trim(); // ✅ ahora teléfono requerido

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!puedeEnviar || sending) return;
    setSending(true);
    setErrorMsg("");
    setSuccessData(null);

    try {
      const fd = new FormData();
      fd.append("socioNombre", form.socioNombre.trim());
      fd.append("rut_socio", form.rut.trim());
      fd.append("telefono", form.telefono.trim()); // ✅ se envía al backend
      fd.append("tipo", form.tipo.trim());
      fd.append("direccion", form.direccion.trim());
      fd.append("comentarios", form.comentarios || "");

      if (sessionUser?.email || sessionUser?.correo)
        fd.append("email", sessionUser.email || sessionUser.correo);
      if (form.imagen) fd.append("imagen", form.imagen);

      const resp = await fetch(`${API_BASE}/api/requerimientos`, {
        method: "POST",
        body: fd,
        credentials: "include",
      });

      const data = await resp.json().catch(() => ({}));
      if (!resp.ok || data?.ok === false)
        throw new Error(data?.error || "No se pudo enviar el requerimiento.");

      const folio = data?.data?.FOLIO || data?.data?.Folio || "—";
      const adjuntoURL = data?.data?.Adjunto_URL || null;
      const ahoraISO = new Date().toISOString();

      setSuccessData({ folio, tipo: form.tipo, direccion: form.direccion, fecha: ahoraISO, adjuntoURL });
      setForm({
        socioNombre: form.socioNombre,
        rut: form.rut,
        telefono: form.telefono, // se mantiene
        tipo: "",
        direccion: "",
        comentarios: "",
        imagen: null,
      });
      setFileName("");
      if (previewURL) URL.revokeObjectURL(previewURL);
      setPreviewURL(null);
    } catch (err) {
      setErrorMsg(err.message || "Error inesperado.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="rv">
      <div className="rv__card">
        <h1 className="rv__title" tabIndex={-1} ref={titleRef}>Bienvenido</h1>
        {errorMsg && <div className="rv__alert rv__alert--error">{errorMsg}</div>}

        {successData ? (
          <SuccessPanel data={successData} onClose={() => setSuccessData(null)} />
        ) : (
          <>
{/* --- REEMPLAZA ESTE BLOQUE COMPLETO --- */}
            
            <p className="rv__intro-text">
              Este es tu canal directo para informar a la directiva sobre problemas 
              en el barrio. Usa este formulario para enviar un <b>aviso sobre el entorno</b>, 
              como un foco quemado, basura acumulada, vidrios en la calle o problemas 
              con sumideros. Tu reporte nos ayuda a gestionar una solución.
            </p>
            
            <ul className="rv__instructions-list">
              <li> Tus datos de <strong>Nombre, RUT</strong> y <strong>Teléfono</strong> se cargan automáticamente desde tu sesión.</li> 
              <li> Elige el <strong>Tipo</strong> que mejor describa el problema (Seguridad, Limpieza, etc.). </li> 
              <li> Indica la <strong>Dirección o ubicación</strong> lo más precisa posible (¡este campo es muy importante!).</li>
              <li> Adjunta una <strong>Imagen</strong> si ayuda a explicar el caso o entender el problema (opcional). </li>
              <li> Usa <strong>Comentarios</strong> adicionales para cualquier otro detalle (opcional).</li> 
            </ul>
            
            <p className="rv__community-message">
              Tu aviso es el primer paso. Gracias por tu participación. 
              <strong> ¡Unidos mejoramos nuestro entorno!</strong>
            </p>
             
            <form className="rv__form" onSubmit={onSubmit} noValidate>

                <div className="rv__field">
                  <label htmlFor="socioNombre">Nombre</label>
                  <input 
                    id="socioNombre" 
                    name="socioNombre" 
                    value={form.socioNombre} 
                    onChange={onChange} 
                    required
                    disabled={sending} 
                    readOnly
                  />
                </div>
                <div className="rv__field">
                  <label htmlFor="rut">RUT</label>
                  <input 
                    id="rut" 
                    name="rut" 
                    value={form.rut} 
                    onChange={onChange} 
                    required disabled={sending} 
                    readOnly
                  />
                </div>
    
                <div className="rv__field rv__colspan-2">
                  <label htmlFor="telefono">Teléfono</label>
                  <input
                    id="telefono"
                    name="telefono"
                    placeholder="+56912345678"
                    value={form.telefono}
                    onChange={onChange}
                    required
                    disabled={sending}
                    readOnly
                  />
                </div>
                <div className="rv__field">
                  <label htmlFor="tipo">Tipo de requerimiento</label>
                  <div className="rv__selectWrap">
                    <select id="tipo" name="tipo" value={form.tipo} onChange={onChange} required disabled={sending}>
                      <option value="">Seleccione…</option>
                      <option value="Seguridad">Seguridad</option>
                      <option value="Limpieza">Limpieza</option>
                      <option value="Iluminación">Iluminación</option>
                      <option value="Mejoras">Mejoras</option>
                      <option value="Eventos">Eventos</option>
                      <option value="Otro">Otro</option>
                    </select>
                    <span className="rv__selectIcon">▾</span>
                  </div>
                </div>

                <div className="rv__field">
                  <label htmlFor="direccion">Dirección o ubicación aproximada</label>
                  <input id="direccion" 
                  name="direccion" 
                  value={form.direccion} 
                  onChange={onChange} 
                  required 
                  disabled={sending} />
                </div>
      


                <div className="rv__field">
                  <label>Imagen (Opcional)</label>
                  <label className="rv__file">
                    <input 
                      type="file" 
                      name="imagen" 
                      accept="image/*" 
                      onChange={onChange} 
                      disabled={sending} 
                    />
                    <span className="rv__clip">📎</span>
                    <span className="rv__fname">{fileName || "Adjuntar imagen..."}</span>
                  </label>
                  {previewURL && <div className="rv__preview"><img src={previewURL} alt="Adjunto" /></div>}
                </div>
                <div className="rv__field">
                  <label htmlFor="comentarios">Comentarios adicionales</label>
                  <textarea 
                    id="comentarios" 
                    name="comentarios" 
                    rows={5} 
                    value={form.comentarios} 
                    onChange={onChange} 
                    disabled={sending} 
                    placeholder="Ej: El foco del poste está parpadeando..."
                  />
                </div>
      

              <div className="rv__actions rv__colspan-2">
                <button className="rv__btn" disabled={!puedeEnviar || sending}>
                  {sending ? "ENVIANDO…" : "INGRESAR"}
                </button>
              </div>
            </form>
          </>
        )}

        <div className="rv__footerBar">
          <span>Contáctanos: </span>
          <a href="mailto:juntadevecinosmiradordevolcanescuatro@gmail.com" className="rv__mail">
            juntadevecinosmiradordevolcanescuatro@gmail.com
          </a>
        </div>
      </div>
    </div>
  );
}
