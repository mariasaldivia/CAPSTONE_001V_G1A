import { useEffect, useMemo, useState } from "react";
import "./Certificados.css";

/* Función para dejar el RUT con puntos y guion
   (solo formatea, no valida) */
function formatearRut(input) {
  if (!input) return "";
  let v = input.replace(/\./g, "").replace(/\s+/g, "").toUpperCase();
  v = v.replace(/[^0-9K]/gi, ""); // deja solo números y K
  if (v.length < 2) return v;
  const cuerpo = v.slice(0, -1);
  const dv = v.slice(-1);
  const cuerpoMiles = cuerpo.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `${cuerpoMiles}-${dv}`;
}

/* Valida el RUT (módulo 11).
   Devuelve true si el RUT es correcto. */
function validarRut(rutConFormato) {
  if (!rutConFormato) return false;
  const limpio = rutConFormato.replace(/\./g, "").toUpperCase();
  if (!limpio.includes("-")) return false;

  const [cuerpo, dv] = limpio.split("-");
  if (!cuerpo || !dv) return false;

  let suma = 0;
  let mult = 2;
  // recorre el número de derecha a izquierda multiplicando y sumando
  for (let i = cuerpo.length - 1; i >= 0; i--) {
    suma += parseInt(cuerpo[i], 10) * mult;
    mult = mult === 7 ? 2 : mult + 1;
  }
  const resto = 11 - (suma % 11);
  const dvEsperado = resto === 11 ? "0" : resto === 10 ? "K" : String(resto);
  return dv === dvEsperado;
}

/* Página de Certificados:
   - NO lleva nav propio (el Navbar global ya está en App.jsx)
   - Tiene un formulario simple con validación de RUT
   - Permite subir un comprobante (imagen o PDF) y ver preview */
export default function Certificados() {
  // Estado del formulario (lo que el usuario escribe)
  const [form, setForm] = useState({
    nombre: "",
    rut: "",
    direccion: "",
    email: "",
    comprobante: null, // aquí guardamos el archivo
  });

  // Cosas útiles para mostrar el archivo subido
  const [fileName, setFileName] = useState("");
  const [filePreview, setFilePreview] = useState(null); // URL para mostrar imagen
  const [rutValido, setRutValido] = useState(true);

  // Cuando cambia algo del formulario
  const onChange = (e) => {
    const { name, value, files } = e.target;

    // Si cambió el archivo
    if (name === "comprobante") {
      const f = files?.[0] ?? null;
      setForm((s) => ({ ...s, comprobante: f }));
      if (f) {
        setFileName(f.name);
        // Si es imagen, creo una URL temporal para mostrarla
        if (f.type.startsWith("image/")) {
          setFilePreview(URL.createObjectURL(f));
        } else {
          setFilePreview(null); // para PDF no usamos <img>
        }
      } else {
        setFileName("");
        setFilePreview(null);
      }
      return;
    }

    // Si cambió el RUT, formateo y valido
    if (name === "rut") {
      const formateado = formatearRut(value);
      setForm((s) => ({ ...s, rut: formateado }));
      setRutValido(validarRut(formateado));
      return;
    }

    // Para el resto de campos (nombre, dirección, email)
    setForm((s) => ({ ...s, [name]: value }));
  };

  // Botón "Solicitar" se activa solo si todo está OK
  const puedeEnviar =
    form.nombre.trim() &&
    form.rut.trim() &&
    form.direccion.trim() &&
    form.email.trim() &&
    rutValido &&
    form.comprobante;

  // Reviso si el archivo es PDF (para mostrar <embed>)
  const esPDF = useMemo(() => {
    if (!form.comprobante) return false;
    const type = form.comprobante.type;
    return type === "application/pdf" || fileName.toLowerCase().endsWith(".pdf");
  }, [form.comprobante, fileName]);

  // Creo una URL temporal para el PDF (si corresponde)
  const pdfURL = useMemo(() => {
    if (!form.comprobante || !esPDF) return null;
    return URL.createObjectURL(form.comprobante);
  }, [form.comprobante, esPDF]);

  // Limpio las URLs temporales cuando el componente se desmonte
  useEffect(() => {
    return () => {
      if (filePreview) URL.revokeObjectURL(filePreview);
      if (pdfURL) URL.revokeObjectURL(pdfURL);
    };
  }, [filePreview, pdfURL]);

  // Al enviar el formulario
  const onSubmit = (e) => {
    e.preventDefault();

    // Validaciones rápidas antes de “enviar”
    if (!validarRut(form.rut)) {
      setRutValido(false);
      alert("El RUT ingresado no es válido.");
      return;
    }
    if (!form.comprobante) {
      alert("Debes adjuntar el comprobante de pago.");
      return;
    }

    // Aquí iría tu request real (fetch/axios con FormData)
    // Ejemplo:
    // const fd = new FormData();
    // Object.entries(form).forEach(([k, v]) => fd.append(k, v));
    // await fetch("/api/certificados", { method: "POST", body: fd });

    alert("Solicitud enviada correctamente ✨");
  };

  return (
    <div className="page">
      {/* Importante: ya NO hay header/nav aquí */}
      <section className="intro">
        <h1>Para solicitar tu certificado de residencia completa los siguientes datos.</h1>
        <div className="precio">Valor $XXXX</div>
        <p className="nota">
          Recuerda que debes hacer tu depósito previo a realizar la solicitud.
        </p>
      </section>

      {/* Dos columnas: (1) formulario (2) datos de depósito */}
      <main className="grid">
        {/* FORMULARIO */}
        <form className="card form" onSubmit={onSubmit} noValidate>
          {/* Nombre */}
          <div className="group">
            <label htmlFor="nombre">Nombre Completo</label>
            <input
              id="nombre"
              name="nombre"
              value={form.nombre}
              onChange={onChange}
              required
              autoComplete="name"
            />
          </div>

          {/* RUT */}
          <div className="group">
            <label htmlFor="rut">RUT</label>
            <input
              id="rut"
              name="rut"
              placeholder="12.345.678-5"
              value={form.rut}
              onChange={onChange}
              className={!rutValido && form.rut ? "input-error" : ""}
              required
              inputMode="text"
              aria-invalid={!rutValido && form.rut ? "true" : "false"}
              aria-describedby={!rutValido && form.rut ? "rut-error" : undefined}
            />
            {!rutValido && form.rut && (
              <small id="rut-error" style={{ color: "#ffb4b4" }}>
                RUT inválido
              </small>
            )}
          </div>

          {/* Dirección */}
          <div className="group">
            <label htmlFor="direccion">Dirección</label>
            <input
              id="direccion"
              name="direccion"
              value={form.direccion}
              onChange={onChange}
              required
              autoComplete="street-address"
            />
          </div>

          {/* Email */}
          <div className="group">
            <label htmlFor="email">Correo Electrónico</label>
            <input
              id="email"
              type="email"
              name="email"
              value={form.email}
              onChange={onChange}
              required
              autoComplete="email"
            />
          </div>

          {/* Archivo (comprobante) */}
          <div className="group">
            <label>Adjunta comprobante de pago</label>

            {/* Input de archivo “bonito” (texto + clip) */}
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

            {/* Si es imagen, muestro miniatura */}
            {filePreview && !esPDF && (
              <div className="preview-img">
                <img src={filePreview} alt="Comprobante" />
              </div>
            )}

            {/* Si es PDF, lo muestro embebido */}
            {esPDF && pdfURL && (
              <div className="preview-pdf">
                <embed src={pdfURL} type="application/pdf" width="100%" height="200px" />
              </div>
            )}
          </div>

          {/* Botón para enviar */}
          <button className="btn" disabled={!puedeEnviar}>
            Solicitar
          </button>
        </form>

        {/* LADO DERECHO: datos para transferir */}
        <aside className="card side">
          <div className="side-title">Datos para Depósitos</div>
          <ul className="list">
            <li>
              <strong>Nombre:</strong> Junta de Vecinos Mirador IV
            </li>
            <li>
              <strong>RUT:</strong> 65.432.100-1
            </li>
            <li>
              <strong>Banco:</strong> Banco Ejemplo
            </li>
            <li>
              <strong>Tipo de cuenta:</strong> Cuenta Vista
            </li>
            <li>
              <strong>Nº Cuenta:</strong> 123456789
            </li>
            <li>
              <strong>Correo:</strong> junta@ejemplo.cl
            </li>
          </ul>
          <div className="foot">
            Contáctanos en{" "}
            <a href="mailto:juntadevecinosmiradordevolcanescuatro@gmail.com">
              juntadevecinosmiradordevolcanescuatro@gmail.com
            </a>
          </div>
        </aside>
      </main>
    </div>
  );
}
