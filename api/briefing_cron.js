// Vercel Serverless Function: NEXUS Cloud AI Briefing Cron (06:00 AM Caracas)
// Endpoint: https://store-skills.vercel.app/api/briefing_cron
// Despacha el Briefing Global de IA a las 06:00 AM Caracas (10:00 UTC) sin requerir que la laptop esté encendida.

const BOT_TOKEN = "8714829831:AAEMd6h0cNM7_AZYvzjJsm8CRGZCpWK0xsI";
const ALLOWED_CHAT_ID = "1274149213";
const SUPABASE_URL = "https://tlhbpzwzqmcrutwxomqy.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRsaGJwend6cW1jcnV0d3hvbXF5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NDgzNDM2OCwiZXhwIjoyMTAwNDEwMzY4fQ.ztspOB4xrZT3IEKoOLyYDsah5thmlfbOQvBMI9aSOFc";
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || process.env.VITE_OPENROUTER_API_KEY || Buffer.from("c2stb3ItdjEtYzFjMzE0NTdmZWU3ZDEzNWM3N2RhZjI5Y2RiYWVkY2RhNDVlMmIxN2Y2Nzc5YTAyNjk1M2Y2NzQ4YzU3MjFmMg==", "base64").toString("utf-8");

import { sendPaolaVoiceNote, generatePaolaAudioBuffer } from "./tts.js";

async function sendTelegramMessage(chatId, text, parseMode = "HTML") {
  try {
    const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: text.slice(0, 4000),
        parse_mode: parseMode,
        disable_web_page_preview: true
      })
    });
    if (!res.ok) {
      // Fallback a texto plano
      await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text: text.replace(/<[^>]+>/g, "").slice(0, 4000)
        })
      });
    }
    return true;
  } catch (err) {
    console.error("Error enviando mensaje Telegram:", err);
    return false;
  }
}

async function sendTelegramAudioBuffer(chatId, audioBuffer, caption, title, performer) {
  try {
    const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendAudio`;
    const formData = new FormData();
    const blob = new Blob([audioBuffer], { type: "audio/mpeg" });
    
    formData.append("chat_id", chatId);
    formData.append("audio", blob, "briefing_paola.mp3");
    formData.append("caption", caption);
    formData.append("parse_mode", "HTML");
    formData.append("title", title);
    formData.append("performer", performer);

    const res = await fetch(url, {
      method: "POST",
      body: formData
    });
    if (res.ok) return true;

    // Fallback a sendVoice
    const urlVoice = `https://api.telegram.org/bot${BOT_TOKEN}/sendVoice`;
    const formVoice = new FormData();
    formVoice.append("chat_id", chatId);
    formVoice.append("voice", blob, "briefing_paola.mp3");
    formVoice.append("caption", caption.replace(/<[^>]+>/g, ""));
    const resVoice = await fetch(urlVoice, { method: "POST", body: formVoice });
    return resVoice.ok;
  } catch (err) {
    console.error("Error enviando audio a Telegram:", err);
    return false;
  }
}

export default async function handler(req, res) {
  try {
    const now = new Date();
    // Fecha local en Caracas (UTC-4)
    const caracasTime = new Date(now.getTime() - 4 * 3600 * 1000);
    const dateStr = caracasTime.toISOString().split("T")[0]; // YYYY-MM-DD
    const isManual = req.query?.manual === "true";

    console.log(`[BRIEFING-CRON] Iniciando proceso (Fecha Caracas: ${dateStr}, Manual: ${isManual})`);

    // 1. Verificar si hay un paquete preparado en Supabase Storage
    const pendingJsonUrl = `${SUPABASE_URL}/storage/v1/object/nexus_buffer/cache/briefing_ia_pending.json?t=${Date.now()}`;
    const pendingAudioUrl = `${SUPABASE_URL}/storage/v1/object/nexus_buffer/cache/briefing_ia_pending.mp3?t=${Date.now()}`;

    let deliveredFromCache = false;

    const probeRes = await fetch(pendingJsonUrl, {
      headers: {
        "apikey": SUPABASE_SERVICE_ROLE_KEY,
        "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
      }
    });

    if (probeRes.ok) {
      const packageData = await probeRes.json();
      console.log(`[BRIEFING-CRON] Paquete encontrado en Supabase: target_date=${packageData.target_date}, delivered=${packageData.delivered}`);

      // Si no ha sido entregado o si es ejecución manual
      if (!packageData.delivered || isManual) {
        // Obtener el audio desde Supabase Storage
        const audioRes = await fetch(pendingAudioUrl, {
          headers: {
            "apikey": SUPABASE_SERVICE_ROLE_KEY,
            "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
          }
        });

        let audioBuffer = null;
        if (audioRes.ok) {
          const arrayBuf = await audioRes.arrayBuffer();
          audioBuffer = Buffer.from(arrayBuf);
          console.log(`[BRIEFING-CRON] Audio descargado de Supabase (${audioBuffer.length} bytes)`);
        }

        // Si no hay audio en Supabase, generarlo en la nube con Paola
        if (!audioBuffer && packageData.audio_script) {
          console.log("[BRIEFING-CRON] Generando audio de Paola en la nube con Edge TTS...");
          audioBuffer = await generatePaolaAudioBuffer(packageData.audio_script);
        }

        // Despachar a Telegram
        if (packageData.telegram_html) {
          await sendTelegramMessage(ALLOWED_CHAT_ID, packageData.telegram_html, "HTML");
        }

        if (audioBuffer && audioBuffer.length > 0) {
          await sendTelegramAudioBuffer(
            ALLOWED_CHAT_ID,
            audioBuffer,
            `🎙️ <b>Briefing Global IA (${packageData.display_date || dateStr})</b>\n<i>Voz Oficial: Paola (NEXUS)</i>`,
            `Briefing Global IA (${packageData.display_date || dateStr})`,
            "Paola (NEXUS)"
          );
        }

        // Marcar como entregado en Supabase
        packageData.delivered = true;
        packageData.delivered_at = new Date().toISOString();
        packageData.delivered_by = "vercel_cloud_cron";

        await fetch(`${SUPABASE_URL}/storage/v1/object/nexus_buffer/cache/briefing_ia_pending.json`, {
          method: "PUT",
          headers: {
            "apikey": SUPABASE_SERVICE_ROLE_KEY,
            "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
            "Content-Type": "application/json",
            "x-upsert": "true"
          },
          body: JSON.stringify(packageData)
        });

        deliveredFromCache = true;
        console.log("[BRIEFING-CRON] Entrega desde caché completada con éxito.");
      } else {
        console.log("[BRIEFING-CRON] El briefing de hoy ya fue entregado previamente.");
        return res.status(200).json({ ok: true, status: "already_delivered", date: packageData.target_date });
      }
    }

    if (deliveredFromCache) {
      return res.status(200).json({
        ok: true,
        source: "supabase_cache",
        delivered_at: new Date().toISOString(),
        recipient: ALLOWED_CHAT_ID
      });
    }

    return res.status(200).json({
      ok: true,
      status: "no_pending_briefing",
      message: "No pending briefing found in cloud storage to deliver."
    });

  } catch (error) {
    console.error("[BRIEFING-CRON] Error general:", error);
    return res.status(500).json({ ok: false, error: error.message });
  }
}
