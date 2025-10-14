import React, { useRef, useState } from "react";
import PanelLateralD from "../../components/PanelLateralD.jsx";
import "./NoticiasDirectiva.css";

export default function NoticiasDirectiva() {
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [mainImage, setMainImage] = useState(null);
  const [secondary1, setSecondary1] = useState(null);
  const [secondary2, setSecondary2] = useState(null);
  const [errors, setErrors] = useState({});
  const editorRef = useRef(null);

  // ---- acciones simples de edición rica ----
  const cmd = (command, value = null) => {
    editorRef.current?.focus();
    document.execCommand(command, false, value);
  };

  const onPastePlain = (e) => {
    e.preventDefault();
    const text = e.clipboardData.getData("text/plain");
    document.execCommand("insertText", false, text);
  };

  const validate = () => {
    const next = {};
    if (!title.trim()) next.title = "El título es obligatorio.";
    if (!mainImage) next.mainImage = "La imagen principal es obligatoria.";
    const html =
      editorRef.current?.innerHTML.replace(/<br>/g, "").trim() || "";
    if (!html || html === "<p></p>") next.body = "Redacta la noticia.";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const readAsDataURL = (file, setter) => {
    if (!file) return setter(null);
    const reader = new FileReader();
    reader.onload = (e) => setter({ file, url: e.target.result });
    reader.readAsDataURL(file);
  };

  const handleFile = (e, setter) => {
    const file = e.target.files?.[0];
    if (!file) return setter(null);
    if (!/^image\//.test(file.type)) {
      alert("El archivo debe ser una imagen.");
      return;
    }
    readAsDataURL(file, setter);
  };

  const clearForm = () => {
    setTitle("");
    setSubtitle("");
    setMainImage(null);
    setSecondary1(null);
    setSecondary2(null);
    setErrors({});
    if (editorRef.current) editorRef.current.innerHTML = "";
  };

  const handlePublish = () => {
    if (!validate()) return;

    const payload = {
      title: title.trim(),
      subtitle: subtitle.trim(),
      body: editorRef.current?.innerHTML || "",
      images: {
        main: mainImage?.url || null,
        secondary1: secondary1?.url || null,
        secondary2: secondary2?.url || null,
      },
      created_at: new Date().toISOString(),
    };
    // TODO: Reemplazar por tu llamada a API/Supabase/FastAPI
    console.log("Publicar:", payload);
    alert("Aquí iría la lógica de publicación (API).");
  };

  return (
    <PanelLateralD title="Publicación de noticias">
      <div className="news-page wide">
        <header className="news-head news-head--contrast">
          <h1>Publicación de noticias</h1>
          <p className="news-instructions">
            Completa los campos y publica la noticia. 
          </p>
        </header>

        <section className="news-card news-card--roomy">
          <div className="grid two">
            <div className="form-field">
              <label htmlFor="title">Título *</label>
              <input
                id="title"
                type="text"
                placeholder="Escribe un título claro y descriptivo"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
              {errors.title && <small className="error">{errors.title}</small>}
            </div>

            <div className="form-field">
              <label htmlFor="subtitle">Subtítulo</label>
              <input
                id="subtitle"
                type="text"
                placeholder="Añade un subtítulo que complemente el título"
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
              />
            </div>
          </div>

          <div className="grid three">
            <div className="form-field">
              <label htmlFor="mainImage">Imagen principal *</label>
              <input
                id="mainImage"
                type="file"
                accept="image/*"
                onChange={(e) => handleFile(e, setMainImage)}
              />
              {errors.mainImage && (
                <small className="error">{errors.mainImage}</small>
              )}
              {mainImage?.url && (
                <div className="img-preview tall">
                  <img src={mainImage.url} alt="Principal" />
                </div>
              )}
            </div>

            <div className="form-field">
              <label htmlFor="secondary1">Imagen secundaria 1</label>
              <input
                id="secondary1"
                type="file"
                accept="image/*"
                onChange={(e) => handleFile(e, setSecondary1)}
              />
              {secondary1?.url && (
                <div className="img-preview">
                  <img src={secondary1.url} alt="Secundaria 1" />
                </div>
              )}
            </div>

            <div className="form-field">
              <label htmlFor="secondary2">Imagen secundaria 2</label>
              <input
                id="secondary2"
                type="file"
                accept="image/*"
                onChange={(e) => handleFile(e, setSecondary2)}
              />
              {secondary2?.url && (
                <div className="img-preview">
                  <img src={secondary2.url} alt="Secundaria 2" />
                </div>
              )}
            </div>
          </div>

          <div className="form-field">
            <label>Redacción de la noticia *</label>

            {/* Toolbar */}
            <div className="editor-toolbar" role="group" aria-label="Herramientas de formato">
              <button type="button" onClick={() => cmd("bold")} title="Negrita (Ctrl+B)">
                <b>B</b>
              </button>
              <button type="button" onClick={() => cmd("italic")} title="Cursiva (Ctrl+I)">
                <i>I</i>
              </button>
              <button type="button" onClick={() => cmd("underline")} title="Subrayado (Ctrl+U)">
                <u>U</u>
              </button>

              <span className="sep" />

              <button type="button" onClick={() => cmd("formatBlock", "<h2>")} title="Título H2">
                H2
              </button>
              <button type="button" onClick={() => cmd("formatBlock", "<h3>")} title="Título H3">
                H3
              </button>
              <button type="button" onClick={() => cmd("formatBlock", "<p>")} title="Párrafo">
                ¶
              </button>

              <span className="sep" />

              <button type="button" onClick={() => cmd("insertUnorderedList")} title="Lista •">
                •
              </button>
              <button type="button" onClick={() => cmd("insertOrderedList")} title="Lista 1.">
                1.
              </button>

              <span className="sep" />

              <button
                type="button"
                onClick={() => {
                  const url = prompt("URL del enlace:");
                  if (url) cmd("createLink", url);
                }}
                title="Insertar enlace"
              >
                🔗
              </button>
              <button type="button" onClick={() => cmd("removeFormat")} title="Limpiar formato">
                ⌫
              </button>
            </div>

            {/* Editor */}
            <div
              className="rich-editor large"
              ref={editorRef}
              contentEditable
              suppressContentEditableWarning
              onPaste={onPastePlain}
              aria-label="Editor de contenido"
              placeholder="Escribe aquí el contenido de la noticia…"
            ></div>

            {errors.body && <small className="error">{errors.body}</small>}
            <p className="hint">Consejo: pega como texto plano para evitar formatos extraños.</p>
          </div>

          <div className="actions">
            <button type="button" className="btn ghost" onClick={clearForm}>
              Limpiar
            </button>
            <button type="button" className="btn" onClick={handlePublish}>
              Publicar
            </button>
          </div>
        </section>
      </div>
    </PanelLateralD>
  );
}
