// Vercel Serverless Function: JARVIS CUSPAL Presentation Generator 24/7
// Endpoint: https://store-skills.vercel.app/api/presentation
// Compatible con Make (Integromat), Telegram Bot y llamadas HTTP directas.

let _PptxGenClass = null;
async function getPptxGenClass() {
  if (!_PptxGenClass) {
    const m = await import("pptxgenjs/dist/pptxgen.cjs.js");
    _PptxGenClass = m.default || m;
  }
  return _PptxGenClass;
}

const BOT_TOKEN = "8714829831:AAEMd6h0cNM7_AZYvzjJsm8CRGZCpWK0xsI";
const ALLOWED_CHAT_ID = "1274149213";
const SUPABASE_URL = "https://tlhbpzwzqmcrutwxomqy.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRsaGJwend6cW1jcnV0d3hvbXF5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NDgzNDM2OCwiZXhwIjoyMTAwNDEwMzY4fQ.ztspOB4xrZT3IEKoOLyYDsah5thmlfbOQvBMI9aSOFc";
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || Buffer.from("c2stb3ItdjEtYzFjMzE0NTdmZWU3ZDEzNWM3N2RhZjI5Y2RiYWVkY2RhNDVlMmIxN2Y2Nzc5YTAyNjk1M2Y2NzQ4YzU3MjFmMg==", "base64").toString("utf-8");

// Paleta Institucional CUSPAL
const COLOR_BLUE_PRIMARY = "0070C0"; // Azul Institucional CUSPAL #0070C0
const COLOR_BLUE_SUBTITLE = "1F4E79"; // Azul Petróleo para subtítulos #1F4E79
const COLOR_DARK_TEXT = "262626"; // Carbón Oscuro para lectura
const COLOR_GRAY_MUTED = "595959"; // Gris elegante
const COLOR_BG_ALT_ROW = "F2F4F8"; // Fondo fila alternada en tablas
const COLOR_BORDER_TABLE = "D9D9D9"; // Borde sutil tabla

/**
 * Parsea texto con negritas (**texto**) y genera runs para pptxgenjs
 */
function parseBoldRuns(text, baseSize = 14, baseColor = COLOR_DARK_TEXT) {
  if (!text.includes("**")) {
    return [{ text: text, options: { fontSize: baseSize, color: baseColor } }];
  }

  const parts = text.split(/(\*\*.*?\*\*)/g);
  const runs = [];

  for (const part of parts) {
    if (!part) continue;
    if (part.startsWith("**") && part.endsWith("**")) {
      runs.push({
        text: part.slice(2, -2),
        options: { bold: true, fontSize: baseSize, color: baseColor }
      });
    } else {
      runs.push({
        text: part,
        options: { bold: false, fontSize: baseSize, color: baseColor }
      });
    }
  }

  return runs;
}

/**
 * Genera el archivo PPTX utilizando la identidad visual oficial de CUSPAL
 */
export async function buildCuspalPresentation(data) {
  const PptxGen = await getPptxGenClass();
  const pres = new PptxGen();
  pres.layout = "LAYOUT_16x9";
  pres.title = data.title || "Presentación Ejecutiva CUSPAL";
  pres.company = "CUSPAL / Ministerio del Poder Popular para la Alimentación";

  const title = (data.title || "BALANCE ESTRATÉGICO INSTITUCIONAL").toUpperCase();
  const subtitle = data.subtitle || "Informe de Gestión y Operaciones";
  const vicepresidencia = (data.vicepresidencia || "VICEPRESIDENCIA DE LOGÍSTICA Y OPERACIONES").toUpperCase();
  const presentador = data.presentador || "CN IGNACIO FERNANDEZ MORA\nVICEPRESIDENTE";
  const slides = Array.isArray(data.slides) && data.slides.length > 0 ? data.slides : [
    {
      title: "Objetivo y Diagnóstico General",
      subtitle: "Situación Inicial Operativa",
      items: [
        "**Capacidad Operativa:** Evaluación integral del sistema de almacenamiento.",
        "**Nivel de Almacenamiento:** Monitoreo permanente de inventarios estratégicos.",
        "**Plan de Contingencia:** Medidas preventivas y correctivas en ejecución."
      ]
    }
  ];

  const today = new Date();
  const dateFormatted = today.toLocaleDateString("es-VE", {
    day: "2-digit",
    month: "long",
    year: "numeric"
  });

  // =========================================================================
  // LÁMINA 1: PORTADA INSTITUCIONAL CUSPAL
  // =========================================================================
  const slidePortada = pres.addSlide();
  slidePortada.background = { color: "FFFFFF" };

  // Cintillo superior azul institucional CUSPAL
  slidePortada.addShape(pres.ShapeType.rect, {
    x: 0,
    y: 0,
    w: "100%",
    h: 0.15,
    fill: { color: COLOR_BLUE_PRIMARY }
  });

  // Membrete Superior Izquierdo
  slidePortada.addText([
    { text: "REPÚBLICA BOLIVARIANA DE VENEZUELA\n", options: { bold: true, fontSize: 8.5, color: COLOR_GRAY_MUTED } },
    { text: "MINISTERIO DEL PODER POPULAR PARA LA ALIMENTACIÓN\n", options: { bold: true, fontSize: 8.5, color: COLOR_GRAY_MUTED } },
    { text: "CORPORACIÓN ÚNICA DE SERVICIOS PRODUCTIVOS Y ALIMENTARIOS C.A. (CUSPAL)", options: { bold: true, fontSize: 8.5, color: COLOR_BLUE_PRIMARY } }
  ], {
    x: 0.8,
    y: 0.4,
    w: 8.5,
    h: 0.8,
    align: "left",
    fontFace: "Inter",
    lineSpacingMultiple: 1.15
  });

  // Cintillo de Vicepresidencia Superior Derecho
  slidePortada.addText(vicepresidencia, {
    x: 7.5,
    y: 0.4,
    w: 5.0,
    h: 0.8,
    align: "right",
    fontFace: "Inter",
    fontSize: 9.5,
    bold: true,
    color: COLOR_BLUE_PRIMARY
  });

  // Línea divisoria sutil
  slidePortada.addShape(pres.ShapeType.line, {
    x: 0.8,
    y: 1.3,
    w: 11.7,
    h: 0,
    line: { color: COLOR_BORDER_TABLE, width: 1 }
  });

  // Título Principal
  slidePortada.addText(title, {
    x: 0.8,
    y: 2.2,
    w: 11.7,
    h: 1.8,
    align: "left",
    fontFace: "Inter",
    fontSize: 32,
    bold: true,
    color: COLOR_BLUE_PRIMARY,
    lineSpacingMultiple: 1.1
  });

  // Subtítulo
  slidePortada.addText(subtitle, {
    x: 0.8,
    y: 4.1,
    w: 11.7,
    h: 0.8,
    align: "left",
    fontFace: "Inter",
    fontSize: 18,
    bold: true,
    color: COLOR_BLUE_SUBTITLE
  });

  // Barra de acento decorativa
  slidePortada.addShape(pres.ShapeType.rect, {
    x: 0.8,
    y: 5.0,
    w: 2.5,
    h: 0.08,
    fill: { color: COLOR_BLUE_PRIMARY }
  });

  // Datos del Presentador y Fecha (Abajo)
  slidePortada.addText([
    { text: `${presentador}\n`, options: { bold: true, fontSize: 11, color: COLOR_DARK_TEXT } },
    { text: `${dateFormatted} | Caracas, Venezuela`, options: { fontSize: 10, color: COLOR_GRAY_MUTED } }
  ], {
    x: 0.8,
    y: 5.4,
    w: 8.0,
    h: 1.2,
    align: "left",
    fontFace: "Inter",
    lineSpacingMultiple: 1.2
  });

  // Cintillo inferior azul
  slidePortada.addShape(pres.ShapeType.rect, {
    x: 0,
    y: 7.35,
    w: "100%",
    h: 0.15,
    fill: { color: COLOR_BLUE_PRIMARY }
  });

  // =========================================================================
  // LÁMINAS DE CONTENIDO (DINÁMICAS: 5, 6, 10 O MÁS)
  // =========================================================================
  slides.forEach((slideData, idx) => {
    const s = pres.addSlide();
    s.background = { color: "FFFFFF" };

    // Cintillo superior azul
    s.addShape(pres.ShapeType.rect, {
      x: 0,
      y: 0,
      w: "100%",
      h: 0.12,
      fill: { color: COLOR_BLUE_PRIMARY }
    });

    // Membrete Superior Izquierdo Reducido
    s.addText("CUSPAL • MINISTERIO DEL PODER POPULAR PARA LA ALIMENTACIÓN", {
      x: 0.8,
      y: 0.25,
      w: 7.0,
      h: 0.35,
      align: "left",
      fontFace: "Inter",
      fontSize: 8,
      bold: true,
      color: COLOR_GRAY_MUTED
    });

    // Vicepresidencia Superior Derecha
    s.addText(vicepresidencia, {
      x: 7.5,
      y: 0.25,
      w: 5.0,
      h: 0.35,
      align: "right",
      fontFace: "Inter",
      fontSize: 8,
      bold: true,
      color: COLOR_BLUE_PRIMARY
    });

    // Línea divisoria superior
    s.addShape(pres.ShapeType.line, {
      x: 0.8,
      y: 0.65,
      w: 11.7,
      h: 0,
      line: { color: COLOR_BORDER_TABLE, width: 0.75 }
    });

    // Título de la Lámina
    s.addText(slideData.title || `Lámina ${idx + 1}`, {
      x: 0.8,
      y: 0.8,
      w: 11.7,
      h: 0.6,
      align: "left",
      fontFace: "Inter",
      fontSize: 22,
      bold: true,
      color: COLOR_BLUE_PRIMARY
    });

    let currentY = 1.45;

    // Subtítulo / Subíndice personalizado de la lámina (### ...)
    if (slideData.subtitle && slideData.subtitle.trim()) {
      s.addText(slideData.subtitle.trim(), {
        x: 0.8,
        y: currentY,
        w: 11.7,
        h: 0.4,
        align: "left",
        fontFace: "Inter",
        fontSize: 14,
        bold: true,
        color: COLOR_BLUE_SUBTITLE
      });
      currentY += 0.45;
    }

    // A. Si tiene Tabla
    if (Array.isArray(slideData.table) && slideData.table.length > 0) {
      const rows = slideData.table.map((row, rIdx) => {
        return row.map((cell) => {
          const isHeader = rIdx === 0;
          return {
            text: String(cell),
            options: {
              bold: isHeader,
              fontSize: isHeader ? 11 : 10,
              fontFace: "Inter",
              color: isHeader ? "FFFFFF" : COLOR_DARK_TEXT,
              fill: { color: isHeader ? COLOR_BLUE_PRIMARY : (rIdx % 2 === 0 ? "FFFFFF" : COLOR_BG_ALT_ROW) },
              align: isHeader ? "center" : "left",
              valign: "middle"
            }
          };
        });
      });

      s.addTable(rows, {
        x: 0.8,
        y: currentY,
        w: 11.7,
        border: { pt: 0.5, color: COLOR_BORDER_TABLE },
        autoPage: false
      });
    }
    // B. Si tiene Lista de Viñetas / Párrafos
    else if (Array.isArray(slideData.items) && slideData.items.length > 0) {
      const textBlock = [];
      slideData.items.forEach((item) => {
        const runs = parseBoldRuns(item, 13.5, COLOR_DARK_TEXT);
        runs.forEach((r, rIndex) => {
          textBlock.push({
            text: r.text,
            options: {
              bullet: rIndex === 0 ? { type: "bullet", code: "2022" } : false,
              bold: r.options.bold,
              fontSize: r.options.fontSize,
              color: r.options.color,
              fontFace: "Inter",
              lineSpacingMultiple: 1.25,
              paraSpaceAfter: 12
            }
          });
        });
      });

      s.addText(textBlock, {
        x: 0.8,
        y: currentY,
        w: 11.7,
        h: 4.8,
        align: "left",
        valign: "top"
      });
    }

    // Pie de página con número de lámina
    s.addText(`Lámina ${idx + 2} de ${slides.length + 2} • CUSPAL Gestión Estratégica`, {
      x: 0.8,
      y: 7.0,
      w: 11.7,
      h: 0.3,
      align: "right",
      fontFace: "Inter",
      fontSize: 8.5,
      color: COLOR_GRAY_MUTED
    });
  });

  // =========================================================================
  // LÁMINA FINAL: CIERRE INSTITUCIONAL
  // =========================================================================
  const slideCierre = pres.addSlide();
  slideCierre.background = { color: "FFFFFF" };

  // Cintillo superior azul
  slideCierre.addShape(pres.ShapeType.rect, {
    x: 0,
    y: 0,
    w: "100%",
    h: 0.15,
    fill: { color: COLOR_BLUE_PRIMARY }
  });

  slideCierre.addText("¡PRODUCIR ES VENCER!", {
    x: 0.8,
    y: 2.5,
    w: 11.7,
    h: 1.0,
    align: "center",
    fontFace: "Inter",
    fontSize: 34,
    bold: true,
    color: COLOR_BLUE_PRIMARY
  });

  slideCierre.addText("Gracias…", {
    x: 0.8,
    y: 3.6,
    w: 11.7,
    h: 0.8,
    align: "center",
    fontFace: "Inter",
    fontSize: 22,
    bold: true,
    color: COLOR_BLUE_SUBTITLE
  });

  slideCierre.addShape(pres.ShapeType.rect, {
    x: 5.4,
    y: 4.5,
    w: 2.5,
    h: 0.08,
    fill: { color: COLOR_BLUE_PRIMARY }
  });

  slideCierre.addText([
    { text: "CUSPAL - CORPORACIÓN ÚNICA DE SERVICIOS PRODUCTIVOS Y ALIMENTARIOS C.A.\n", options: { bold: true, fontSize: 11, color: COLOR_DARK_TEXT } },
    { text: `${vicepresidencia}\n`, options: { fontSize: 10, color: COLOR_GRAY_MUTED } },
    { text: `${presentador}`, options: { bold: true, fontSize: 10, color: COLOR_BLUE_PRIMARY } }
  ], {
    x: 0.8,
    y: 4.9,
    w: 11.7,
    h: 1.2,
    align: "center",
    fontFace: "Inter",
    lineSpacingMultiple: 1.2
  });

  // Cintillo inferior azul
  slideCierre.addShape(pres.ShapeType.rect, {
    x: 0,
    y: 7.35,
    w: "100%",
    h: 0.15,
    fill: { color: COLOR_BLUE_PRIMARY }
  });

  // Generar Buffer Node.js
  const buffer = await pres.write({ outputType: "nodebuffer" });
  return buffer;
}

/**
 * Enviar archivo binario directamente a Telegram como Documento
 */
async function sendTelegramDocument(chatId, buffer, filename, caption = "") {
  try {
    const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendDocument`;
    const formData = new FormData();
    const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.presentationml.presentation" });
    
    formData.append("chat_id", chatId);
    formData.append("document", blob, filename);
    if (caption) {
      formData.append("caption", caption);
      formData.append("parse_mode", "Markdown");
    }

    const res = await fetch(url, {
      method: "POST",
      body: formData
    });

    if (!res.ok) {
      const errTxt = await res.text();
      console.error("Error enviando documento a Telegram:", errTxt);
      return false;
    }
    return true;
  } catch (err) {
    console.error("Excepción enviando documento a Telegram:", err);
    return false;
  }
}

/**
 * Sube el archivo PPTX generado a Supabase Storage (nexus_buffer/presentations/)
 */
async function uploadPptxToSupabase(filename, buffer) {
  try {
    const uploadUrl = `${SUPABASE_URL}/storage/v1/object/nexus_buffer/presentations/${filename}`;
    const res = await fetch(uploadUrl, {
      method: "POST",
      headers: {
        "apikey": SUPABASE_SERVICE_ROLE_KEY,
        "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        "Content-Type": "application/vnd.openxmlformats-officedocument.presentationml.presentation"
      },
      body: buffer
    });
    if (res.ok) {
      return `${SUPABASE_URL}/storage/v1/object/public/nexus_buffer/presentations/${filename}`;
    }
  } catch (e) {
    console.error("Error subiendo PPTX a Supabase:", e);
  }
  return null;
}

/**
 * Notificar al daemon local mediante Supabase buffer
 */
async function registerInSupabaseBuffer(filename, data) {
  try {
    const uploadUrl = `${SUPABASE_URL}/storage/v1/object/nexus_buffer/pending/${filename}`;
    await fetch(uploadUrl, {
      method: "POST",
      headers: {
        "apikey": SUPABASE_SERVICE_ROLE_KEY,
        "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(data)
    });
  } catch (e) {
    console.error("Error registrando en buffer Supabase:", e);
  }
}

export default async function handler(req, res) {
  // Configuración de CORS
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS,PATCH,DELETE,POST,PUT");
  res.setHeader("Access-Control-Allow-Headers", "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(200).json({
      status: "online",
      service: "JARVIS CUSPAL Presentation Generator 24/7",
      docs: "Envía un POST con { title, subtitle, vicepresidencia, presentador, slides } para compilar y despachar el PPTX.",
      timestamp: new Date().toISOString()
    });
  }

  try {
    const body = req.body || {};
    let presentationData = body.presentation || body;
    const targetChatId = String(body.chat_id || ALLOWED_CHAT_ID);

    // Si viene solo un prompt en texto crudo o voz transcrita sin estructurar:
    if (body.raw_text && (!presentationData.slides || presentationData.slides.length === 0)) {
      // Estructurar con IA si es necesario
      const aiPrompt = 
        `Transforma la siguiente solicitud en una estructura de presentación ejecutiva formal para CUSPAL en JSON.\n` +
        `Solicitud: "${body.raw_text}"\n\n` +
        `Responde ÚNICAMENTE con un JSON válido con esta estructura:\n` +
        `{\n` +
        `  "title": "TÍTULO INSTITUCIONAL",\n` +
        `  "subtitle": "Subtítulo descriptivo",\n` +
        `  "vicepresidencia": "VICEPRESIDENCIA DE LOGÍSTICA Y OPERACIONES",\n` +
        `  "presentador": "CN IGNACIO FERNANDEZ MORA\\nVICEPRESIDENTE",\n` +
        `  "slides": [\n` +
        `    { "title": "Título Lámina", "subtitle": "Subtítulo Opcional", "items": ["**Punto 1:** detalle", "**Punto 2:** detalle"] }\n` +
        `  ]\n` +
        `}`;

      try {
        const aiRes = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            model: "minimax/minimax-m3:free",
            messages: [{ role: "user", content: aiPrompt }]
          })
        });
        if (aiRes.ok) {
          const aiJson = await aiRes.json();
          const content = aiJson.choices?.[0]?.message?.content || "";
          const match = content.match(/\{[\s\S]*\}/);
          if (match) {
            presentationData = JSON.parse(match[0]);
          }
        }
      } catch (aiErr) {
        console.warn("Falla estructurando con IA:", aiErr);
      }
    }

    // 1. Compilar el archivo PPTX en memoria
    const pptxBuffer = await buildCuspalPresentation(presentationData);

    const safeTitle = (presentationData.title || "Presentacion_CUSPAL")
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-zA-Z0-9_\-]/g, "_")
      .substring(0, 35);
    const dateStr = new Date().toISOString().split("T")[0];
    const filename = `${safeTitle}_${dateStr}.pptx`;

    // 2. Subir a Supabase Storage para enlace público
    const downloadUrl = await uploadPptxToSupabase(filename, pptxBuffer);

    // 3. Notificar al buffer de Supabase para que la laptop también guarde copia local
    const ts = Date.now();
    await registerInSupabaseBuffer(`req_presentation_${ts}.json`, {
      type: "presentation_generated",
      title: presentationData.title,
      filename: filename,
      download_url: downloadUrl,
      slides_count: presentationData.slides ? presentationData.slides.length : 0,
      timestamp: ts
    });

    // 4. Enviar a Telegram directamente
    const slideCount = (presentationData.slides ? presentationData.slides.length : 0) + 2;
    const caption = 
      `📊 *PRESENTACIÓN EJECUTIVA CUSPAL GENERADA CON ÉXITO*\n\n` +
      `📁 *Documento:* \`${filename}\`\n` +
      `📌 *Título:* ${presentationData.title || "Presentación Institucional"}\n` +
      `📑 *Total Láminas:* ${slideCount} (Portada + ${slideCount - 2} Contenido + Cierre)\n` +
      `🏛️ *Identidad Visual:* Plantilla Oficial CUSPAL / MINAL ✅\n\n` +
      `_Compilado 24/7 en la nube para el Comandante Gonzalo Lucena._`;

    const deliveredTg = await sendTelegramDocument(targetChatId, pptxBuffer, filename, caption);

    return res.status(200).json({
      ok: true,
      status: "completed",
      filename: filename,
      slides_count: slideCount,
      download_url: downloadUrl,
      delivered_telegram: deliveredTg,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error("Error en presentación endpoint:", error);
    return res.status(500).json({ ok: false, error: error.message });
  }
}
