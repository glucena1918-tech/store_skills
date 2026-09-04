// Vercel Serverless Function: JARVIS Cloud Gateway 24/7
// Endpoint: https://store-skills.vercel.app/api/telegram

const BOT_TOKEN = "8714829831:AAEMd6h0cNM7_AZYvzjJsm8CRGZCpWK0xsI";
const ALLOWED_CHAT_ID = "1274149213";
const SUPABASE_URL = "https://tlhbpzwzqmcrutwxomqy.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRsaGJwend6cW1jcnV0d3hvbXF5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NDgzNDM2OCwiZXhwIjoyMTAwNDEwMzY4fQ.ztspOB4xrZT3IEKoOLyYDsah5thmlfbOQvBMI9aSOFc";

async function sendTelegramMessage(chatId, text, replyMarkup = null) {
  try {
    const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
    const payload = {
      chat_id: chatId,
      text: text,
      parse_mode: "Markdown"
    };
    if (replyMarkup) {
      payload.reply_markup = replyMarkup;
    }
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text: text.replace(/[*_`]/g, "")
        })
      });
    }
  } catch (err) {
    console.error("Error enviando mensaje Telegram:", err);
  }
}
async function uploadToSupabaseBuffer(filename, data) {
  try {
    const uploadUrl = `${SUPABASE_URL}/storage/v1/object/nexus_buffer/pending/${filename}`;
    const res = await fetch(uploadUrl, {
      method: "POST",
      headers: {
        "apikey": SUPABASE_SERVICE_ROLE_KEY,
        "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(data)
    });
    return res.ok;
  } catch (err) {
    console.error("Error subiendo a Supabase Storage:", err);
    return false;
  }
}

function getHelpMenu(section = "main") {
  let text = "";
  let reply_markup = { inline_keyboard: [] };

  if (section === "main" || section === "help_main") {
    text = "🤖 *CENTRO DE MANDO JARVIS*\n\nElige una categoría de comandos:";
    reply_markup.inline_keyboard = [
      [{ text: "📅 Agenda & Calendario", callback_data: "help_calendar" },
       { text: "📋 Tareas & Obsidian", callback_data: "help_tasks" }],
      [{ text: "📧 Correo (Gmail)", callback_data: "help_mail" },
       { text: "📄 Gestión Documento", callback_data: "help_docs" }],
      [{ text: "🤖 IA & Utilidades", callback_data: "help_utils" },
       { text: "⚙️ Configuración (Voz)", callback_data: "help_config" }]
    ];
  } else if (section === "help_calendar") {
    text = "📅 *Google Calendar & Obsidian*\n\n• `Calendario` — Ver eventos\n• `Agenda: [Título], [Fecha], [Inicio], [Fin], [Lugar]` — Agendar en Calendar y Obsidian\n• `Evento: [Texto]` — Agendar en Obsidian (o Calendar)\n• `Borrar evento [N]` — Eliminar\n• `Editar evento [N]: [Datos]`";
    reply_markup.inline_keyboard = [[{ text: "🔙 Volver", callback_data: "help_main" }]];
  } else if (section === "help_tasks") {
    text = "📋 *Gestión de Tareas y Notas*\n\n• `Tareas` — Pendientes de hoy\n• `Check [N]` — Completar tarea\n• `Tarea: [texto]` — Agregar tarea\n• `Nota: [texto]` — Guardar nota rápida\n• `Recordatorio: [HH:MM] [Texto]` — Alarma en Laptop";
    reply_markup.inline_keyboard = [[{ text: "🔙 Volver", callback_data: "help_main" }]];
  } else if (section === "help_mail") {
    text = "📧 *Gestión de Correos (Gmail)*\n\n• `Enviar email: [Para], [Asunto], [Cuerpo]` — Enviar\n• `Borrador: [Asunto], [Cuerpo]` — Crear borrador\n• `Email` — Ver no leídos\n• `Resumen` — Últimos correos";
    reply_markup.inline_keyboard = [[{ text: "🔙 Volver", callback_data: "help_main" }]];
  } else if (section === "help_docs") {
    text = "📄 *Documentos & Visión*\n\n• `Memo: Destinatario | Asunto | Cuerpo`\n• `Oficio: Destinatario | Cargo | Cuerpo`\n• Enviar archivo `.PDF` — Extrae texto, resume y archiva\n• Enviar foto — Digitalización y ficha con IA";
    reply_markup.inline_keyboard = [[{ text: "🔙 Volver", callback_data: "help_main" }]];
  } else if (section === "help_utils") {
    text = "🤖 *IA y Utilidades*\n\n• `IA: [pregunta]` — Consultar IA local (Ollama)\n• `BCV` — Tasa oficial de cambio\n• `Status` — Diagnóstico del sistema";
    reply_markup.inline_keyboard = [[{ text: "🔙 Volver", callback_data: "help_main" }]];
  } else if (section === "help_config") {
    text = "⚙️ *Configuración de Sistema*\n\n• `Voz on` / `Voz off` — Respuestas habladas\n• `Voz Paola` — Configurar voz femenina\n• `Voz David` — Configurar voz masculina";
    reply_markup.inline_keyboard = [[{ text: "🔙 Volver", callback_data: "help_main" }]];
  }

  return { text, reply_markup };
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(200).json({
      status: "online",
      service: "JARVIS / NEXUS Cloud Gateway 24/7",
      timestamp: new Date().toISOString()
    });
  }

  try {
    const update = req.body;
    if (!update) {
      return res.status(200).json({ ok: true, ignored: "no_update" });
    }

    if (update.callback_query) {
      const cb = update.callback_query;
      const cbChatId = String(cb.message.chat.id);
      const cbMsgId = cb.message.message_id;
      const data = cb.data;

      if (cbChatId !== ALLOWED_CHAT_ID) {
        return res.status(200).json({ ok: true, ignored: "unauthorized" });
      }

      await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/answerCallbackQuery`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ callback_query_id: cb.id })
      });

      if (data.startsWith("help_")) {
        const { text, reply_markup } = getHelpMenu(data);
        await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/editMessageText`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: cbChatId,
            message_id: cbMsgId,
            text: text,
            parse_mode: "Markdown",
            reply_markup: reply_markup
          })
        });
      }

      return res.status(200).json({ ok: true, handled: "callback_query" });
    }

    if (!update.message) {
      return res.status(200).json({ ok: true, ignored: "no_message" });
    }

    const msg = update.message;
    const chatId = String(msg.chat ? msg.chat.id : "");
    const text = (msg.text || "").trim();
    const msgId = msg.message_id;

    if (chatId !== ALLOWED_CHAT_ID) {
      console.warn(`Intento no autorizado de chat_id: ${chatId}`);
      return res.status(200).json({ ok: true, ignored: "unauthorized" });
    }

    if (!text) {
      return res.status(200).json({ ok: true, ignored: "empty_text" });
    }

    const lower = text.toLowerCase();

    // 1. Comando: Status / Estado
    if (lower === "status" || lower === "/status" || lower === "estado" || lower === "/estado") {
      const statusMsg = 
        "⚡ *JARVIS CLOUD GATEWAY (24/7 ACTIVO)*\n\n" +
        "🌐 *Modo:* Nube Autónoma (Independencia total de laptop)\n" +
        "☁️ *Buffer Nube:* Supabase Storage (`nexus_buffer`) Operativo ✅\n" +
        "🔒 *Seguridad:* Autenticado para Gonzalo Lucena ✅\n" +
        "💻 *Sincronización Local:* Activa.\n\n" +
        "📡 _Solicitando telemetría de hardware a la Laptop. Si está encendida, responderá en unos segundos..._";
      await sendTelegramMessage(chatId, statusMsg);

      const ts = Date.now();
      await uploadToSupabaseBuffer(`req_${ts}.json`, {
        type: "status_request",
        content: "Solicitud de estado de hardware",
        timestamp: ts
      });

      return res.status(200).json({ ok: true, handled: "status" });
    }

    // 2. Comando: Ayuda / Start
    if (lower === "start" || lower === "/start" || lower === "ayuda" || lower === "/ayuda" || lower === "help" || lower === "/help") {
      const { text: helpMsg, reply_markup: rm } = getHelpMenu("main");
      await sendTelegramMessage(chatId, helpMsg, rm);
      return res.status(200).json({ ok: true, handled: "help" });
    }

    // 3. Identificación y Clasificación de Transacciones (Obsidian / Workspace)
    let type = "inbox";
    let cleanContent = text;
    let replyHeader = "📝 *Captura Guardada en la Nube:*";
    let targetSection = "Inbox.md";
    let customNotice = "Almacenado en Supabase. Se inyectará a tu Bóveda local en cuanto tu laptop esté activa.";

    function getBody(src, keyword) {
      if (src.includes(":")) {
        return src.substring(src.indexOf(":") + 1).trim();
      }
      return src.replace(new RegExp(`^\\/?${keyword}\\s*`, "i"), "").trim();
    }

    if (lower.startsWith("tarea:") || lower.startsWith("/tarea") || lower.startsWith("tarea ")) {
      type = "task";
      cleanContent = getBody(text, "tarea");
      replyHeader = "🎯 *Tarea Asegurada en la Nube:*";
      targetSection = "Bitácora Diaria (Objetivos de la Jornada)";
    } else if (lower.startsWith("nota:") || lower.startsWith("/nota") || lower.startsWith("nota ")) {
      type = "note";
      cleanContent = getBody(text, "nota");
      replyHeader = "💡 *Nota Asegurada en la Nube:*";
      targetSection = "Inbox.md & Bitácora Diaria";
    } else if (lower.startsWith("agenda:") || lower.startsWith("/agenda") || lower.startsWith("evento:") || lower.startsWith("/evento") || lower.startsWith("reunion:")) {
      type = "event";
      cleanContent = getBody(text, "(agenda|evento|reunion)");
      replyHeader = "📅 *Evento Asegurado en la Nube:*";
      targetSection = "Bitácora Diaria (Actividades) y Google Calendar";
    } else if (lower.startsWith("borrador:") || lower.startsWith("/borrador") || lower.startsWith("draft:")) {
      type = "draft";
      cleanContent = getBody(text, "(borrador|draft)");
      replyHeader = "📧 *Borrador Asegurado en la Nube:*";
      targetSection = "Gmail (Se creará borrador al activar laptop)";
      customNotice = "Se preparará el borrador en tu cuenta de Gmail al iniciar tu laptop.";
    }

    const timestamp = new Date().toISOString();
    const payload = {
      id: `msg_${Date.now()}_${msgId}`,
      message_id: msgId,
      chat_id: chatId,
      raw_text: text,
      type: type,
      content: cleanContent,
      created_at: timestamp,
      source: "telegram_cloud_gateway"
    };

    const filename = `${Date.now()}_${msgId}.json`;
    const saved = await uploadToSupabaseBuffer(filename, payload);

    if (saved) {
      const confirmText = 
        `☁️ ${replyHeader}\n` +
        `\`${cleanContent}\`\n\n` +
        `📂 *Destino:* ${targetSection}\n` +
        `⏳ *Estado:* ${customNotice}`;
      await sendTelegramMessage(chatId, confirmText);
    } else {
      await sendTelegramMessage(chatId, "⚠️ Recibí tu mensaje, pero hubo un detalle al guardar en Supabase. Reintenta en unos instantes.");
    }

    return res.status(200).json({ ok: true, saved: saved, filename: filename });
  } catch (error) {
    console.error("Error fatal en Cloud Gateway:", error);
    return res.status(200).json({ ok: false, error: error.message });
  }
}
