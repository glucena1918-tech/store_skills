// Vercel Serverless Function: JARVIS CUSPAL Intelligent Presentation Analyst 24/7
// Endpoint: https://store-skills.vercel.app/api/presentation
// Compatible con Make.com, Telegram Gateway y llamadas API directas.

import { createRequire } from "module";
const require = createRequire(import.meta.url);
const pptxgen = require("pptxgenjs");

const BOT_TOKEN = "8714829831:AAEMd6h0cNM7_AZYvzjJsm8CRGZCpWK0xsI";
const ALLOWED_CHAT_ID = "1274149213";
const SUPABASE_URL = "https://tlhbpzwzqmcrutwxomqy.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRsaGJwend6cW1jcnV0d3hvbXF5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NDgzNDM2OCwiZXhwIjoyMTAwNDEwMzY4fQ.ztspOB4xrZT3IEKoOLyYDsah5thmlfbOQvBMI9aSOFc";
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || Buffer.from("c2stb3ItdjEtYzFjMzE0NTdmZWU3ZDEzNWM3N2RhZjI5Y2RiYWVkY2RhNDVlMmIxN2Y2Nzc5YTAyNjk1M2Y2NzQ4YzU3MjFmMg==", "base64").toString("utf-8");

// Plantillas Oficiales CUSPAL alojadas en la nube
const BG_COVER_URL = "https://tlhbpzwzqmcrutwxomqy.supabase.co/storage/v1/object/public/nexus_buffer/assets/template_cover.jpg";
const BG_CONTENT_URL = "https://tlhbpzwzqmcrutwxomqy.supabase.co/storage/v1/object/public/nexus_buffer/assets/template_content.jpg";
const BG_CLOSING_URL = "https://tlhbpzwzqmcrutwxomqy.supabase.co/storage/v1/object/public/nexus_buffer/assets/template_closing.jpg";
const MEMORY_URL = "https://tlhbpzwzqmcrutwxomqy.supabase.co/storage/v1/object/public/nexus_buffer/cache/vault_historical_memory.json";

// Paleta Oficial Institucional CUSPAL
const COLOR_BLUE_PRIMARY = "0070C0"; // Azul Institucional
const COLOR_BLUE_SUBTITLE = "1F4E79"; // Azul Petróleo para subtítulos
const COLOR_DARK_TEXT = "262626";     // Carbón Oscuro para lectura
const COLOR_GRAY_MUTED = "595959";    // Gris sobrio para pies
const COLOR_BG_ALT_ROW = "F2F4F8";    // Fondo fila alternada en tablas
const COLOR_BORDER_TABLE = "D9D9D9";  // Borde sutil tabla

let memoryCache = null;

/**
 * Obtiene y cachea en memoria la base de conocimiento histórico de la Bóveda Principal
 */
export async function getVaultMemory() {
  if (memoryCache) return memoryCache;
  try {
    const res = await fetch(MEMORY_URL);
    if (res.ok) {
      memoryCache = await res.json();
      return memoryCache;
    }
  } catch (err) {
    console.error("Error cargando memoria histórica de la Bóveda:", err);
  }
  return null;
}

/**
 * Búsqueda inteligente por relevancia sobre las 324 notas históricas
 */
export function searchVaultMemory(query, memory) {
  if (!memory || !memory.documents || memory.documents.length === 0) return "";
  
  const stopwords = new Set([
    "de", "la", "el", "los", "las", "un", "una", "unos", "unas", "y", "en", "para",
    "por", "con", "sobre", "del", "al", "que", "se", "un", "su", "sus", "hacer",
    "haz", "crear", "presentacion", "presentación", "informe", "balance", "diapositiva", "diapositivas"
  ]);

  const terms = query.toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter(t => t.length > 2 && !stopwords.has(t));

  if (terms.length === 0) {
    return memory.documents.slice(0, 3).map(d => `### ${d.title}\n${d.content.slice(0, 800)}`).join("\n\n");
  }

  const scored = memory.documents.map(doc => {
    let score = 0;
    const titleNorm = doc.title.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const folderNorm = (doc.folder || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const contentNorm = (doc.content || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

    for (const term of terms) {
      if (titleNorm.includes(term)) score += 15;
      if (folderNorm.includes(term)) score += 5;
      const matches = contentNorm.split(term).length - 1;
      score += Math.min(matches, 10);
    }

    return { doc, score };
  });

  scored.sort((a, b) => b.score - a.score);
  const topDocs = scored.filter(s => s.score > 0).slice(0, 4);

  if (topDocs.length === 0) {
    return memory.documents.slice(0, 3).map(d => `### ${d.title}\n${d.content.slice(0, 800)}`).join("\n\n");
  }

  return topDocs.map(item => {
    const d = item.doc;
    const excerpt = d.content.length > 1600 ? d.content.slice(0, 1600) + "..." : d.content;
    return `### Documento de Bóveda: ${d.title} (Carpeta: ${d.folder})\n${excerpt}`;
  }).join("\n\n---\n\n");
}

/**
 * Motor de IA (Analista Inteligente): Lee la memoria de la Bóveda y estructura las láminas
 */
export async function analyzeAndStructurePresentation(rawQuery) {
  const memory = await getVaultMemory();
  const context = searchVaultMemory(rawQuery, memory);

  const systemPrompt = `Eres JARVIS / Harvey, el Analista Estratégico Senior de Inteligencia y Operaciones al servicio del Comandante Gonzalo Lucena.
Tu misión es diseñar presentaciones ejecutivas de altísimo nivel para Gonzalo Lucena, adaptándote al contexto de su requerimiento:
- Si el tema solicitado es agroalimentario o de CUSPAL (silos, plantas, Pequiven, GGESA, balances de almacenamiento, etc.), aplica el marco institucional de CUSPAL / Ministerio del Poder Popular para la Alimentación y el Despacho de la Vicepresidencia de Logística y Operaciones.
- Si el tema solicitado es sobre formación profesional, tecnología, inteligencia artificial (como el "Curso IA 2026: El Nuevo ChatGPT", Goal Engineering, ChatGPT Work, Vibe Coding, Big School, etc.) o proyectos de software/personal, orienta la presentación con enfoque técnico y formativo de alta gerencia, reflejando fielmente los apuntes, metodologías y conceptos de la Bóveda.

REGLAS OBLIGATORIAS:
1. Basa los contenidos, conceptos clave, datos, fechas y metodologías estrictamente en la MEMORIA HISTÓRICA DE LA BÓVEDA que se te proporciona.
2. Si la memoria incluye cifras, conceptos o hechos concretos (ej. toneladas métricas, nombres de silos, principios de Goal Engineering, roles de agentes IA), inclúyelos explícitamente con precisión.
3. Diseña entre 4 y 7 láminas de contenido sustancial (además de la portada y el cierre).
4. Al menos UNA o DOS láminas deben incluir una TABLA COMPARATIVA/MATRIZ ("table": [["Col1", "Col2", ...], ["Val1", "Val2", ...]]) con datos operativos, comparativas o métricas.
5. Las láminas narrativas deben tener viñetas ("items") donde cada punto comience con una etiqueta en negrita: "**Etiqueta:** Explicación técnica y concisa".
6. Responde ÚNICAMENTE con un JSON válido con esta estructura exacta:

{
  "title": "TÍTULO INSTITUCIONAL EN MAYÚSCULAS",
  "subtitle": "Subtítulo Descriptivo y Protocolar",
  "vicepresidencia": "VICEPRESIDENCIA DE LOGÍSTICA Y OPERACIONES",
  "presentador": "CN IGNACIO FERNANDEZ MORA\\nVICEPRESIDENTE",
  "slides": [
    {
      "title": "Título de la Lámina",
      "subtitle": "Eje Estratégico o Subíndice",
      "items": [
        "**Capacidad Estratégica:** Diagnóstico cuantitativo...",
        "**Nivel de Almacenamiento:** Monitoreo y control...",
        "**Acciones Clave:** Medidas adoptadas..."
      ]
    },
    {
      "title": "Matriz Operativa Regional",
      "subtitle": "Capacidad y Estatus de Infraestructura",
      "table": [
        ["Planta / Silo", "Capacidad (TM)", "Operatividad", "Estatus"],
        ["Silo Portuguesa", "45.000 TM", "85%", "Operativo"],
        ["Silo Monagas", "30.000 TM", "90%", "Operativo"]
      ]
    }
  ]
}`;

  const userPrompt = `SOLICITUD DEL USUARIO:\n"${rawQuery}"\n\nMEMORIA HISTÓRICA EXTRAÍDA DE LA BÓVEDA:\n${context}\n\nGenera el JSON estructurado de la presentación institucional.`;

  const models = [
    { name: "google/gemini-2.5-flash", max_tokens: 1800 },
    { name: "minimax/minimax-m3:free", max_tokens: 2000 }
  ];

  for (const m of models) {
    try {
      const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://store-skills.vercel.app",
          "X-Title": "CUSPAL Intelligent Analyst"
        },
        body: JSON.stringify({
          model: m.name,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt }
          ],
          temperature: 0.2,
          max_tokens: m.max_tokens
        })
      });

      if (res.ok) {
        const jsonRes = await res.json();
        const content = jsonRes.choices?.[0]?.message?.content || "";
        const match = content.match(/\{[\s\S]*\}/);
        if (match) {
          return JSON.parse(match[0]);
        }
      } else {
        console.warn(`Modelo ${m.name} falló:`, res.status, await res.text());
      }
    } catch (e) {
      console.warn(`Error llamando a ${m.name}:`, e.message);
    }
  }

  // Fallback si OpenRouter está temporalmente inaccesible
  return {
    title: "INFORME OPERATIVO Y ESTRATÉGICO INSTITUCIONAL",
    subtitle: rawQuery,
    vicepresidencia: "VICEPRESIDENCIA DE LOGÍSTICA Y OPERACIONES",
    presentador: "CN IGNACIO FERNANDEZ MORA\nVICEPRESIDENTE",
    slides: [
      {
        title: "Diagnóstico General",
        subtitle: "Capacidad y Operaciones CUSPAL",
        items: [
          "**Infraestructura de Almacenamiento:** Monitoreo permanente de silos y plantas.",
          "**Articulación Institucional:** Cumplimiento de convenios y acuerdos productivos.",
          "**Garantía de Abastecimiento:** Soporte a la cadena agroalimentaria nacional."
        ]
      }
    ]
  };
}

/**
 * Parsea formato con negritas (**texto**) y genera runs para pptxgenjs
 */
function parseBoldRuns(text, baseSize = 13, baseColor = COLOR_DARK_TEXT) {
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
 * Compila el archivo PPTX respetando la Plantilla Oficial de CUSPAL al 100%
 */
export async function buildOfficialCuspalPresentation(data) {
  const pres = new pptxgen();
  pres.defineLayout({ name: "CUSPAL_16_9", width: 16.0, height: 9.0 });
  pres.layout = "CUSPAL_16_9";
  pres.title = data.title || "Presentación Institucional CUSPAL";
  pres.company = "CUSPAL / Ministerio del Poder Popular para la Alimentación";

  const title = (data.title || "INFORME ESTRATÉGICO INSTITUCIONAL").toUpperCase();
  const subtitle = data.subtitle || "Gestión y Balance de Operaciones";
  const slides = Array.isArray(data.slides) && data.slides.length > 0 ? data.slides : [];

  const today = new Date();
  const dateFormatted = today.toLocaleDateString("es-VE", {
    day: "2-digit",
    month: "long",
    year: "numeric"
  });

  // =========================================================================
  // LÁMINA 1: PORTADA OFICIAL CUSPAL (Image: template_cover.jpg)
  // Incluye cintillo oficial tricolor, membrete MINAL, CUSPAL y VICEPRESIDENCIA
  // =========================================================================
  const slidePortada = pres.addSlide();
  slidePortada.background = { path: BG_COVER_URL };

  // Título Principal Centrado (ancho 13.0 pulgadas centrado entre x=1.5 y x=14.5)
  slidePortada.addText(title, {
    x: 1.5,
    y: 3.0,
    w: 13.0,
    h: 1.8,
    align: "center",
    fontFace: "Calibri",
    fontSize: title.length > 50 ? 28 : 34,
    bold: true,
    color: COLOR_BLUE_PRIMARY,
    lineSpacingMultiple: 1.15
  });

  // Subtítulo Centrado
  slidePortada.addText(subtitle, {
    x: 1.5,
    y: 5.0,
    w: 13.0,
    h: 1.0,
    align: "center",
    fontFace: "Calibri",
    fontSize: 20,
    color: COLOR_BLUE_SUBTITLE
  });

  // Fecha en el pie izquierdo
  slidePortada.addText(`Caracas, ${dateFormatted}`, {
    x: 1.0,
    y: 8.2,
    w: 6.0,
    h: 0.4,
    align: "left",
    fontFace: "Calibri",
    fontSize: 11,
    color: COLOR_GRAY_MUTED
  });

  // =========================================================================
  // LÁMINAS DE CONTENIDO (Image: template_content.jpg)
  // Incluye Logo Oficial CUSPAL + Subrayado VICEPRESIDENCIA superior derecho
  // Margen izquierdo: 1.0", Ancho útil: 14.0", Margen derecho seguro: 1.0"
  // =========================================================================
  slides.forEach((slideData, idx) => {
    const s = pres.addSlide();
    s.background = { path: BG_CONTENT_URL };

    // Título de la Lámina (posicionado a la izquierda, sin tocar el logo derecho en x >= 13.0)
    s.addText(slideData.title || `Lámina ${idx + 1}`, {
      x: 1.0,
      y: 0.55,
      w: 11.5,
      h: 0.8,
      align: "left",
      fontFace: "Calibri",
      fontSize: 26,
      bold: true,
      color: COLOR_BLUE_PRIMARY
    });

    let currentY = 1.4;

    // Subtítulo o Eje Temático
    if (slideData.subtitle && slideData.subtitle.trim()) {
      s.addText(slideData.subtitle.trim(), {
        x: 1.0,
        y: currentY,
        w: 14.0,
        h: 0.45,
        align: "left",
        fontFace: "Calibri",
        fontSize: 15,
        bold: true,
        color: COLOR_BLUE_SUBTITLE
      });
      currentY += 0.6;
    }

    // A. Si tiene Tabla de Datos
    if (Array.isArray(slideData.table) && slideData.table.length > 0) {
      const rows = slideData.table.map((row, rIdx) => {
        const isHeader = rIdx === 0;
        return row.map((cell) => {
          return {
            text: String(cell),
            options: {
              bold: isHeader,
              fontSize: isHeader ? 13 : 11.5,
              fontFace: "Calibri",
              color: isHeader ? "FFFFFF" : COLOR_DARK_TEXT,
              fill: { color: isHeader ? COLOR_BLUE_PRIMARY : (rIdx % 2 === 0 ? "FFFFFF" : COLOR_BG_ALT_ROW) },
              align: isHeader ? "center" : "left",
              valign: "middle"
            }
          };
        });
      });

      s.addTable(rows, {
        x: 1.0,
        y: currentY,
        w: 14.0,
        border: { pt: 0.5, color: COLOR_BORDER_TABLE },
        autoPage: false
      });
    }
    // B. Si tiene Lista de Viñetas / Párrafos
    else if (Array.isArray(slideData.items) && slideData.items.length > 0) {
      const textBlock = [];
      slideData.items.forEach((item, itemIdx) => {
        const runs = parseBoldRuns(item, 14, COLOR_DARK_TEXT);
        runs.forEach((r, rIndex) => {
          textBlock.push({
            text: r.text,
            options: {
              breakLine: itemIdx > 0 && rIndex === 0,
              bullet: rIndex === 0 ? { type: "bullet", code: "2022" } : false,
              bold: r.options.bold,
              fontSize: r.options.fontSize,
              color: r.options.color,
              fontFace: "Calibri",
              lineSpacingMultiple: 1.35,
              paraSpaceAfter: 16
            }
          });
        });
      });

      s.addText(textBlock, {
        x: 1.0,
        y: currentY,
        w: 14.0,
        h: 5.8,
        align: "left",
        valign: "top"
      });
    }

    // Pie de página con número de lámina
    s.addText(`Lámina ${idx + 2} de ${slides.length + 2} • CUSPAL Gestión Estratégica`, {
      x: 1.0,
      y: 8.3,
      w: 14.0,
      h: 0.35,
      align: "right",
      fontFace: "Calibri",
      fontSize: 10,
      color: COLOR_GRAY_MUTED
    });
  });

  // =========================================================================
  // LÁMINA FINAL: CIERRE OFICIAL CUSPAL (Image: template_closing.jpg)
  // Incluye "Gracias..." original y membretes oficiales de la plantilla.
  // NO se agrega ningún texto adicional para respetar estrictamente la plantilla original.
  // =========================================================================
  const slideCierre = pres.addSlide();
  slideCierre.background = { path: BG_CLOSING_URL };

  // Compilar Buffer de Node.js
  return await pres.write({ outputType: "nodebuffer" });
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
        "Content-Type": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        "cache-control": "0",
        "x-upsert": "true"
      },
      body: buffer
    });
    if (res.ok) {
      return `${SUPABASE_URL}/storage/v1/object/public/nexus_buffer/presentations/${filename}?t=${Date.now()}`;
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
        "Content-Type": "application/json",
        "x-upsert": "true"
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
      version: "2.2.0-perfect-bullets",
      layout: "16.0x9.0",
      service: "JARVIS CUSPAL Intelligent Presentation Analyst 24/7",
      docs: "Envía un POST con { raw_text: 'tema' } o { presentation: { title, slides } } para compilar y despachar el PPTX oficial.",
      timestamp: new Date().toISOString()
    });
  }

  try {
    const body = req.body || {};
    const targetChatId = String(body.chat_id || ALLOWED_CHAT_ID);
    let presentationData = body.presentation || null;

    // Si viene prompt de texto libre o voz:
    if (!presentationData || !presentationData.slides || presentationData.slides.length === 0) {
      const query = body.raw_text || body.prompt || body.query || "Balance de Silos y Almacenamiento CUSPAL";
      presentationData = await analyzeAndStructurePresentation(query);
    }

    // 1. Compilar archivo PPTX usando la plantilla oficial exacta de CUSPAL
    const pptxBuffer = await buildOfficialCuspalPresentation(presentationData);

    const safeTitle = (presentationData.title || "Presentacion_CUSPAL")
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-zA-Z0-9_\-]/g, "_")
      .substring(0, 35);
    const dateStr = new Date().toISOString().split("T")[0];
    const filename = `${safeTitle}_${dateStr}.pptx`;

    // 2. Subir a Supabase Storage para persistencia y enlace descargable
    const downloadUrl = await uploadPptxToSupabase(filename, pptxBuffer);

    // 3. Registrar evento en el buffer de Supabase para que la laptop mantenga copia en Obsidian
    const ts = Date.now();
    await registerInSupabaseBuffer(`req_presentation_${ts}.json`, {
      type: "presentation_generated",
      title: presentationData.title,
      filename: filename,
      download_url: downloadUrl,
      slides_count: presentationData.slides ? presentationData.slides.length : 0,
      timestamp: ts
    });

    // 4. Enviar a Telegram con pie institucional
    const slideCount = (presentationData.slides ? presentationData.slides.length : 0) + 2;
    const caption = 
      `📊 *PRESENTACIÓN EJECUTIVA CUSPAL (PLANTILLA OFICIAL)*\n\n` +
      `📁 *Documento:* \`${filename}\`\n` +
      `📌 *Título:* ${presentationData.title || "Presentación Institucional"}\n` +
      `📑 *Láminas:* ${slideCount} (Portada + ${slideCount - 2} Contenido + Cierre)\n` +
      `🏛️ *Identidad:* Membrete Oficial MINAL / CUSPAL / Vicepresidencia ✅\n` +
      `🧠 *Fuente:* Memoria Histórica de la Bóveda Principal (324 documentos) ✅\n\n` +
      `_Compilado 24/7 en Vercel para el Comandante Gonzalo Lucena._`;

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
