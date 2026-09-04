// Módulo de Síntesis de Voz de Paola (es-VE-PaolaNeural)
// Compatible con Node.js en Vercel Serverless Functions

import { MsEdgeTTS, OUTPUT_FORMAT } from "msedge-tts";

const BOT_TOKEN = "8714829831:AAEMd6h0cNM7_AZYvzjJsm8CRGZCpWK0xsI";

/**
 * Genera un buffer de audio MP3 usando la voz oficial de Paola (Venezuela)
 */
export async function generatePaolaAudioBuffer(text) {
  const tts = new MsEdgeTTS();
  await tts.setMetadata("es-VE-PaolaNeural", OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3);

  // Limpiar texto para lectura fonética natural
  const cleanText = text
    .replace(/[*_`~#\[\]()]/g, " ")
    .replace(/[^\w\s.,;:¿?¡!áéíóúÁÉÍÓÚñÑüÜ/-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (!cleanText) return null;

  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error("Timeout generando audio de Paola con Edge TTS (8s)"));
    }, 8000);

    try {
      const { audioStream } = tts.toStream(cleanText);
      const chunks = [];

      audioStream.on("data", (chunk) => {
        chunks.push(chunk);
      });

      audioStream.on("end", () => {
        clearTimeout(timer);
        const buffer = Buffer.concat(chunks);
        resolve(buffer);
      });

      audioStream.on("error", (err) => {
        clearTimeout(timer);
        reject(err);
      });
    } catch (err) {
      clearTimeout(timer);
      reject(err);
    }
  });
}

/**
 * Envía una nota de voz oficial de Paola a un chat de Telegram
 */
export async function sendPaolaVoiceNote(chatId, spokenText, caption = "") {
  try {
    const audioBuffer = await generatePaolaAudioBuffer(spokenText);
    if (!audioBuffer || audioBuffer.length === 0) {
      console.warn("No se pudo generar buffer de audio para Paola.");
      return false;
    }

    const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendVoice`;
    const formData = new FormData();
    const blob = new Blob([audioBuffer], { type: "audio/mpeg" });

    formData.append("chat_id", chatId);
    formData.append("voice", blob, "paola_announcement.mp3");
    if (caption) {
      formData.append("caption", caption);
      formData.append("parse_mode", "Markdown");
    }

    const res = await fetch(url, {
      method: "POST",
      body: formData
    });

    const data = await res.json();
    return data.ok === true;
  } catch (err) {
    console.error("Error enviando nota de voz de Paola:", err);
    return false;
  }
}
