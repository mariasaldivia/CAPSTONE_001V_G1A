import { useState } from "react";
import "./Certificados.css";

/* Función que acomoda el RUT con puntos y guion */
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

/* Función que valida que el RUT sea correcto (módulo 11) */
function validarRut(rutConFormato) {
  if (!rutConFormato) return false;
  const limpio = rutConFormato.replace(/\./g, "").toUpperCase();
  if (!limpio.includes("-")) return false;

  const [cuerpo, dv] = limpio.split("-");
  if (!cuerpo || !dv) return false;

  let suma = 0, mult = 2;
  for (let i = cuerpo.length - 1; i >= 0; i--) {
    suma += parseInt(cuerpo[i], 10) * mult;
    mult = mult === 7 ? 2 : mult + 1;
  }
  const resto = 11 - (suma % 11);
  const dvEsp = resto === 11 ? "0" : resto === 10 ? "K" : String(resto);
  return dv === dvEsp;
}

/* Componente principal de la página de Certificados */
export default function Certificados() {
  // Guardar lo que escribe el usuario
  const [form, setForm] = useState({
    nombre: "",
    rut: "",
    direccion: "",
    email: "",
    comprobante: null,
  });

  // Guardar nombre del archivo
  const [fileName, setFileName] = useState("");
  // Guardar preview si es imagen
  const [filePreview, setFilePreview] = useState(null);
  // Saber si el RUT es válido
  const [rutValido, setRutValido] = useState(true);

  // Maneja cambios en los inputs
  const onChange = (e) => {
    const { name, value, files } = e.target;

    if (name === "comprobante") {
      const f = files?.[0];
      setForm((s) => ({ ...s, comprobante: f || null }));
      if (f) {
        setFileName(f.name);
        if (f.type.startsWith("image/")) {
          setFilePreview(URL.createObjectURL(f)); // miniatura para imágenes
        } else {
          setFilePreview(null); // PDFs no usan img preview
        }
      } else {
        setFileName("");
        setFilePreview(null);
      }
      return;
    }

    if (name === "rut") {
      const formateado = formatearRut(value);
      setForm((s) => ({ ...s, rut: formateado }));
      setRutValido(validarRut(formateado));
      return;
    }

    setForm((s) => ({ ...s, [name]: value }));
  };

  // Condición para habilitar el botón
  const puedeEnviar =
    form.nombre.trim() &&
    form.rut.trim() &&
    form.direccion.trim() &&
    form.email.trim() &&
    rutValido &&
    form.comprobante;

  // Acción al enviar el formulario
  const onSubmit = (e) => {
    e.preventDefault();
    if (!validarRut(form.rut)) {
      setRutValido(false);
      return alert("El RUT ingresado no es válido.");
    }
    if (!form.comprobante) {
      return alert("Debes adjuntar el comprobante de pago.");
    }
    alert("Solicitud enviada correctamente ✨");
  };

  // Detecta si el comprobante es PDF
  const esPDF =
    form.comprobante &&
    (form.comprobante.type === "application/pdf" ||
      fileName.toLowerCase().endsWith(".pdf"));

  // URL temporal del archivo para <embed> (PDF)
  const pdfURL = esPDF ? URL.createObjectURL(form.comprobante) : null;

  return (
    <div className="page">
      {/* Menú superior */}
      <header className="topbar">
        <div className="brand"><span>JVVV</span></div>
        <nav className="nav">
          <a className="link" href="#inicio">Inicio</a>
          <a className="link" href="#sobre">Sobre Nosotros</a>
          <a className="link" href="#noticias">Noticias</a>
          <a className="link" href="#login">Inicio sesión</a>
          <a className="pill" href="#socio">Hazte socio</a>
        </nav>
      </header>

      {/* Texto de introducción */}
      <section className="intro">
        <h1>Para solicitar tu certificado de residencia completa los siguientes datos.</h1>
        <div className="precio">Valor $XXXX</div>
        <p className="nota">Recuerda que debes hacer tu depósito previo a realizar la solicitud.</p>
      </section>

      {/* Contenido principal: formulario + panel lateral */}
      <main className="grid">
        {/* Formulario */}
        <form className="card form" onSubmit={onSubmit}>
          <div className="group">
            <label>Nombre Completo</label>
            <input name="nombre" value={form.nombre} onChange={onChange} required />
          </div>

          <div className="group">
            <label>RUT</label>
            <input
              name="rut"
              placeholder="12.345.678-5"
              value={form.rut}
              onChange={onChange}
              className={!rutValido && form.rut ? "input-error" : ""}
              required
            />
            {!rutValido && form.rut && (
              <small style={{ color: "#ffb4b4" }}>RUT inválido</small>
            )}
          </div>

          <div className="group">
            <label>Dirección</label>
            <input name="direccion" value={form.direccion} onChange={onChange} required />
          </div>

          <div className="group">
            <label>Correo Electrónico</label>
            <input type="email" name="email" value={form.email} onChange={onChange} required />
          </div>

          <div className="group">
            <label>Adjunte comprobante de pago</label>
            <label className="file">
              <input
                type="file"
                name="comprobante"
                accept=".jpg,.jpeg,.png,.pdf"
                onChange={onChange}
                required
              />
              <span className="clip">📎</span>
              <span className="fname">{fileName || "Seleccionar archivo..."}</span>
            </label>

            {/* ✅ Preview único: imagen pequeña o PDF embebido */}
            {filePreview && !esPDF && (
              <div className="preview-img">
                <img src={filePreview} alt="Comprobante" />
              </div>
            )}

            {esPDF && pdfURL && (
              <div className="preview-pdf">
                <embed src={pdfURL} type="application/pdf" width="100%" height="200px" />
              </div>
            )}
          </div>

          {/* Botón de envío */}
          <button className="btn" disabled={!puedeEnviar}>Solicitar</button>
        </form>

        {/* Panel lateral con datos del depósito */}
        <aside className="card side">
          <div className="side-title">Datos para Depósitos</div>
          <ul className="list">
            <li><strong>Nombre:</strong> Junta de Vecinos Mirador IV</li>
            <li><strong>RUT:</strong> 65.432.100-1</li>
            <li><strong>Banco:</strong> Banco Ejemplo</li>
            <li><strong>Tipo de cuenta:</strong> Cuenta Vista</li>
            <li><strong>Nº Cuenta:</strong> 123456789</li>
            <li><strong>Correo:</strong> junta@ejemplo.cl</li>
          </ul>
          <div className="foot">
            Contáctanos a traves de:{" "}
            <a href="mailto:juntadevecinosmiradordevolcanescuatro@gmail.com">
              juntadevecinosmiradordevolcanescuatro@gmail.com
            </a>
          </div>
        </aside>
      </main>
    </div>
  );
}
