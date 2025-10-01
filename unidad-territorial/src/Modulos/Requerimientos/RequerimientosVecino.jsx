import { useState } from "react";
import "./RequerimientosVecino.css";

export default function RequerimientosVecino() {
  // estado del formulario
  const [form, setForm] = useState({
    tipo: "",
    direccion: "",
    comentarios: "",
    imagen: null,
  });

  // para mostrar nombre/preview de imagen
  const [fileName, setFileName] = useState("");
  const [previewURL, setPreviewURL] = useState(null);

  // cambio de inputs
  const onChange = (e) => {
    const { name, value, files } = e.target;

    if (name === "imagen") {
      const f = files?.[0] ?? null;
      setForm((s) => ({ ...s, imagen: f }));
      if (f) {
        setFileName(f.name);
        if (f.type?.startsWith("image/")) {
          setPreviewURL(URL.createObjectURL(f));
        } else {
          setPreviewURL(null);
        }
      } else {
        setFileName("");
        setPreviewURL(null);
      }
      return;
    }

    setForm((s) => ({ ...s, [name]: value }));
  };

  const puedeEnviar =
    form.tipo.trim() && form.direccion.trim(); // lo mínimo para habilitar

  const onSubmit = (e) => {
    e.preventDefault();
    if (!puedeEnviar) return;

   

    alert("Requerimiento enviado. ¡Gracias por participar!");
    // reset básico
    setForm({ tipo: "", direccion: "", comentarios: "", imagen: null });
    setFileName("");
    setPreviewURL(null);
  };

  return (
    <div className="rv">
      <div className="rv__card">
        <h1 className="rv__title">Bienvenido</h1>

        {/* 🔹 Descripción para orientar al vecino */}
        <p
          style={{
            margin: "0 .75rem 1rem",
            textAlign: "center",
            color: "#475569",
            lineHeight: 1.5,
          }}
        >
          Usa este formulario para ingresar tus solicitudes o requerimientos a la
          Junta de Vecinos. Indica el tipo de requerimiento, la dirección
          exacta y, si lo deseas, adjunta una imagen que ayude a entender la situación.
          En Comentarios puedes agregar detalles importantes.
        </p>

        {/* (Opcional) mini instrucciones en bullets */}
        <ul
          style={{
            margin: "0 1.25rem 1rem",
            paddingLeft: "1.1rem",
            color: "#64748b",
            fontSize: ".95rem",
            lineHeight: 1.5,
          }}
        >
          <li>Elige el <strong>tipo</strong> que mejor describa tu solicitud.</li>
          <li>Escribe la <strong>dirección</strong> lo más precisa posible.</li>
          <li>Adjunta una <strong>imagen</strong> si ayuda a explicar el caso (opcional).</li>
          <li>En <strong>Comentarios</strong> agrega información útil (horarios, antecedentes, etc.).</li>
        </ul>

        <form className="rv__form" onSubmit={onSubmit} noValidate>
          {/* fila 1: tipo + dirección */}
          <div className="rv__row">
            <div className="rv__field">
              <label htmlFor="tipo">Tipo de requerimiento</label>
              <div className="rv__selectWrap">
                <select
                  id="tipo"
                  name="tipo"
                  value={form.tipo}
                  onChange={onChange}
                  required
                >
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
              <label htmlFor="direccion">Dirección</label>
              <input
                id="direccion"
                name="direccion"
                placeholder="Calle y número, villa, etc."
                value={form.direccion}
                onChange={onChange}
                required
              />
            </div>
          </div>

          {/* fila 2: imagen + comentarios */}
          <div className="rv__row">
            <div className="rv__field">
              <label>Imagen</label>
              <label className="rv__file">
                <input
                  type="file"
                  name="imagen"
                  accept="image/*"
                  onChange={onChange}
                />
                <span className="rv__clip">📎</span>
                <span className="rv__fname">
                  {fileName || "Adjuntar imagen (opcional)"}
                </span>
              </label>

              {previewURL && (
                <div className="rv__preview">
                  <img src={previewURL} alt="Adjunto" />
                </div>
              )}
            </div>

            <div className="rv__field">
              <label htmlFor="comentarios">Comentarios adicionales</label>
              <textarea
                id="comentarios"
                name="comentarios"
                rows={5}
                placeholder="Escribe detalles que nos ayuden a gestionar tu requerimiento…"
                value={form.comentarios}
                onChange={onChange}
              />
            </div>
          </div>

          <div className="rv__actions">
            <button className="rv__btn" disabled={!puedeEnviar}>
              INGRESAR
            </button>
          </div>
        </form>

        {/* 🔹 Nota final para expectativas */}
        <p
          style={{
            margin: "0 1.25rem 1rem",
            textAlign: "center",
            color: "#475569",
            fontSize: ".92rem",
          }}
        >
          <em>
            Una vez enviada, tu solicitud será revisada por la Directiva. Si necesitamos más
            información, te contactaremos por los datos registrados en tu cuenta.
          </em>
        </p>

        {/* franja inferior tipo “contacto” */}
        <div className="rv__footerBar">
          <span>Contáctanos a través de correo</span>
          <span className="rv__dot" />
          <a
            href="mailto:juntadevecinosmiradordevolcanescuatro@gmail.com"
            className="rv__mail"
          >
            juntadevecinosmiradordevolcanescuatro@gmail.com
          </a>
        </div>
      </div>
    </div>
  );
}
