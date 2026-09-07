// Vercel Serverless Function: JARVIS Cloud Gateway (Reuniones Rápidas)
// Endpoint: https://store-skills.vercel.app/api/telegram-meetings
// Transcribe audio con Whisper, genera borradores y agenda en Calendar sin pasar por Make.

import FormData from "form-data";
import fetch from "node-fetch";
import { createGmailDraftCloud, createCalendarEventCloud } from "./gmail.js";

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
  const data = await res.json();
  if (!data.ok) throw new Error("No se pudo obtener el archivo de Telegram");
  const filePath = data.result.file_path;
  const downloadUrl = `https://api.telegram.org/file/bot${BOT_TOKEN}/${filePath}`;
  const fileRes = await fetch(downloadUrl);
  return await fileRes.arrayBuffer();
}

async function transcribeAudioWithWhisper(audioBuffer) {
  const form = new FormData();
  form.append("file", Buffer.from(audioBuffer), { filename: "voice.oga", contentType: "audio/ogg" });
  form.append("model", "whisper-1");
  form.append("language", "es");

  const res = await fetch("https://api.openai.com/v1/audio/transcriptions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${OPENAI_API_KEY}`,
      ...form.getHeaders()
    },
    body: form
  });

  if (!res.ok) {
    throw new Error(await res.text());
  }
  const data = await res.json();
  return data.text;
}

async function analyzeFastMeeting(text) {
  const systemPrompt = `Eres JARVIS, asistente ejecutivo del Vicepresidente de CUSPAL.
El usuario dicta un resumen rápido de una reunión.
Debes extraer la información y devolver un JSON con la siguiente estructura:
{
  "email_draft": {
    "subject": "Asunto del correo basado en la reunión",
    "body": "Cuerpo del correo, profesional, listando los acuerdos y próximos pasos. Formato texto plano sin HTML.",
    "to": "destinatario@ejemplo.com" (Si no se especifica, usa blanco "")
  },
  "calendar_event": {
    "create": true/false (true si menciona alguna fecha, hora o compromiso a futuro),
    "summary": "Título del evento",
    "description": "Descripción del evento a agendar",
    "date": "YYYY-MM-DD" (Asume fechas basadas en hoy si dice 'mañana' o 'el lunes'. Hoy es ${new Date().toISOString().split('T')[0]}),
    "start_time": "HH:MM",
    "end_time": "HH:MM"
  }
}
Responde ÚNICAMENTE con el JSON válido.`;

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

    let text = (msg.text || "").trim();

    if (msg.voice) {
      try {
        await sendTelegramMessage(chatId, "🎙️ _Analizando reunión rápida con Whisper..._");
        const audioBuffer = await downloadTelegramFile(msg.voice.file_id);
        const transcription = await transcribeAudioWithWhisper(audioBuffer);
        if (transcription && transcription.trim()) {
          text = transcription.trim();
          await sendTelegramMessage(chatId, `✅ *Reunión capturada:*\n_"${text}"_`);
        } else {
          await sendTelegramMessage(chatId, "⚠️ No pude extraer audio inteligible.");
          return res.status(200).json({ ok: true, handled: "voice_empty" });
        }
      } catch (err) {
        await sendTelegramMessage(chatId, `❌ Error procesando voz: ${err.message}`);
        return res.status(200).json({ ok: false, error: err.message });
      }
    }

    if (!text) {
      return res.status(200).json({ ok: true, ignored: "empty_text" });
    }

    await sendTelegramMessage(chatId, "🚀 _Generando borrador de correo y evaluando calendario directamente en Vercel..._");

    try {
      const analysis = await analyzeFastMeeting(text);
      let replyMsg = "";

      // 1. Crear Borrador
      if (analysis.email_draft) {
        await createGmailDraftCloud(analysis.email_draft.subject, analysis.email_draft.body, analysis.email_draft.to || "");
        replyMsg += `📧 *Borrador Creado:*\n**Asunto:** ${analysis.email_draft.subject}\n\n`;
      }

      // 2. Crear Evento en Calendario
      if (analysis.calendar_event && analysis.calendar_event.create) {
        const calResult = await createCalendarEventCloud(analysis.calendar_event);
        if (calResult.ok) {
          replyMsg += `📅 *Evento Agendado:*\n**Título:** ${analysis.calendar_event.summary}\n**Cuándo:** ${analysis.calendar_event.date} a las ${analysis.calendar_event.start_time}\n`;
        } else {
          replyMsg += `⚠️ *Fallo al agendar:* ${calResult.error}\n`;
        }
      }

      await sendTelegramMessage(chatId, replyMsg || "✅ *Análisis completado.* No se generaron acciones automáticas.");

    } catch (e) {
      console.error("Error en procesamiento nativo:", e);
      await sendTelegramMessage(chatId, "❌ Hubo un error procesando las acciones (Email/Calendar).");
    }

    return res.status(200).json({ ok: true, handled: "fast_meeting_native" });

  } catch (globalError) {
    console.error("Error global en telegram-meetings:", globalError);
    return res.status(500).json({ ok: false, error: globalError.message });
  }
}
