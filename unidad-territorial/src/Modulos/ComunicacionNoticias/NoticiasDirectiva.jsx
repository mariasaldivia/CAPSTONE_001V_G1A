import React, { useEffect, useMemo, useRef, useState } from "react";
import PanelLateralD from "../../components/PanelLateralD.jsx";
import "./NoticiasDirectiva.css";
import { NoticiasAPI } from "../../api/noticias";

/* ===========================
   Constantes y utilidades
=========================== */
const STATUS = { BORRADOR: 0, PUBLICADA: 1, ARCHIVADA: 2 };
const STATUS_LABEL = { 0: "Borrador", 1: "Publicada", 2: "Archivada" };

const MAX_TITLE = 150;
const MAX_SUB = 200;
const MAX_RESUMEN = 800;

const fmtDate = (iso) =>
  new Date(iso).toLocaleDateString(undefined, {
    year: "2-digit",
    month: "2-digit",
    day: "2-digit",
  });

const slugify = (s) =>
  (s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "")
    .slice(0, 200);

// hoy en formato YYYY-MM-DD (para limitar el input date)
const todayStr = () => new Date().toISOString().slice(0, 10);

// fallback para no romper UI si la API falla la 1ª vez
const MOCK_HISTORY = [];

export default function NoticiasDirectiva() {
  /* ===== Form ===== */
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [publishAt, setPublishAt] = useState(""); // YYYY-MM-DD
  const [mainImage, setMainImage] = useState(null);
  const [secondary1, setSecondary1] = useState(null);
  const [secondary2, setSecondary2] = useState(null);
  const [errors, setErrors] = useState({});
  const editorRef = useRef(null);

  // contador de resumen (texto plano del cuerpo)
  const [resumenCount, setResumenCount] = useState(0);
  const updateResumenCount = () => {
    const txt = (editorRef.current?.innerText || "").replace(/\s+/g, " ").trim();
    setResumenCount(txt.length);
  };

  /* ===== Historial ===== */
  const [historyOpen, setHistoryOpen] = useState(false);
  const [history, setHistory] = useState(MOCK_HISTORY);
  const [editingId, setEditingId] = useState(null);
  const [status, setStatus] = useState(STATUS.PUBLICADA); // solo visible en edición

  const sortedHistory = useMemo(
    () =>
      [...history].sort(
        (a, b) =>
          new Date(b.publish_at || b.created_at || 0) - new Date(a.publish_at || a.created_at || 0)
      ),
    [history]
  );

  /* ===== Cargar historial real del backend ===== */
  const refreshHistorial = async () => {
    try {
      const data = await NoticiasAPI.listarHistorial();
      if (Array.isArray(data)) setHistory(data);
    } catch (e) {
      console.warn("No se pudo cargar historial de noticias:", e?.message || e);
    }
  };

  useEffect(() => {
    refreshHistorial();
  }, []);

  /* ===== Editor y archivos ===== */
  const cmd = (command, value = null) => {
    editorRef.current?.focus();
    document.execCommand(command, false, value);
    setTimeout(updateResumenCount, 0);
  };

  const onPastePlain = (e) => {
    e.preventDefault();
    const text = e.clipboardData.getData("text/plain");
    document.execCommand("insertText", false, text);
    setTimeout(updateResumenCount, 0);
  };

  const readAsDataURL = (file, setter) => {
    if (!file) return setter(null);
    const reader = new FileReader();
    reader.onload = (ev) => setter({ file, url: ev.target.result });
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

  /* ===== Validación y payload ===== */
  const validate = () => {
    const next = {};

    if (!title.trim()) next.title = "El título es obligatorio.";

    // En creación: obligatoria. En edición: si ya hay URL, no obligues a re-subir.
    if (!editingId) {
      if (!mainImage?.url && !mainImage?.file) next.mainImage = "La imagen principal es obligatoria.";
    } else {
      const tieneExistente = !!(mainImage?.url);
      const subeNueva = !!(mainImage?.file);
      if (!tieneExistente && !subeNueva) {
        next.mainImage = "Debes mantener la imagen actual o subir una nueva.";
      }
    }

    const txt = (editorRef.current?.innerText || "").replace(/\s+/g, " ").trim();
    if (!txt) next.body = "Redacta la noticia.";

    // fecha: no permitir futura
    if (publishAt) {
      const sel = new Date(publishAt + "T00:00:00");
      const today = new Date(todayStr() + "T00:00:00");
      if (sel > today) {
        next.publishAt = "La fecha no puede ser futura.";
      }
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const buildPayloadSimple = () => {
    const html = editorRef.current?.innerHTML || "";
    const resumenTextoPlano = (editorRef.current?.innerText || "")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, MAX_RESUMEN);

    // Si la fecha es vacía o futura, usar hoy
    let fechaPub = publishAt || todayStr();
    if (publishAt) {
      const sel = new Date(publishAt + "T00:00:00");
      const today = new Date(todayStr() + "T00:00:00");
      if (sel > today) fechaPub = todayStr();
    }

    return {
      titulo: title.trim(),
      subtitulo: (subtitle || "").slice(0, MAX_SUB) || null,
      resumen: resumenTextoPlano || null,
      cuerpo_html: html,
      estado: editingId ? status : STATUS.PUBLICADA,
      publish_at: fechaPub + "T00:00:00.000Z",
      slug: slugify(title),
    };
  };

  /* ===== Acciones de formulario ===== */
  const clearForm = () => {
    setTitle("");
    setSubtitle("");
    setPublishAt("");
    setMainImage(null);
    setSecondary1(null);
    setSecondary2(null);
    setErrors({});
    setEditingId(null);
    setStatus(STATUS.PUBLICADA);
    if (editorRef.current) {
      editorRef.current.innerHTML = "";
      setResumenCount(0);
    }
  };

  // ⚙️ CARGA CORRECTA EN EDICIÓN (usa imagen_principal o imagen_principal_url)
  const loadForEdit = (item) => {
    setEditingId(item.id);
    setTitle(item.titulo || "");
    setSubtitle(item.subtitulo || "");
    setStatus(item.estado ?? STATUS.PUBLICADA);

    const pub = (item.publish_at || item.created_at || "").slice(0, 10);
    setPublishAt(pub || "");

    // ← clave: tu API ya normaliza imagen_principal (URL absoluta)
    const principalUrl = item.imagen_principal || item.imagen_principal_url || null;
    setMainImage(principalUrl ? { url: principalUrl } : null);

    const sec = Array.isArray(item.imagenes_secundarias) ? item.imagenes_secundarias : [];
    setSecondary1(sec[0] ? { url: sec[0] } : null);
    setSecondary2(sec[1] ? { url: sec[1] } : null);

    if (editorRef.current) {
      const cuerpoHtml = item.cuerpo_html || item.cuerpo || item.contenido || "";
      editorRef.current.innerHTML = cuerpoHtml;
      setTimeout(updateResumenCount, 0);
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handlePublish = async () => {
    if (!validate()) return;

    try {
      const base = buildPayloadSimple();

      const fd = new FormData();
      Object.entries(base).forEach(([k, v]) => fd.append(k, v ?? ""));

      // En creación: adjunta principal obligatoria; en edición: solo si el usuario sube una nueva.
      if (mainImage?.file) {
        fd.append("mainImage", mainImage.file);
        // nombres opcionales por compatibilidad si tu backend los acepta
        fd.append("imagen_principal", mainImage.file);
      }

      if (secondary1?.file) fd.append("secondary1", secondary1.file);
      if (secondary2?.file) fd.append("secondary2", secondary2.file);

      if (editingId) {
        await NoticiasAPI.actualizar(editingId, fd);
        await refreshHistorial();
        alert("Cambios guardados ✅");
      } else {
        await NoticiasAPI.crear(fd);
        await refreshHistorial();
        alert("Noticia publicada ✅");
      }

      clearForm();
    } catch (e) {
      alert(`No se pudo publicar la noticia: ${e?.message || "Error"}`);
    }
  };

  /* ===== Acciones del historial ===== */
  const toggleArchive = async (item) => {
    const next = item.estado === STATUS.PUBLICADA ? STATUS.ARCHIVADA : STATUS.PUBLICADA;
    try {
      await NoticiasAPI.cambiarEstado(item.id, next);
      setHistory((prev) => prev.map((n) => (n.id === item.id ? { ...n, estado: next } : n)));
      await refreshHistorial();
    } catch (e) {
      alert(`No se pudo actualizar el estado: ${e?.message || "Error"}`);
    }
  };

  const hardDelete = async (item) => {
    try {
      await NoticiasAPI.eliminar(item.id);
      setHistory((prev) => prev.filter((n) => n.id !== item.id));
      alert("Eliminado con éxito ✅");
    } catch (e) {
      alert(`No se pudo eliminar: ${e?.message || "Error"}`);
    }
  };

  /* ===== Render ===== */
  return (
    <PanelLateralD title="Publicación de noticias">
      <div className="news-page wide">
        <header className="news-head news-head--contrast">
          <div className="flex-between">
            <div>
              <h1>Publicación de noticias</h1>
              <p className="news-instructions">Gestiona publicaciones y consulta el historial.</p>
            </div>

            <button
              type="button"
              className={`chip ${historyOpen ? "chip-ghost" : ""}`}
              onClick={() => {
                setHistoryOpen((v) => !v);
                setTimeout(() => {
                  const el = document.getElementById("historial-noticias");
                  if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
                }, 120);
              }}
            >
              {historyOpen ? "Ocultar historial" : "Historial"}
            </button>
          </div>
        </header>

        {/* ===== Formulario ===== */}
        <section className="news-card news-card--roomy">
          <div className="grid two">
            <div className="form-field">
              <label>Título *</label>
              <input
                type="text"
                placeholder="Título claro y descriptivo"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={MAX_TITLE}
              />
              <small className="hint">{title.length}/{MAX_TITLE}</small>
              {errors.title && <small className="error">{errors.title}</small>}
            </div>

            <div className="form-field">
              <label>Subtítulo</label>
              <input
                type="text"
                placeholder="Subtítulo (opcional)"
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
                maxLength={MAX_SUB}
              />
              <small className="hint">{subtitle.length}/{MAX_SUB}</small>
            </div>
          </div>

          <div className="grid three">
            <div className="form-field">
              <label>Imagen principal {editingId ? "(actual o nueva)" : "*"}</label>
              <input type="file" accept="image/*" onChange={(e) => handleFile(e, setMainImage)} />
              {errors.mainImage && <small className="error">{errors.mainImage}</small>}
              {mainImage?.url && (
                <div className="img-preview tall">
                  <img src={mainImage.url} alt="Principal" />
                </div>
              )}
            </div>

            <div className="form-field">
              <label>Imagen secundaria 1</label>
              <input type="file" accept="image/*" onChange={(e) => handleFile(e, setSecondary1)} />
              {secondary1?.url && (
                <div className="img-preview">
                  <img src={secondary1.url} alt="Secundaria 1" />
                </div>
              )}
            </div>

            <div className="form-field">
              <label>Imagen secundaria 2</label>
              <input type="file" accept="image/*" onChange={(e) => handleFile(e, setSecondary2)} />
              {secondary2?.url && (
                <div className="img-preview">
                  <img src={secondary2.url} alt="Secundaria 2" />
                </div>
              )}
            </div>
          </div>

          {/* Fecha programable + Estado (solo en edición) */}
          <div className="grid two">
            <div className="form-field">
              <label>Fecha de publicación (opcional)</label>
              <input
                type="date"
                value={publishAt}
                max={todayStr()}
                onChange={(e) => setPublishAt(e.target.value)}
              />
              {errors.publishAt && <small className="error">{errors.publishAt}</small>}
            </div>

            {editingId && (
              <div className="form-field">
                <label>Estado (solo edición)</label>
                <select value={status} onChange={(e) => setStatus(Number(e.target.value))}>
                  <option value={STATUS.PUBLICADA}>Publicada</option>
                  <option value={STATUS.ARCHIVADA}>Archivada</option>
                </select>
              </div>
            )}
          </div>

          <div className="form-field">
            <label>Redacción *</label>

            <div className="editor-toolbar" role="group" aria-label="Herramientas de formato">
              <button type="button" onClick={() => cmd("bold")} title="Negrita"><b>B</b></button>
              <button type="button" onClick={() => cmd("italic")} title="Cursiva"><i>I</i></button>
              <button type="button" onClick={() => cmd("underline")} title="Subrayado"><u>U</u></button>

              <span className="sep" />

              <button type="button" onClick={() => cmd("formatBlock", "<h2>")} title="H2">H2</button>
              <button type="button" onClick={() => cmd("insertUnorderedList")} title="Lista">•</button>

              <span className="sep" />

              <button
                type="button"
                title="Insertar enlace"
                onClick={() => {
                  const url = prompt("URL del enlace:");
                  if (url) cmd("createLink", url);
                }}
              >
                🔗
              </button>
              <button type="button" onClick={() => cmd("removeFormat")} title="Limpiar formato">⌫</button>
            </div>

            <div
              className="rich-editor large"
              ref={editorRef}
              contentEditable
              suppressContentEditableWarning
              onPaste={onPastePlain}
              onInput={updateResumenCount}
              aria-label="Editor de contenido"
              placeholder="Escribe aquí el contenido de la noticia…"
            ></div>

            <small className="hint">{resumenCount}/{MAX_RESUMEN}</small>
            {errors.body && <small className="error">{errors.body}</small>}
          </div>

          <div className="actions">
            {editingId ? (
              <>
                <button type="button" className="btn ghost" onClick={clearForm}>Cancelar edición</button>
                <button type="button" className="btn" onClick={handlePublish}>Guardar cambios</button>
              </>
            ) : (
              <>
                <button type="button" className="btn ghost" onClick={clearForm}>Limpiar</button>
                <button type="button" className="btn" onClick={handlePublish}>Publicar</button>
              </>
            )}
          </div>
        </section>

        {/* ===== Historial ===== */}
        {historyOpen && (
          <section id="historial-noticias" className="news-card history-card">
            <div className="hist-head">
              <h2 className="hist-title">Historial de noticias</h2>
              <small className="muted">Editar, bajar/replicar o eliminar definitivamente</small>
            </div>

            <div className="hist-table">
              <div className="hist-row hist-row--head">
                <div className="col col-date">Fecha</div>
                <div className="col col-title">Título</div>
                <div className="col col-status">Estado</div>
                <div className="col col-actions">Acciones</div>
              </div>

              {sortedHistory.map((item) => (
                <div className="hist-row" key={item.id}>
                  <div className="col col-date">{fmtDate(item.publish_at || item.created_at)}</div>

                  <div className="col col-title">
                    <div className="title-stack">
                      <span className="title-line">{item.titulo}</span>
                    </div>
                  </div>

                  <div className="col col-status">{STATUS_LABEL[item.estado]}</div>

                  <div className="col col-actions">
                    {/* Editar */}
                    <button
                      className="circ-btn circ-edit"
                      title="Editar"
                      aria-label="Editar"
                      onClick={() => loadForEdit(item)}
                    >
                      <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
                        <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1.003 1.003 0 0 0 0-1.42l-2.34-2.34a1.003 1.003 0 0 0-1.42 0l-1.83 1.83 3.75 3.75 1.84-1.82z" />
                      </svg>
                    </button>

                    {/* Bajar/Re-publicar */}
                    <button
                      className="circ-btn circ-archive"
                      title={item.estado === STATUS.PUBLICADA ? "Bajar noticia" : "Re-publicar"}
                      aria-label="Alternar publicación"
                      onClick={() => toggleArchive(item)}
                    >
                      {item.estado === STATUS.PUBLICADA ? (
                        <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
                          <path d="M7 10l5 5 5-5H7z" />
                        </svg>
                      ) : (
                        <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
                          <path d="M7 14l5-5 5 5H7z" />
                        </svg>
                      )}
                    </button>

                    {/* Eliminar definitivo */}
                    <button
                      className="circ-btn circ-delete"
                      title="Eliminar definitivamente"
                      aria-label="Eliminar definitivamente"
                      onClick={() => hardDelete(item)}
                    >
                      <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
                        <path d="M6 7h12v2H6V7zm2 3h8l-1 10H9L8 10zm3-6h2l1 1h4v2H6V5h4l1-1z" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}

              {sortedHistory.length === 0 && <div className="hist-empty">Aún no hay publicaciones.</div>}
            </div>
          </section>
        )}
      </div>
    </PanelLateralD>
  );
}
