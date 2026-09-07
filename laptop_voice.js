import { MsEdgeTTS, OUTPUT_FORMAT } from "msedge-tts";
import { exec } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const VOICE_DAVID = "es-VE-SebastianNeural";
const text = process.argv[2];

if (!text) {
  console.error("Uso: node laptop_voice.js <texto>");
  process.exit(1);
}

async function speakLocally(text) {
  const tts = new MsEdgeTTS();
  await tts.setMetadata(VOICE_DAVID, OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3);
  
  const tempFile = path.join(__dirname, `temp_david_voice_${Date.now()}.mp3`);
  
  return new Promise((resolve, reject) => {
    const { audioStream } = tts.toStream(text);
    const chunks = [];
    
    audioStream.on("data", (chunk) => chunks.push(chunk));
    audioStream.on("end", () => {
      fs.writeFileSync(tempFile, Buffer.concat(chunks));
      // Reproducir localmente usando pygame.mixer en Python (Enseñanza PE-25)
      const pyCommand = `python -c "import pygame, time; pygame.mixer.init(); pygame.mixer.music.load('${tempFile.replace(/\\/g, '/')}'); pygame.mixer.music.play(); exec('while pygame.mixer.music.get_busy(): time.sleep(0.1)')"`;
      
      exec(pyCommand, (err) => {
        if (fs.existsSync(tempFile)) {
          try { fs.unlinkSync(tempFile); } catch(e){}
        }
        if (err) reject(err);
        else resolve();
      });
    });
    audioStream.on("error", reject);
  });
}

console.log("Generando voz de David y reproduciendo en la laptop...");
speakLocally(text)
  .then(() => process.exit(0))
  .catch(err => {
    console.error("Error reproduciendo audio:", err);
    process.exit(1);
  });
