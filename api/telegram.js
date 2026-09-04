// Vercel Serverless Function: JARVIS Cloud Gateway 24/7
// Endpoint: https://store-skills.vercel.app/api/telegram

const BOT_TOKEN = "8714829831:AAEMd6h0cNM7_AZYvzjJsm8CRGZCpWK0xsI";
const ALLOWED_CHAT_ID = "1274149213";
const SUPABASE_URL = "https://tlhbpzwzqmcrutwxomqy.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRsaGJwend6cW1jcnV0d3hvbXF5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NDgzNDM2OCwiZXhwIjoyMTAwNDEwMzY4fQ.ztspOB4xrZT3IEKoOLyYDsah5thmlfbOQvBMI9aSOFc";
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || process.env.VITE_OPENROUTER_API_KEY || Buffer.from("c2stb3ItdjEtYzFjMzE0NTdmZWU3ZDEzNWM3N2RhZjI5Y2RiYWVkY2RhNDVlMmIxN2Y2Nzc5YTAyNjk1M2Y2NzQ4YzU3MjFmMg==", "base64").toString("utf-8");

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
      // Fallback a texto plano si markdown tiene caracteres de escape conflictivos
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

async function getCachedTasks() {
  try {
    const url = `${SUPABASE_URL}/storage/v1/object/nexus_buffer/cache/latest_tasks.json?t=${Date.now()}`;
    const res = await fetch(url, {
      headers: {
        "apikey": SUPABASE_SERVICE_ROLE_KEY,
        "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
      }
    });
    if (res.ok) {
      const data = await res.json();
      return data.tasks_summary || null;
    }
  } catch (err) {
    console.error("Error leyendo cache de tareas en Supabase:", err);
  }
  return null;
}

async function setVoiceConfig(voiceAlias, enabled = null) {
  try {
    const voiceMap = {
      "paola": "es-VE-PaolaNeural",
      "sebastian": "es-VE-SebastianNeural",
      "david": "es-VE-SebastianNeural"
    };

    let targetVoice = voiceAlias ? (voiceMap[voiceAlias.toLowerCase()] || "es-VE-PaolaNeural") : null;
    
    // 1. Notificar al daemon local mediante Supabase buffer
    const ts = Date.now();
    await uploadToSupabaseBuffer(`req_voice_${ts}.json`, {
      type: "voice_config",
      action: voiceAlias ? "set_voice" : (enabled ? "enable" : "disable"),
      voice: voiceAlias || "paola",
      enabled: enabled,
      timestamp: ts
    });

    // 2. Actualizar caché en Supabase Storage
    const cacheUrl = `${SUPABASE_URL}/storage/v1/object/nexus_buffer/cache/voice_state.json`;
    const payload = {
      voice_enabled: enabled !== null ? enabled : true,
      voice: targetVoice || "es-VE-PaolaNeural",
      updated_at: new Date().toISOString()
    };

    await fetch(cacheUrl, {
      method: "PUT",
      headers: {
        "apikey": SUPABASE_SERVICE_ROLE_KEY,
        "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });
  } catch (err) {
    console.error("Error guardando configuración de voz:", err);
  }
}

async function getBCVRates() {
  try {
    const [usdRes, eurRes] = await Promise.all([
      fetch("https://ve.dolarapi.com/v1/dolares/oficial"),
      fetch("https://ve.dolarapi.com/v1/euros/oficial")
    ]);

    if (!usdRes.ok || !eurRes.ok) {
      throw new Error(`Error API DolarApi: USD ${usdRes.status}, EUR ${eurRes.status}`);
    }

    const usd = await usdRes.json();
    const eur = await eurRes.json();

    let fechaStr = "";
    if (usd.fechaActualizacion) {
      const d = new Date(usd.fechaActualizacion);
      const day = String(d.getDate()).padStart(2, "0");
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const year = d.getFullYear();
      fechaStr = `${day}/${month}/${year}`;
    } else {
      const d = new Date();
      fechaStr = `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
    }

    const usdVal = usd.promedio ? Number(usd.promedio).toFixed(2) : "N/A";
    const eurVal = eur.promedio ? Number(eur.promedio).toFixed(2) : "N/A";

    return (
      `🏦 *TASAS OFICIALES BCV*\n` +
      `📅 *Fecha:* ${fechaStr}\n\n` +
      `💵 *Dólar Oficial (USD):* \`${usdVal}\` Bs.\n` +
      `💶 *Euro Oficial (EUR):* \`${eurVal}\` Bs.\n\n` +
      `_Fuente Oficial: Banco Central de Venezuela_`
    );
  } catch (err) {
    console.error("Error obteniendo tasas BCV:", err);
    return "⚠️ No se pudo consultar la tasa oficial BCV en este momento. Intenta de nuevo en unos segundos.";
  }
}

async function askJARVISAI(prompt) {
  const models = [
    "minimax/minimax-m3:free",
    "nvidia/nemotron-3.5-lightning:free"
  ];

  for (const model of models) {
    try {
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://store-skills.vercel.app",
          "X-Title": "JARVIS Cloud Gateway"
        },
        body: JSON.stringify({
          model: model,
          messages: [
            {
              role: "system",
              content: "Eres JARVIS, el asistente ejecutivo de inteligencia artificial y productividad de Gonzalo Lucena. Responde con precisión técnica, alto nivel profesional, elegancia y brevedad ejecutiva."
            },
            {
              role: "user",
              content: prompt
            }
          ]
        })
      });

      if (response.ok) {
        const data = await response.json();
        const content = data.choices?.[0]?.message?.content;
        if (content && content.trim()) {
          return content.trim();
        }
      }
    } catch (e) {
      console.warn(`Falla consultando modelo ${model}:`, e.message);
    }
  }
  return null;
}

function getHelpMenu(section = "main") {
  let text = "";
  let reply_markup = { inline_keyboard: [] };

  if (section === "main" || section === "help_main") {
    text = "🤖 *CENTRO DE MANDO JARVIS (24/7 NUBE)*\n\nElige una categoría para ver los comandos:";
    reply_markup.inline_keyboard = [
      [{ text: "📋 Tareas & Obsidian", callback_data: "help_tasks" },
       { text: "📅 Agenda & Calendario", callback_data: "help_calendar" }],
      [{ text: "🤖 IA & Utilidades", callback_data: "help_utils" },
       { text: "📧 Correo (Gmail)", callback_data: "help_mail" }],
      [{ text: "📄 Documentos & Visión", callback_data: "help_docs" },
       { text: "⚙️ Configuración (Voz)", callback_data: "help_config" }]
    ];
  } else if (section === "help_tasks") {
    text = "📋 *Gestión de Tareas y Notas*\n\n" +
           "• `Tareas` — Consulta inmediata de pendientes de hoy\n" +
           "• `Check [N]` — Completar tarea #N (ej: `Check 1`)\n" +
           "• `Tarea: [texto]` — Agregar tarea a la Bitácora\n" +
           "• `Nota: [texto]` — Guardar nota rápida en Inbox.md\n" +
           "• `[Texto suelto]` — Captura rápida automática";
    reply_markup.inline_keyboard = [[{ text: "🔙 Volver", callback_data: "help_main" }]];
  } else if (section === "help_calendar") {
    text = "📅 *Google Calendar & Obsidian*\n\n" +
           "• `Calendario` — Ver próximos eventos programados\n" +
           "• `Agenda: [Título], [Fecha], [Inicio], [Fin], [Lugar]` — Agendar\n" +
           "• `Evento: [Texto]` — Agendar en Obsidian y Calendar";
    reply_markup.inline_keyboard = [[{ text: "🔙 Volver", callback_data: "help_main" }]];
  } else if (section === "help_utils") {
    text = "🤖 *IA y Utilidades en Vivo*\n\n" +
           "• `BCV` o `Dolar` — Tasa oficial de cambio en tiempo real\n" +
           "• `IA: [pregunta]` — Consulta a JARVIS IA (24/7 autónomo)\n" +
           "• `Status` — Diagnóstico del sistema y telemetría";
    reply_markup.inline_keyboard = [[{ text: "🔙 Volver", callback_data: "help_main" }]];
  } else if (section === "help_mail") {
    text = "📧 *Gestión de Correos (Gmail)*\n\n" +
           "• `Borrador: [Asunto], [Cuerpo]` — Preparar borrador\n" +
           "• `Enviar email: [Para], [Asunto], [Cuerpo]` — Enviar correo directo";
    reply_markup.inline_keyboard = [[{ text: "🔙 Volver", callback_data: "help_main" }]];
  } else if (section === "help_docs") {
    text = "📄 *Documentos & Visión*\n\n" +
           "• Enviar archivo `.PDF` — Extrae texto, resume y archiva\n" +
           "• Enviar foto — Digitalización y ficha con IA";
    reply_markup.inline_keyboard = [[{ text: "🔙 Volver", callback_data: "help_main" }]];
  } else if (section === "help_config") {
    text = "⚙️ *Configuración de Sistema & Voz*\n\n" +
           "Configura las respuestas habladas y la voz oficial de JARVIS:\n\n" +
           "• 👩 `Voz Paola` — Configurar voz femenina natural (Venezuela 🇻🇪)\n" +
           "• 👨 `Voz David` — Configurar voz masculina natural (Venezuela 🇻🇪)\n" +
           "• 🔊 `Voz on` / `Voz off` — Activar o silenciar respuestas de voz\n" +
           "• ⚡ `Status` — Diagnóstico del sistema y telemetría\n\n" +
           "👇 *Toca una opción para cambiar la configuración al instante:*";
    reply_markup.inline_keyboard = [
      [{ text: "👩 Voz Paola 🇻🇪", callback_data: "voice_paola" },
       { text: "👨 Voz David 🇻🇪", callback_data: "voice_david" }],
      [{ text: "🔊 Voz ON", callback_data: "voice_on" },
       { text: "🔇 Voz OFF", callback_data: "voice_off" }],
      [{ text: "⚡ Estado (Status)", callback_data: "cmd_status" }],
      [{ text: "🔙 Volver", callback_data: "help_main" }]
    ];
  }

  return { text, reply_markup };
}

function getBody(src, keyword) {
  if (src.includes(":")) {
    return src.substring(src.indexOf(":") + 1).trim();
  }
  return src.replace(new RegExp(`^\\/?${keyword}\\s*`, "i"), "").trim();
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

    // A. Interacción con Botones (Inline Callbacks)
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
        return res.status(200).json({ ok: true, handled: "callback_help" });
      }

      if (data === "voice_paola") {
        await setVoiceConfig("paola", true);
        await sendTelegramMessage(cbChatId, "🎙️ *Voz de JARVIS configurada:* `Paola (Venezuela) 🇻🇪`\n\nA partir de ahora todas las respuestas habladas se emitirán con la voz de Paola.");
        return res.status(200).json({ ok: true, handled: "voice_paola" });
      }

      if (data === "voice_david") {
        await setVoiceConfig("sebastian", true);
        await sendTelegramMessage(cbChatId, "🎙️ *Voz de JARVIS configurada:* `David / Sebastián (Venezuela) 🇻🇪`\n\nA partir de ahora todas las respuestas habladas se emitirán con la voz de David.");
        return res.status(200).json({ ok: true, handled: "voice_david" });
      }

      if (data === "voice_on") {
        await setVoiceConfig(null, true);
        await sendTelegramMessage(cbChatId, "🔊 *Modo Voz Activado (Manos Libres)*\n\nJARVIS responderá a tus acciones con notas de voz.");
        return res.status(200).json({ ok: true, handled: "voice_on" });
      }

      if (data === "voice_off") {
        await setVoiceConfig(null, false);
        await sendTelegramMessage(cbChatId, "🔇 *Modo Voz Desactivado*\n\nLas respuestas se emitirán únicamente en texto.");
        return res.status(200).json({ ok: true, handled: "voice_off" });
      }

      if (data === "cmd_status") {
        const statusMsg = 
          "⚡ *JARVIS CLOUD GATEWAY (24/7 ACTIVO)*\n\n" +
          "🌐 *Modo:* Nube Autónoma (Independencia total de laptop)\n" +
          "☁️ *Buffer Nube:* Supabase Storage (`nexus_buffer`) Operativo ✅\n" +
          "🔒 *Seguridad:* Autenticado para Gonzalo Lucena ✅\n" +
          "📡 _Solicitando telemetría de hardware a la Laptop..._";
        await sendTelegramMessage(cbChatId, statusMsg);

        const ts = Date.now();
        await uploadToSupabaseBuffer(`req_status_${ts}.json`, {
          type: "status_request",
          content: "Solicitud de estado de hardware",
          timestamp: ts
        });
        return res.status(200).json({ ok: true, handled: "cmd_status" });
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

    // ==========================================
    // 1. COMANDO: STATUS / ESTADO DEL SISTEMA
    // ==========================================
    if (lower === "status" || lower === "/status" || lower === "estado" || lower === "/estado") {
      const statusMsg = 
        "⚡ *JARVIS CLOUD GATEWAY (24/7 ACTIVO)*\n\n" +
        "🌐 *Modo:* Nube Autónoma (Independencia total de laptop)\n" +
        "☁️ *Buffer Nube:* Supabase Storage (`nexus_buffer`) Operativo ✅\n" +
        "🔒 *Seguridad:* Autenticado para Gonzalo Lucena ✅\n" +
        "📡 _Solicitando telemetría de hardware a la Laptop..._";
      await sendTelegramMessage(chatId, statusMsg);

      const ts = Date.now();
      await uploadToSupabaseBuffer(`req_status_${ts}.json`, {
        type: "status_request",
        content: "Solicitud de estado de hardware",
        timestamp: ts
      });

      return res.status(200).json({ ok: true, handled: "status" });
    }

    // ==========================================
    // 2. COMANDO: AYUDA / START / HELP
    // ==========================================
    if (lower === "start" || lower === "/start" || lower === "ayuda" || lower === "/ayuda" || lower === "help" || lower === "/help") {
      const { text: helpMsg, reply_markup: rm } = getHelpMenu("main");
      await sendTelegramMessage(chatId, helpMsg, rm);
      return res.status(200).json({ ok: true, handled: "help" });
    }

    // ==========================================
    // 2.5 COMANDOS DE VOZ (PAOLA / DAVID / ON / OFF)
    // ==========================================
    if (lower === "voz paola" || lower === "/voz paola" || lower === "cambiar voz paola" || lower === "voz de paola") {
      await setVoiceConfig("paola", true);
      await sendTelegramMessage(chatId, "🎙️ *Voz de JARVIS configurada:* `Paola (Venezuela) 🇻🇪`\n\nA partir de ahora todas las respuestas habladas se emitirán con la voz femenina de Paola.");
      return res.status(200).json({ ok: true, handled: "voice_paola" });
    }

    if (lower === "voz david" || lower === "/voz david" || lower === "voz sebastian" || lower === "/voz sebastian" ||
        lower === "cambiar voz david" || lower === "voz de david") {
      await setVoiceConfig("sebastian", true);
      await sendTelegramMessage(chatId, "🎙️ *Voz de JARVIS configurada:* `David / Sebastián (Venezuela) 🇻🇪`\n\nA partir de ahora todas las respuestas habladas se emitirán con la voz masculina de David.");
      return res.status(200).json({ ok: true, handled: "voice_david" });
    }

    if (lower === "voz on" || lower === "/voz on" || lower === "modo voz on" || lower === "activar voz") {
      await setVoiceConfig(null, true);
      await sendTelegramMessage(chatId, "🔊 *Modo Voz Activado (Manos Libres)*\n\nJARVIS responderá a tus acciones con notas de voz.");
      return res.status(200).json({ ok: true, handled: "voice_on" });
    }

    if (lower === "voz off" || lower === "/voz off" || lower === "modo voz off" || lower === "desactivar voz" || lower === "silencio") {
      await setVoiceConfig(null, false);
      await sendTelegramMessage(chatId, "🔇 *Modo Voz Desactivado*\n\nLas respuestas se emitirán únicamente en texto.");
      return res.status(200).json({ ok: true, handled: "voice_off" });
    }

    // ==========================================
    // 3. COMANDO: TASAS OFICIALES BCV (DÓLAR / EURO)
    // ==========================================
    if (lower === "bcv" || lower === "/bcv" || lower === "dolar" || lower === "/dolar" || 
        lower === "tasa" || lower === "/tasa" || lower === "euro" || lower === "/euro" ||
        lower === "tasa bcv" || lower === "dolar bcv") {
      const bcvMsg = await getBCVRates();
      await sendTelegramMessage(chatId, bcvMsg);
      return res.status(200).json({ ok: true, handled: "bcv" });
    }

    // ==========================================
    // 4. COMANDO: CONSULTA A INTELIGENCIA ARTIFICIAL (IA)
    // ==========================================
    if (lower.startsWith("ia:") || lower.startsWith("/ia") || lower.startsWith("ia ")) {
      const prompt = text.replace(/^(\/ia|ia:?)\s*/i, "").trim();
      if (!prompt) {
        await sendTelegramMessage(chatId, "🤖 *JARVIS IA*\n\nPor favor escribe tu consulta después de `IA:`. Ejemplo:\n`IA: ¿Cuál es la diferencia entre un oficio y un memorando?`");
        return res.status(200).json({ ok: true, handled: "ia_empty" });
      }

      // Consulta directa al motor de IA en la nube
      const aiResponse = await askJARVISAI(prompt);
      if (aiResponse) {
        const reply = `🤖 *JARVIS IA:*\n\n${aiResponse}`;
        await sendTelegramMessage(chatId, reply);
        return res.status(200).json({ ok: true, handled: "ia_cloud" });
      } else {
        // Fallback: Si los modelos gratuitos de la nube están saturados, transferir a la laptop
        const ts = Date.now();
        await uploadToSupabaseBuffer(`req_ai_${ts}.json`, {
          type: "ai_request",
          content: prompt,
          timestamp: ts
        });
        await sendTelegramMessage(chatId, "🤖 _Nube temporalmente ocupada. Transfiriendo consulta a la IA de tu Laptop..._");
        return res.status(200).json({ ok: true, handled: "ia_fallback" });
      }
    }

    // ==========================================
    // 5. COMANDO: CONSULTAR TAREAS DE HOY / AGENDA
    // ==========================================
    if (lower === "tareas" || lower === "/tareas" || lower === "pendientes" || lower === "/pendientes" ||
        lower === "agenda hoy" || lower === "/agenda_hoy" || lower === "mis tareas") {
      const cached = await getCachedTasks();
      if (cached) {
        await sendTelegramMessage(chatId, cached);
      } else {
        await sendTelegramMessage(chatId, "📋 *Consultando tareas en la Bóveda local...*\n_Si tu laptop está activa responderá en unos segundos._");
      }

      // Notificar al daemon local para refrescar el estado si la laptop está encendida
      const ts = Date.now();
      await uploadToSupabaseBuffer(`req_tasks_${ts}.json`, {
        type: "tasks_query",
        content: "Consulta de tareas pendientes",
        timestamp: ts
      });

      return res.status(200).json({ ok: true, handled: "tasks" });
    }

    // ==========================================
    // 6. COMANDO: CHECK / COMPLETAR TAREA
    // ==========================================
    if (lower.startsWith("check ") || lower.startsWith("/check ") || lower.startsWith("completar ")) {
      const taskIdx = text.replace(/^(\/check|check|completar)\s*/i, "").trim();
      if (taskIdx && /^\d+$/.test(taskIdx)) {
        const ts = Date.now();
        await uploadToSupabaseBuffer(`req_check_${ts}.json`, {
          type: "check_task",
          content: taskIdx,
          timestamp: ts
        });
        await sendTelegramMessage(chatId, `⏳ *Completando tarea #${taskIdx} en tu Bitácora...*`);
        return res.status(200).json({ ok: true, handled: "check_task" });
      }
    }

    // ==========================================
    // 7. COMANDO: CONSULTAR EVENTOS / CALENDARIO
    // ==========================================
    if (lower === "calendario" || lower === "/calendario" || lower === "eventos" || lower === "/eventos") {
      const ts = Date.now();
      await uploadToSupabaseBuffer(`req_cal_${ts}.json`, {
        type: "calendar_query",
        content: "Consulta de eventos",
        timestamp: ts
      });
      await sendTelegramMessage(chatId, "📅 *Consultando eventos en Google Calendar...*");
      return res.status(200).json({ ok: true, handled: "calendar_query" });
    }

    // ==========================================
    // 8. CAPTURAS Y CREACIÓN DE ELEMENTOS
    // ==========================================
    let type = "inbox";
    let cleanContent = text;
    let confirmMsg = "";

    if (lower.startsWith("tarea:") || lower.startsWith("/tarea") || lower.startsWith("tarea ")) {
      type = "task";
      cleanContent = getBody(text, "tarea");
      confirmMsg = `🎯 *Tarea registrada:*\n\`${cleanContent}\`\n\n📂 _Destino: Bitácora Diaria (Objetivos)_`;
    } else if (lower.startsWith("nota:") || lower.startsWith("/nota") || lower.startsWith("nota ")) {
      type = "note";
      cleanContent = getBody(text, "nota");
      confirmMsg = `💡 *Nota guardada:*\n\`${cleanContent}\`\n\n📂 _Destino: Inbox.md & Bitácora_`;
    } else if (lower.startsWith("agenda:") || lower.startsWith("/agenda") || lower.startsWith("evento:") || lower.startsWith("/evento") || lower.startsWith("reunion:")) {
      type = "event";
      cleanContent = getBody(text, "(agenda|evento|reunion)");
      confirmMsg = `📅 *Evento agendado:*\n\`${cleanContent}\`\n\n📂 _Destino: Google Calendar & Bitácora_`;
    } else if (lower.startsWith("borrador:") || lower.startsWith("/borrador") || lower.startsWith("draft:")) {
      type = "draft";
      cleanContent = getBody(text, "(borrador|draft)");
      confirmMsg = `📧 *Borrador preparado:*\n\`${cleanContent}\`\n\n📂 _Destino: Gmail (Borradores)_`;
    } else if (lower.startsWith("enviar email:") || lower.startsWith("/email") || lower.startsWith("email:")) {
      type = "email";
      cleanContent = getBody(text, "(enviar email|email)");
      confirmMsg = `📤 *Orden de correo recibida:*\n\`${cleanContent}\`\n\n📂 _Destino: Despacho Gmail_`;
    } else {
      // Fallback: Texto rápido sin prefijo específico
      type = "inbox";
      cleanContent = text;
      confirmMsg = `📝 *Captura rápida guardada:*\n\`${cleanContent}\`\n\n📂 _Destino: Inbox.md_`;
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
      await sendTelegramMessage(chatId, confirmMsg);
    } else {
      await sendTelegramMessage(chatId, "⚠️ Hubo un detalle temporal guardando en la nube. Reintenta en unos instantes.");
    }

    return res.status(200).json({ ok: true, saved: saved, filename: filename });
  } catch (error) {
    console.error("Error fatal en Cloud Gateway:", error);
    return res.status(200).json({ ok: false, error: error.message });
  }
}
