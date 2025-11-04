import { useEffect, useMemo, useState } from "react";
import "./Certificados.css";
import { CertAPI } from "../../api/certificados"; // 👈 helper API

/* Formatea RUT con puntos y guion */
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

/* Valida RUT (módulo 11) */
function validarRut(rutConFormato) {
  if (!rutConFormato) return false;
  const limpio = rutConFormato.replace(/\./g, "").toUpperCase();
  if (!limpio.includes("-")) return false;

  const [cuerpo, dv] = limpio.split("-");
  if (!cuerpo || !dv) return false;

  let suma = 0;
  let mult = 2;
  for (let i = cuerpo.length - 1; i >= 0; i--) {
    suma += parseInt(cuerpo[i], 10) * mult;
    mult = mult === 7 ? 2 : mult + 1;
  }
  const resto = 11 - (suma % 11);
  const dvEsperado = resto === 11 ? "0" : resto === 10 ? "K" : String(resto);
  return dv === dvEsperado;
}

export default function Certificados() {
  // Form
  const [form, setForm] = useState({
    nombre: "",
    rut: "",
    direccion: "",
    email: "",
    comprobante: null, // file (opcional, si no sube se toma "Fisico")
  });

  // UI estados
  const [fileName, setFileName] = useState("");
  const [filePreview, setFilePreview] = useState(null);
  const [rutValido, setRutValido] = useState(true);

  // Mensajes
  const [done, setDone] = useState(false);
  const [folio, setFolio] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [uploadWarn, setUploadWarn] = useState(""); // ⚠️ aviso si falla el upload

  // Manejo de cambios
  const onChange = (e) => {
    const { name, value, files } = e.target;

    if (name === "comprobante") {
      const f = files?.[0] ?? null;
      setForm((s) => ({ ...s, comprobante: f }));
      if (f) {
        setFileName(f.name);
        if (f.type.startsWith("image/")) {
          setFilePreview(URL.createObjectURL(f));
        } else {
          setFilePreview(null);
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

  // Habilitar botón (👉 ahora el comprobante es obligatorio)
  const puedeEnviar =
    form.nombre.trim() &&
    form.rut.trim() &&
    form.direccion.trim() &&
    form.email.trim() &&
    !!form.comprobante &&
    rutValido &&
    !loading;

  // Detecta PDF
  const esPDF = useMemo(() => {
    if (!form.comprobante) return false;
    const type = form.comprobante.type;
    return type === "application/pdf" || fileName.toLowerCase().endsWith(".pdf");
  }, [form.comprobante, fileName]);

  // URL temporal para PDF
  const pdfURL = useMemo(() => {
    if (!form.comprobante || !esPDF) return null;
    return URL.createObjectURL(form.comprobante);
  }, [form.comprobante, esPDF]);

  // Liberar URLs al desmontar
  useEffect(() => {
    return () => {
      if (filePreview) URL.revokeObjectURL(filePreview);
      if (pdfURL) URL.revokeObjectURL(pdfURL);
    };
  }, [filePreview, pdfURL]);

  // Enviar: 1) crear solicitud  2) si hay archivo → subir comprobante
  const onSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setUploadWarn("");

    if (!validarRut(form.rut)) {
      setRutValido(false);
      return;
    }
    if (!form.nombre || !form.direccion || !form.email || !form.comprobante) {
      return;
    }

    try {
      setLoading(true);

      const metodoPago = form.comprobante ? "Transferencia" : "Fisico";

      const payload = {
        nombre: form.nombre.trim(),
        rut: form.rut.trim(),
        direccion: form.direccion.trim(),
        email: form.email.trim(),
        metodoPago,
        // 👇 ya no enviamos una URL falsa; el archivo se sube en un segundo paso
        comprobanteUrl: form.comprobante ? null : null,
        notas: "Solicitud web (socio)",
        idSocio: null,
        idUsuarioSolicita: null,
      };

      // 1) Crear solicitud
      const row = await CertAPI.solicitarDesdeWeb(payload);

      // Obtén ID_Cert (defensivo por si cambia el nombre)
      const idCert =
        row?.ID_Cert ?? row?.id ?? row?.Id ?? row?.idCert ?? null;

      setFolio(row?.Folio || null);

      // 2) Subir comprobante (obligatorio)
      if (idCert && form.comprobante) {
        try {
          await CertAPI.subirComprobante(idCert, form.comprobante);
        } catch (upErr) {
          console.error(upErr);
          setUploadWarn(
            "Tu solicitud fue recibida, pero no pudimos subir el comprobante. Puedes reintentar más tarde."
          );
        }
      }

      setDone(true);

      // Limpiar form
      setForm({ nombre: "", rut: "", direccion: "", email: "", comprobante: null });
      setFileName("");
      setFilePreview(null);

      // Scroll arriba para ver el mensaje
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message || "Ocurrió un error al enviar la solicitud.");
    } finally {
      setLoading(false);
    }
  };

  // Cerrar pantalla de éxito
  const cerrarExito = () => {
    setDone(false);
    setFolio(null);
    setUploadWarn("");
  };

  return (
    <div className="page">
      {/* Intro */}
      <section className="intro">
        <h1>Solicita tu certificado de residencia</h1>
        <div className="precio">Valor $2000</div>
        <p className="nota">
          Para solicitar certificado debes depositar previamente y adjuntar comprobante.
        </p>
      </section>

      {/* ÉXITO EN PANTALLA */}
      {done && (
        <section className="card success">
          <div className="success__icon" aria-hidden>✅</div>
          <h2 className="success__title">Solicitud enviada correctamente</h2>
          <p className="success__desc">
            Hemos recibido tu solicitud de certificado de residencia.
            <br />
            <strong>Plazo de respuesta:</strong> dentro de 48–72 horas hábiles.
          </p>

          {folio && (
            <div className="success__info">
              <div><span className="tag">Folio</span> <strong>{folio}</strong></div>
              <div><span className="tag">Estado</span> Pendiente de revisión</div>
              <div><span className="tag">Contacto</span> Te avisaremos al correo ingresado</div>
            </div>
          )}

          {/* Aviso si falló la subida del comprobante */}
          {uploadWarn && <div className="form-error" style={{ marginTop: 12 }}>{uploadWarn}</div>}

          <div className="success__actions">
            <button type="button" className="btn" onClick={cerrarExito}>
              Cerrar
            </button>
          </div>
        </section>
      )}

      {/* FORMULARIO + DATOS (se ocultan si está el éxito) */}
      {!done && (
        <main className="grid">
          {/* FORMULARIO */}
          <form className="card form" onSubmit={onSubmit} noValidate id="formulario">
            {/* Error inline */}
            {errorMsg && <div className="form-error">{errorMsg}</div>}

            {/* Nombre */}
            <div className="group">
              <label htmlFor="nombre">Nombre Completo*</label>
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
              <label htmlFor="rut">RUT*</label>
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
              <label htmlFor="direccion">Dirección*</label>
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
              <label htmlFor="email">Correo Electrónico*</label>
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

            {/* Comprobante (👉 obligatorio) */}
            <div className="group">
              <label>Adjunta comprobante de pago*</label>

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

              {/* Preview imagen */}
              {filePreview && !esPDF && (
                <div className="preview-img">
                  <img src={filePreview} alt="Comprobante" />
                </div>
              )}

              {/* Preview PDF */}
              {esPDF && pdfURL && (
                <div className="preview-pdf">
                  <embed src={pdfURL} type="application/pdf" width="100%" height="200px" />
                </div>
              )}
            </div>

            {/* Enviar */}
            <button className="btn" disabled={!puedeEnviar}>
              {loading ? "Enviando..." : "Solicitar"}
            </button>
          </form>

          {/* LADO DERECHO: datos para transferir */}
          <aside className="card side" id="datos">
            <div className="side-title">Datos para Depósitos</div>
            <ul className="list">
              <li>
                <strong>Nombre:</strong> Junta de Vecinos Mirador Cuatro
              </li>
              <li>
                <strong>RUT:</strong> 65.205.436-6  65205436-6
              </li>
              <li>
                <strong>Banco:</strong> Banco Estado
              </li>
              <li>
                <strong>Tipo de cuenta:</strong> Cuenta Vista
              </li>
              <li>
                <strong>Nº Cuenta:</strong> 82470202650
              </li>
              <li>
                <strong>Correo:</strong> juntadevecinosvolcanescuatro@gmail.com
              </li>
            </ul>
            <div className="foot">
              Contáctanos en{" "}
              <a href="mailto:juntadevecinosvolcanescuatro@gmail.com">
                juntadevecinosvolcanescuatro@gmail.com
              </a>
            </div>
          </aside>
        </main>
      )}
    </div>
  );
}
