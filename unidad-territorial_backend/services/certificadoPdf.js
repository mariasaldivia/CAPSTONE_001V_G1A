// src/services/certificadoPdf.js
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import QRCode from "qrcode";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// PDF base con logos + firma + timbre (sin texto)
const BASE_PDF_PATH = path.join(__dirname, "..", "assets", "base_certificado.pdf");

// Carpeta donde se guardan los PDFs generados
const OUTPUT_DIR = path.join(process.cwd(), "uploads", "certificados");

// (Opcional) base para URL de validación QR
const QR_BASE_URL = process.env.CERT_QR_BASEURL || "";

/** Fecha dd-mm-yyyy */
function formatearFechaCorta(date) {
  const d = new Date(date);
  if (isNaN(d.getTime())) return "";
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}-${mm}-${yyyy}`;
}

/** Dibuja texto con salto de línea */
function drawWrappedText(page, { text, x, y, maxWidth, lineHeight, font, size }) {
  const words = String(text || "").split(/\s+/);
  let line = "";
  let cursorY = y;

  for (const w of words) {
    const test = line ? `${line} ${w}` : w;
    const width = font.widthOfTextAtSize(test, size);
    if (width > maxWidth && line) {
      page.drawText(line, { x, y: cursorY, size, font, color: rgb(0, 0, 0) });
      line = w;
      cursorY -= lineHeight;
    } else {
      line = test;
    }
  }

  if (line) {
    page.drawText(line, { x, y: cursorY, size, font, color: rgb(0, 0, 0) });
    cursorY -= lineHeight;
  }

  return cursorY;
}

export async function generarCertificadoResidenciaPDF(cert) {
  await fs.mkdir(OUTPUT_DIR, { recursive: true });

  // 1) Cargar plantilla base
  const basePdfBytes = await fs.readFile(BASE_PDF_PATH);
  const pdfDoc = await PDFDocument.load(basePdfBytes);
  const page = pdfDoc.getPage(0);
  const { width, height } = page.getSize();

  // 2) Fuente y layout
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontSize = 12;      // 🔹 un poco más pequeño que antes
  const lineHeight = 24;    // 🔹 más interlineado
  const marginLeft = 70;
  const maxTextWidth = width - marginLeft * 2;

  // 3) Datos dinámicos
  const nombre = cert.Nombre || "";
  const rut = cert.RUT || "";
  const direccion = cert.Direccion || "";
  const folio = cert.Folio || "";
  const fechaBase = cert.Fecha_Cambio || cert.Fecha_Solicitud || new Date();
  const fechaEmision = formatearFechaCorta(fechaBase);

  // ----------------------
  // ⭐ 4) FOLIO Y FECHA 
  // ----------------------

const offsetRight = 120;   // <-- puedes aumentar a 140 o 160 si lo quieres más a la derecha
const offsetDown = 28;     // <-- puedes subirlo a 30 o 40 si lo quieres más abajo

// FOLIO
const folioText = `Folio N°: ${folio}`;
const folioWidth = font.widthOfTextAtSize(folioText, fontSize);

// posición ajustada
const folioX = (width - folioWidth) / 2 + offsetRight;
const folioY = height - 175 - offsetDown;

page.drawText(folioText, {
  x: folioX,
  y: folioY,
  size: fontSize,
  font,
  color: rgb(0, 0, 0),
});

// FECHA
const fechaText = `Fecha de emisión: ${fechaEmision}`;
const fechaWidth = font.widthOfTextAtSize(fechaText, 11);
const fechaX = (width - fechaWidth) / 2 + offsetRight;
const fechaY = folioY - 22;

page.drawText(fechaText, {
  x: fechaX,
  y: fechaY,
  size: 11,
  font,
  color: rgb(0, 0, 0),
});


// ---------------------------------------------------------
// ⭐ 5) CUERPO DEL CERTIFICADO (con datos en NEGRITA)
// ---------------------------------------------------------
let cursorY = height - 290;

// 1) Texto fijo
cursorY = drawWrappedText(page, {
  text: "La directiva de la Junta de Vecinos Mirador de Volcanes 4, RUT: 65.205.436-6 de la comuna de Puerto Montt.",
  x: marginLeft,
  y: cursorY,
  maxWidth: maxTextWidth,
  lineHeight,
  font,
  size: fontSize,
});

cursorY -= 8;

// ------------------------------
// 🔹 "Certifica conocer a Don(ña): <nombre>"
// ------------------------------
const label1 = "Certifica conocer a Don(ña): ";
page.drawText(label1, {
  x: marginLeft,
  y: cursorY,
  size: fontSize,
  font,
  color: rgb(0, 0, 0),
});
page.drawText(nombre, {
  x: marginLeft + font.widthOfTextAtSize(label1, fontSize),
  y: cursorY,
  size: fontSize,
  font: fontBold,  // 👈 NEGRITA
  color: rgb(0, 0, 0),
});
cursorY -= lineHeight;

// ------------------------------
// 🔹 "Rut: <rut>"
// ------------------------------
const label2 = "Rut: ";
page.drawText(label2, {
  x: marginLeft,
  y: cursorY,
  size: fontSize,
  font,
  color: rgb(0, 0, 0),
});
page.drawText(rut, {
  x: marginLeft + font.widthOfTextAtSize(label2, fontSize),
  y: cursorY,
  size: fontSize,
  font: fontBold, // 👈 NEGRITA
  color: rgb(0, 0, 0),
});
cursorY -= lineHeight;

// ------------------------------
// 🔹 "Como residente en calle o pasaje: <dirección>"
// ------------------------------
const label3 = "Como residente en calle o pasaje: ";
page.drawText(label3, {
  x: marginLeft,
  y: cursorY,
  size: fontSize,
  font,
  color: rgb(0, 0, 0),
});
page.drawText(direccion, {
  x: marginLeft + font.widthOfTextAtSize(label3, fontSize),
  y: cursorY,
  size: fontSize,
  font: fontBold, // 👈 NEGRITA
  color: rgb(0, 0, 0),
});
cursorY -= lineHeight;

// Texto final normal
cursorY = drawWrappedText(page, {
  text: "del sector Mirador de Volcanes 4, comuna de Puerto Montt.",
  x: marginLeft,
  y: cursorY,
  maxWidth: maxTextWidth,
  lineHeight,
  font,
  size: fontSize,
});

cursorY -= 8;

cursorY = drawWrappedText(page, {
  text: "Este certificado tiene una vigencia de 30 días desde la fecha de emisión.",
  x: marginLeft,
  y: cursorY,
  maxWidth: maxTextWidth,
  lineHeight,
  font,
  size: fontSize,
});


  // ---------------------------------------------------------
  // ⭐ 6) QR — ARRIBA DERECHA, MÁS ARRIBA Y TEXTO MÁS CORTO
  // ---------------------------------------------------------
  const qrSize = 60;
  const qrMarginRight = 60;
  const qrMarginTop = 40; // 🔹 más arriba (antes 70)

  const qrX = width - qrMarginRight - qrSize;
  const qrY = height - qrMarginTop - qrSize;

  const qrText = QR_BASE_URL
    ? `${QR_BASE_URL.replace(/\/$/, "")}/certificados/${encodeURIComponent(folio)}`
    : `Certificado folio ${folio} - RUT ${rut}`;

  const qrDataUrl = await QRCode.toDataURL(qrText, { margin: 0, scale: 6 });
  const base64 = qrDataUrl.split(",")[1];
  const qrImageBytes = Buffer.from(base64, "base64");
  const qrImage = await pdfDoc.embedPng(qrImageBytes);
  const qrScaled = qrImage.scale(qrSize / qrImage.width);

  page.drawImage(qrImage, {
    x: qrX,
    y: qrY,
    width: qrScaled.width,
    height: qrScaled.height,
  });

  // Texto más corto bajo el QR
  page.drawText("qr validación", {
    x: qrX,
    y: qrY - 14,
    size: 10,
    font,
    color: rgb(0, 0, 0),
  });

  // ---------------------------------------------------------
  // ⭐ 7) Guardar PDF
  // ---------------------------------------------------------
  const pdfBytes = await pdfDoc.save();
  const fileName = `Certificado_Residencia_${folio}.pdf`;
  const filePathFs = path.join(OUTPUT_DIR, fileName);
  await fs.writeFile(filePathFs, pdfBytes);

  const filePathPublic = `/uploads/certificados/${fileName}`;

  return {
    filePathFs,
    filePathPublic,
    pdfBuffer: Buffer.from(pdfBytes),
  };
}
