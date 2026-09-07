import { sendPaolaVoiceNote } from "./api/tts.js";

const chatId = "1274149213";
const text = process.argv[2];
const caption = process.argv[3] || "Notificación del Asistente";

if (!text) {
  console.error("Uso: node notify.js <texto_hablado> [caption_opcional]");
  process.exit(1);
}

console.log(`Generando y enviando notificación de voz a ${chatId}...`);
sendPaolaVoiceNote(chatId, text, caption)
  .then(success => {
    if (success) {
      console.log("¡Notificación de voz enviada exitosamente por Telegram!");
    } else {
      console.error("Fallo al enviar la notificación de voz.");
    }
    process.exit(0);
  })
  .catch(err => {
    console.error("Error inesperado:", err);
    process.exit(1);
  });
