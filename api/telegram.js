// Vercel Serverless Function: JARVIS Cloud Gateway 24/7
// Endpoint: https://store-skills.vercel.app/api/telegram

const BOT_TOKEN = "8714829831:AAEMd6h0cNM7_AZYvzjJsm8CRGZCpWK0xsI";
const ALLOWED_CHAT_ID = "1274149213";
const SUPABASE_URL = "https://tlhbpzwzqmcrutwxomqy.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRsaGJwend6cW1jcnV0d3hvbXF5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NDgzNDM2OCwiZXhwIjoyMTAwNDEwMzY4fQ.ztspOB4xrZT3IEKoOLyYDsah5thmlfbOQvBMI9aSOFc";

async function sendTelegramMessage(chatId, text) {
  try {
    const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: text,
        parse_mode: "Markdown"
      })
    });
    if (!res.ok) {
      // Fallback sin Markdown si falla por caracteres especiales
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

export default async function handler(req, res) {
  // Manejo de peticiones GET para verificación de estado
  if (req.method !== "POST") {
    return res.status(200).json({
      status: "online",
      service: "JARVIS / NEXUS Cloud Gateway 24/7",
      timestamp: new Date().toISOString()
    });
  }

  try {
    const update = req.body;
    if (!update || !update.message) {
      return res.status(200).json({ ok: true, ignored: "no_message" });
    }

    const msg = update.message;
    const chatId = String(msg.chat ? msg.chat.id : "");
    const text = (msg.text || "").trim();
    const msgId = msg.message_id;

    // Validación de seguridad de usuario
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
        "🌐 *Modo:* Nube Autónoma (Sin depender de laptop)\n" +
        "☁️ *Buffer Nube:* Supabase Storage (`nexus_buffer`) Operativo ✅\n" +
        "🔒 *Seguridad:* Autenticado para Gonzalo Lucena ✅\n" +
        "💻 *Sincronización Local:* Al encender tu laptop, los pendientes se transferirán automáticamente a tu Bóveda de Obsidian.\n\n" +
        "Tu ecosistema está vigilante las 24 horas.";
      await sendTelegramMessage(chatId, statusMsg);
      return res.status(200).json({ ok: true, handled: "status" });
    }

    // 2. Comando: Ayuda / Start
    if (lower === "start" || lower === "/start" || lower === "ayuda" || lower === "/ayuda" || lower === "help" || lower === "/help") {
      const helpMsg = 
        "🤖 *CENTRO DE MANDO JARVIS CLOUD 24/7*\n\n" +
        "Puedes dictar o escribir tus pendientes en cualquier momento:\n\n" +
        "• `Tarea: [texto]` — Añadir tarea a tus Objetivos del Día\n" +
        "• `Nota: [texto]` — Guardar nota en Inbox y Bitácora\n" +
        "• `Agenda: [texto]` o `Evento: [texto]` — Agendar cita/reunión\n" +
        "• `Status` — Diagnóstico del nodo en la nube\n" +
        "• Cualquier otro texto se guardará automáticamente en tu Inbox.\n\n" +
        "_Todo queda respaldado en Supabase y se sincronizará a tu Obsidian cuando actives tu laptop._";
      await sendTelegramMessage(chatId, helpMsg);
      return res.status(200).json({ ok: true, handled: "help" });
    }

    // 3. Identificación y Clasificación de Transacciones
    let type = "inbox";
    let cleanContent = text;
    let replyHeader = "📝 *Captura Guardada en la Nube:*";
    let targetSection = "Inbox.md";

    if (lower.startsWith("tarea:") || lower.startsWith("/tarea") || lower.startsWith("tarea ")) {
      type = "task";
      cleanContent = text.includes(":") ? text.split(":")[1].trim() : text.replace(/^\/?tarea\s+/i, "").trim();
      replyHeader = "🎯 *Tarea Asegurada en la Nube:*";
      targetSection = "Bitácora Diaria (Objetivos de la Jornada)";
    } else if (lower.startsWith("nota:") || lower.startsWith("/nota") || lower.startsWith("nota ")) {
      type = "note";
      cleanContent = text.includes(":") ? text.split(":")[1].trim() : text.replace(/^\/?nota\s+/i, "").trim();
      replyHeader = "💡 *Nota Asegurada en la Nube:*";
      targetSection = "Inbox.md & Bitácora Diaria";
    } else if (lower.startsWith("agenda:") || lower.startsWith("/agenda") || lower.startsWith("evento:") || lower.startsWith("/evento") || lower.startsWith("reunion:")) {
      type = "event";
      cleanContent = text.includes(":") ? text.split(":")[1].trim() : text.replace(/^\/?(agenda|evento|reunion)\s+/i, "").trim();
      replyHeader = "📅 *Evento Asegurado en la Nube:*";
      targetSection = "Bitácora Diaria (Actividades & Reuniones)";
    }

    // Estructurar el objeto de transacción para el Buffer
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
        `⏳ *Estado:* Almacenado en Supabase. Se inyectará a tu Bóveda local en cuanto tu laptop esté activa.`;
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
