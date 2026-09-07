// Vercel Serverless Function: JARVIS Cloud Gateway (Reuniones Rápidas)
// Endpoint: https://store-skills.vercel.app/api/telegram-meetings
// Transcribe audio con Whisper, genera borradores y agenda en Calendar de forma 100% nativa.

import { createGmailDraftCloud, createCalendarEventCloud, searchGoogleContactsCloud, resolveContactEmail } from "./gmail.js";

// Token exclusivo para Reuniones Rápidas
const BOT_TOKEN = "8925532101:AAEmg6hVwN0tKcueHJ1Avdgh7cXQfj82no8";
const ALLOWED_CHAT_ID = "1274149213";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY || Buffer.from("c2stcHJvai1CV2JsX3FIWXp2X3NEUDF3UjRTS0RjUU1GRi10ekhKdlp5LTZZU29adDlnQmZyUkh2cUhsRjRwejZXTU1PdWlHdlloTlJ3RklGQVQzQmxia0ZKTExVSWpHd1prM3UzczNWZko0WUprZnhhdGx1UXJTYlVWYWhGQVJ5ak83X1pVMHdUWW04bXVvUkdZWmcya1l0bXZyZHNiMWM5a0E=", "base64").toString("utf-8");

async function sendTelegramMessage(chatId, text) {
  try {
    const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text: text, parse_mode: "Markdown" })
    });
    if (!res.ok) {
      await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: chatId, text: text.replace(/[*_`]/g, "") })
      });
    }
  } catch (err) {
    console.error("Error enviando mensaje Telegram:", err);
  }
}

async function downloadTelegramFile(fileId) {
  const getFileUrl = `https://api.telegram.org/bot${BOT_TOKEN}/getFile?file_id=${fileId}`;
  const res = await fetch(getFileUrl);
  if (!res.ok) throw new Error("Error consultando archivo en Telegram");
  const data = await res.json();
  const filePath = data.result.file_path;
  const downloadUrl = `https://api.telegram.org/file/bot${BOT_TOKEN}/${filePath}`;
  const fileRes = await fetch(downloadUrl);
  if (!fileRes.ok) throw new Error("Error descargando binario de Telegram");
  return Buffer.from(await fileRes.arrayBuffer());
}

async function transcribeAudioWithWhisper(audioBuffer) {
  const formData = new FormData();
  formData.append("file", new Blob([audioBuffer], { type: "audio/ogg" }), "voice.oga");
  formData.append("model", "whisper-1");
  formData.append("language", "es");

  const res = await fetch("https://api.openai.com/v1/audio/transcriptions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${OPENAI_API_KEY}`
    },
    body: formData
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Falla en Whisper API: ${err}`);
  }
  const data = await res.json();
  return data.text ? data.text.trim() : "";
}

async function analyzeFastMeeting(text) {
  const systemPrompt = `Eres JARVIS, asistente ejecutivo del Vicepresidente de CUSPAL.
El usuario dicta un resumen rápido de una reunión o acuerdo.
Debes extraer la información y estructurarla en un JSON con la siguiente forma:
{
  "email_draft": {
    "subject": "Asunto profesional para el correo de minuta/acuerdos",
    "body": "Cuerpo del correo, formal, claro, enumerando compromisos, acuerdos y próximos pasos. Texto plano.",
    "to": ""
  },
  "calendar_event": {
    "create": true/false (true si en el audio se menciona una reunión futura, fecha, hora o plazo),
    "summary": "Título del evento o seguimiento",
    "description": "Detalle del compromiso agendado",
    "date": "YYYY-MM-DD" (Calculado en base a hoy: ${new Date().toISOString().split('T')[0]}),
    "start_time": "HH:MM",
    "end_time": "HH:MM"
  }
}
Responde ÚNICAMENTE con el objeto JSON.`;

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: text }
      ],
      response_format: { type: "json_object" }
    })
  });

  if (!res.ok) throw new Error("Error analizando con OpenAI");
  const data = await res.json();
  return JSON.parse(data.choices[0].message.content);
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(200).send("JARVIS Fast Meetings Webhook is active.");
  }

  try {
    const update = req.body;
    if (!update || !update.message) {
      return res.status(200).json({ ok: true, ignored: "no_message" });
    }

    const msg = update.message;
    const chatId = String(msg.chat ? msg.chat.id : "");
    if (chatId !== ALLOWED_CHAT_ID) {
      return res.status(200).json({ ok: true, ignored: "unauthorized" });
    }

    let text = (msg.text || msg.caption || "").trim();

    // Comando de Bienvenida / Start
    if (text.toLowerCase() === "/start" || text.toLowerCase() === "start" || text.toLowerCase() === "help") {
      await sendTelegramMessage(chatId, "🎙️ *Nexus Agenda Rápida Activo*\n\nEnvíame una nota de voz o escribe los acuerdos de tu reunión.\n\n⚡ *Automatizaciones automáticas:* \n• Transcripción precisa con Whisper.\n• Resolución de destinatarios con tu **Libreta de Contactos**.\n• Creación de Borrador en Gmail.\n• Programación en Google Calendar si mencionas fecha u hora.\n\n🔍 *Comando útil:* `Contacto: [Nombre]` para buscar teléfonos o correos en tu libreta.");
      return res.status(200).json({ ok: true, handled: "start" });
    }

    // Comando: Buscar Contacto directo
    const lowerText = text.toLowerCase();
    if (lowerText.startsWith("contacto:") || lowerText.startsWith("/contacto") || lowerText.startsWith("buscar contacto")) {
      const q = text.replace(/^(\/contacto|contacto:|buscar contacto)\s*/i, "").trim();
      if (!q) {
        await sendTelegramMessage(chatId, "👤 *Búsqueda de Contactos:*\nIndica el nombre a buscar. Ej: `Contacto: Carlos`");
        return res.status(200).json({ ok: true, handled: "contact_empty" });
      }
      await sendTelegramMessage(chatId, `🔍 _Buscando a "${q}" en tus contactos de Google..._`);
      const results = await searchGoogleContactsCloud(q);
      if (results && results.length > 0) {
        let card = `👤 *Contactos encontrados (${results.length}):*\n\n`;
        results.slice(0, 5).forEach(c => {
          card += `• *${c.name}*\n  📧 Email: \`${c.email || "No registrado"}\`\n  📱 Tel: \`${c.phone || "No registrado"}\`\n\n`;
        });
        await sendTelegramMessage(chatId, card);
      } else {
        await sendTelegramMessage(chatId, `⚠️ No encontré ningún contacto con el nombre "${q}" en tu libreta.`);
      }
      return res.status(200).json({ ok: true, handled: "contact_search" });
    }

    if (msg.voice) {
      try {
        await sendTelegramMessage(chatId, "🎙️ _Descargando y transcribiendo audio con Whisper..._");
        const audioBuffer = await downloadTelegramFile(msg.voice.file_id);
        const transcription = await transcribeAudioWithWhisper(audioBuffer);
        if (transcription && transcription.trim()) {
          text = transcription.trim();
          await sendTelegramMessage(chatId, `📝 *Reunión capturada:*\n_"${text}"_`);
        } else {
          await sendTelegramMessage(chatId, "⚠️ No pude detectar audio inteligible en la grabación.");
          return res.status(200).json({ ok: true, handled: "voice_empty" });
        }
      } catch (err) {
        console.error("Error procesando audio:", err);
        await sendTelegramMessage(chatId, `❌ Error procesando voz: ${err.message}`);
        return res.status(200).json({ ok: false, error: err.message });
      }
    }

    if (!text) {
      return res.status(200).json({ ok: true, ignored: "empty_text" });
    }

    await sendTelegramMessage(chatId, "⚙️ _Procesando acuerdos, borrador en Gmail y calendario..._");

    try {
      const analysis = await analyzeFastMeeting(text);
      let replyMsg = "✅ *Acciones Ejecutadas:*\n\n";

      // 1. Crear Borrador en Gmail
      if (analysis.email_draft) {
        let recipient = analysis.email_draft.to || "";
        if (recipient) {
          recipient = await resolveContactEmail(recipient);
        }
        const draftRes = await createGmailDraftCloud(analysis.email_draft.subject, analysis.email_draft.body, recipient);
        if (draftRes.ok) {
          replyMsg += `📧 *Borrador Creado en Gmail:*\n• **Para:** ${recipient ? `\`${recipient}\`` : "_(Sin destinatario específico)_"}\n• **Asunto:** ${analysis.email_draft.subject}\n\n`;
        } else {
          replyMsg += `⚠️ *Detalle en Gmail:* ${draftRes.error || "No se pudo crear"}\n\n`;
        }
      }

      // 2. Crear Evento en Calendario
      if (analysis.calendar_event && analysis.calendar_event.create) {
        const calResult = await createCalendarEventCloud(analysis.calendar_event);
        if (calResult.ok) {
          replyMsg += `📅 *Evento Agendado en Calendar:*\n• **Título:** ${analysis.calendar_event.summary}\n• **Fecha:** ${analysis.calendar_event.date}\n• **Hora:** ${analysis.calendar_event.start_time}\n`;
        } else {
          replyMsg += `⚠️ *Detalle en Calendar:* ${calResult.error || "No se pudo agendar"}\n`;
        }
      }

      await sendTelegramMessage(chatId, replyMsg);

    } catch (e) {
      console.error("Error en procesamiento de reunión rápida:", e);
      await sendTelegramMessage(chatId, `❌ Ocurrió un error: ${e.message}`);
    }

    return res.status(200).json({ ok: true, handled: "fast_meeting_native" });

  } catch (globalError) {
    console.error("Error global en telegram-meetings:", globalError);
    return res.status(500).json({ ok: false, error: globalError.message });
  }
}
