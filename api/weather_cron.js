// Vercel Serverless Function: JARVIS Cloud Weather Cron (06:00 AM Caracas)
// Endpoint: https://store-skills.vercel.app/api/weather_cron

const BOT_TOKEN = "8714829831:AAEMd6h0cNM7_AZYvzjJsm8CRGZCpWK0xsI";
const ALLOWED_CHAT_ID = "1274149213";
const SUPABASE_URL = "https://tlhbpzwzqmcrutwxomqy.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRsaGJwend6cW1jcnV0d3hvbXF5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NDgzNDM2OCwiZXhwIjoyMTAwNDEwMzY4fQ.ztspOB4xrZT3IEKoOLyYDsah5thmlfbOQvBMI9aSOFc";

const WMO_CODES = {
  0: { desc: "Cielo despejado", icon: "☀️" },
  1: { desc: "Principalmente despejado", icon: "🌤️" },
  2: { desc: "Parcialmente nublado", icon: "⛅" },
  3: { desc: "Nublado", icon: "☁️" },
  45: { desc: "Niebla", icon: "🌫️" },
  48: { desc: "Niebla con escarcha", icon: "🌫️" },
  51: { desc: "Llovizna ligera", icon: "🌦️" },
  53: { desc: "Llovizna moderada", icon: "🌦️" },
  55: { desc: "Llovizna densa", icon: "🌧️" },
  61: { desc: "Lluvia ligera", icon: "🌧️" },
  63: { desc: "Lluvia moderada", icon: "🌧️" },
  65: { desc: "Lluvia fuerte", icon: "🌧️" },
  71: { desc: "Nevada ligera", icon: "🌨️" },
  80: { desc: "Chubascos ligeros", icon: "🌦️" },
  81: { desc: "Chubascos moderados", icon: "🌧️" },
  82: { desc: "Chubascos violentos", icon: "⛈️" },
  95: { desc: "Tormenta eléctrica", icon: "⛈️" },
  96: { desc: "Tormenta con granizo ligero", icon: "⛈️" },
  99: { desc: "Tormenta con granizo fuerte", icon: "⛈️" }
};

function getWmoInfo(code) {
  return WMO_CODES[code] || { desc: "Nubosidad variable", icon: "⛅" };
}

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
      await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text: text.replace(/[*_`]/g, "")
        })
      });
    }
    return true;
  } catch (err) {
    console.error("Error enviando reporte meteorológico a Telegram:", err);
    return false;
  }
}

export async function generateWeatherReport(isScheduled = true) {
  const url = "https://api.open-meteo.com/v1/forecast?latitude=10.4806&longitude=-66.9036&hourly=temperature_2m,apparent_temperature,precipitation_probability,weather_code,relative_humidity_2m,wind_speed_10m&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max,uv_index_max,weather_code&timezone=America%2FCaracas&forecast_days=1";
  
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Error consultando Open-Meteo: HTTP ${res.status}`);
  }
  const data = await res.json();

  const now = new Date();
  const options = { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "America/Caracas" };
  const rawDateStr = now.toLocaleDateString("es-VE", options);
  const capitalizedDate = rawDateStr.charAt(0).toUpperCase() + rawDateStr.slice(1);

  const tMin = Math.round(data.daily.temperature_2m_min[0]);
  const tMax = Math.round(data.daily.temperature_2m_max[0]);
  const rainMax = data.daily.precipitation_probability_max[0];
  const uvMax = data.daily.uv_index_max[0];
  const uvLabel = uvMax >= 8 ? "Muy Alto ⚠️" : (uvMax >= 6 ? "Alto" : "Moderado");

  const targetSlots = [
    { hour: "07:00", label: "🌅 07:00 hrs (Mañana / Inicio de Jornada)" },
    { hour: "12:00", label: "☀️ 12:00 hrs (Mediodía / Mayor Insolación)" },
    { hour: "16:00", label: "⛅ 16:00 hrs (Tarde / Retorno)" },
    { hour: "19:00", label: "🌆 19:00 hrs (Noche / Cierre)" }
  ];

  let slotsText = "";
  let hasHighRain = false;

  targetSlots.forEach(slot => {
    const idx = data.hourly.time.findIndex(t => t.endsWith(slot.hour));
    if (idx !== -1) {
      const temp = Math.round(data.hourly.temperature_2m[idx]);
      const appTemp = Math.round(data.hourly.apparent_temperature[idx]);
      const rain = data.hourly.precipitation_probability[idx];
      const hum = data.hourly.relative_humidity_2m[idx];
      const wind = Math.round(data.hourly.wind_speed_10m[idx]);
      const wInfo = getWmoInfo(data.hourly.weather_code[idx]);

      if (rain >= 50) hasHighRain = true;

      slotsText += 
        `*${slot.label}*\n` +
        `• ${wInfo.icon} *Condición:* ${wInfo.desc}\n` +
        `• 🌡️ *Temp:* ${temp}°C (Sensación: ${appTemp}°C)\n` +
        `• 🌧️ *Prob. Lluvia:* ${rain}% | 💧 *Humedad:* ${hum}%\n` +
        `• 💨 *Viento:* ${wind} km/h\n\n`;
    }
  });

  let recommendation = "Condiciones meteorológicas favorables en la Gran Caracas.";
  if (rainMax >= 70 || hasHighRain) {
    recommendation = "Alta probabilidad de precipitaciones durante la tarde/noche. Tome previsiones con paraguas y anticipe retrasos en el tránsito vehicular de la Gran Caracas.";
  } else if (tMax >= 30) {
    recommendation = "Jornada calurosa con alta radiación UV hacia el mediodía. Mantenga hidratación y protección solar.";
  }

  const emisionStr = isScheduled ? "06:00 AM (Emisión Diaria Automática)" : "Consulta en Vivo";

  const report = 
    `🌤️ *REPORTE METEOROLÓGICO DIARIO | CARACAS*\n` +
    `📅 *${capitalizedDate}*\n` +
    `⏰ *Hora de Emisión:* \`${emisionStr}\`\n\n` +
    `📊 *RESUMEN GENERAL DEL DÍA:*\n` +
    `• 🌡️ *Temp. Mín / Máx:* ${tMin}°C / ${tMax}°C\n` +
    `• 🌧️ *Probabilidad Máxima de Lluvia:* ${rainMax}%\n` +
    `• ☀️ *Índice UV Máximo:* ${uvMax} (${uvLabel})\n\n` +
    `━━━━━━━━━━━━━━━━━━━━\n` +
    `⏱️ *ESTIMACIONES HORARIAS CLAVE:*\n\n` +
    slotsText +
    `━━━━━━━━━━━━━━━━━━━━\n` +
    `💡 *Recomendación JARVIS:*\n${recommendation}\n\n` +
    `_Fuente: Red Meteorológica Open-Meteo & WMO_`;

  return report;
}

export default async function handler(req, res) {
  try {
    const isScheduled = req.query?.manual !== "true";
    const reportText = await generateWeatherReport(isScheduled);

    // Enviar mensaje a Telegram
    await sendTelegramMessage(ALLOWED_CHAT_ID, reportText);

    // Despacho 24/7 en la nube: Briefing Global IA (06:00 AM Caracas)
    try {
      const pendingJsonUrl = `${SUPABASE_URL}/storage/v1/object/nexus_buffer/cache/briefing_ia_pending.json?t=${Date.now()}`;
      const pendingAudioUrl = `${SUPABASE_URL}/storage/v1/object/nexus_buffer/cache/briefing_ia_pending.mp3?t=${Date.now()}`;

      const pRes = await fetch(pendingJsonUrl, {
        headers: {
          "apikey": SUPABASE_SERVICE_ROLE_KEY,
          "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
        }
      });

      if (pRes.ok) {
        const pkg = await pRes.json();
        // Si hay un paquete pendiente para hoy o para la fecha objetivo
        if (!pkg.delivered) {
          console.log(`[06:00 AM CRON] Despachando Briefing Global IA desde Supabase (Fecha: ${pkg.target_date || pkg.display_date})...`);

          // 1. Enviar mensaje de texto formateado
          if (pkg.telegram_html) {
            const urlMsg = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
            const msgRes = await fetch(urlMsg, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                chat_id: ALLOWED_CHAT_ID,
                text: pkg.telegram_html.slice(0, 4000),
                parse_mode: "HTML",
                disable_web_page_preview: true
              })
            });
            if (!msgRes.ok) {
              await fetch(urlMsg, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  chat_id: ALLOWED_CHAT_ID,
                  text: pkg.telegram_html.replace(/<[^>]+>/g, "").slice(0, 4000)
                })
              });
            }
          }

          // 2. Enviar audio MP3 de Paola
          const audioRes = await fetch(pendingAudioUrl, {
            headers: {
              "apikey": SUPABASE_SERVICE_ROLE_KEY,
              "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
            }
          });

          if (audioRes.ok) {
            const audioBuf = Buffer.from(await audioRes.arrayBuffer());
            const urlAudio = `https://api.telegram.org/bot${BOT_TOKEN}/sendAudio`;
            const formData = new FormData();
            const blob = new Blob([audioBuf], { type: "audio/mpeg" });

            formData.append("chat_id", ALLOWED_CHAT_ID);
            formData.append("audio", blob, "briefing_paola.mp3");
            formData.append("caption", `🎙️ <b>Briefing Global IA (${pkg.display_date || ""})</b>\n<i>Voz Oficial: Paola (NEXUS)</i>`);
            formData.append("parse_mode", "HTML");
            formData.append("title", `Briefing Global IA (${pkg.display_date || ""})`);
            formData.append("performer", "Paola (NEXUS)");

            const aResp = await fetch(urlAudio, { method: "POST", body: formData });
            if (!aResp.ok) {
              // Fallback a sendVoice
              const urlVoice = `https://api.telegram.org/bot${BOT_TOKEN}/sendVoice`;
              const fVoice = new FormData();
              fVoice.append("chat_id", ALLOWED_CHAT_ID);
              fVoice.append("voice", blob, "briefing_paola.mp3");
              fVoice.append("caption", `🎙️ Briefing Global IA (${pkg.display_date || ""}) - Paola`);
              await fetch(urlVoice, { method: "POST", body: fVoice });
            }
          }

          // 3. Marcar como entregado en Supabase
          pkg.delivered = true;
          pkg.delivered_at = new Date().toISOString();
          pkg.delivered_by = "vercel_cloud_cron_0600";

          await fetch(`${SUPABASE_URL}/storage/v1/object/nexus_buffer/cache/briefing_ia_pending.json`, {
            method: "PUT",
            headers: {
              "apikey": SUPABASE_SERVICE_ROLE_KEY,
              "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
              "Content-Type": "application/json",
              "x-upsert": "true"
            },
            body: JSON.stringify(pkg)
          });
          console.log("[06:00 AM CRON] Briefing Global IA entregado exitosamente a Telegram.");
        }
      }
    } catch (briefingErr) {
      console.error("Error en despacho de Briefing IA dentro de weather_cron:", briefingErr);
    }

    // Registrar estado en Supabase Storage para evitar duplicados
    const todayStr = new Date().toISOString().split("T")[0];
    const cacheUrl = `${SUPABASE_URL}/storage/v1/object/nexus_buffer/cache/last_weather_report.json`;
    await fetch(cacheUrl, {
      method: "PUT",
      headers: {
        "apikey": SUPABASE_SERVICE_ROLE_KEY,
        "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        date: todayStr,
        delivered: true,
        delivered_at: new Date().toISOString(),
        source: "vercel_cloud_cron"
      })
    });

    return res.status(200).json({
      ok: true,
      status: "delivered",
      timestamp: new Date().toISOString(),
      recipient: ALLOWED_CHAT_ID
    });
  } catch (error) {
    console.error("Error en weather_cron:", error);
    return res.status(500).json({ ok: false, error: error.message });
  }
}
