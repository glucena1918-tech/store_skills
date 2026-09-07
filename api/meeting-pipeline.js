// Vercel Serverless Function: Pipeline de Minutas de Reunión
// Integra: Grabadora Web ➔ Google Drive (MINUTA REUNIÓN / 01_AUDIOS_ENTRADA) ➔ Webhook Make.com
// Endpoint: https://store-skills.vercel.app/api/meeting-pipeline

import { getGoogleAccessToken } from "./gmail.js";

const AUDIOS_ENTRADA_FOLDER_ID = "1XpfeJI1_CMeYv7SJkolevv78R6TvECRC"; // MINUTA REUNIÓN / 01_AUDIOS_ENTRADA
const MAKE_WEBHOOK_URL = "https://hook.eu2.make.com/bahndwb3u79hqcnjdvwbuy2pkwuddxo4";

export default async function handler(req, res) {
  // Configurar CORS para llamadas desde la MiniWeb
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  try {
    const token = await getGoogleAccessToken();

    // ------------------------------------------------------------------------
    // ACCIÓN 1: GET /api/meeting-pipeline?action=create-session&title=...
    // Crea la carpeta única en Google Drive y devuelve { folderId, accessToken }
    // ------------------------------------------------------------------------
    if (req.method === "GET") {
      const { searchParams } = new URL(req.url, `https://${req.headers.host || "store-skills.vercel.app"}`);
      const action = searchParams.get("action") || "create-session";
      const title = searchParams.get("title") || "Reunión";
      const dateStr = new Date().toLocaleString("es-VE", { timeZone: "America/Caracas" }).replace(/\//g, "-");

      if (action === "create-session") {
        const folderName = `${title.trim()} - ${dateStr}`;

        const driveRes = await fetch("https://www.googleapis.com/drive/v3/files", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            name: folderName,
            mimeType: "application/vnd.google-apps.folder",
            parents: [AUDIOS_ENTRADA_FOLDER_ID]
          })
        });

        if (!driveRes.ok) {
          const errText = await driveRes.text();
          throw new Error(`Google Drive API error (${driveRes.status}): ${errText}`);
        }

        const folderData = await driveRes.json();
        return res.status(200).json({
          ok: true,
          folderId: folderData.id,
          folderName: folderName,
          accessToken: token,
          makeWebhookUrl: MAKE_WEBHOOK_URL
        });
      }

      // Si solo pide token
      if (action === "get-token") {
        return res.status(200).json({ ok: true, accessToken: token });
      }

      return res.status(400).json({ ok: false, error: "Acción no soportada" });
    }

    // ------------------------------------------------------------------------
    // ACCIÓN 2: POST /api/meeting-pipeline (Disparador seguro de Make)
    // Recibe { folder_id, titulo, lugar, fecha, hora, asistentes, foto_base64 }
    // y hace el despacho garantizado a Make.com
    // ------------------------------------------------------------------------
    if (req.method === "POST") {
      const body = req.body || {};
      const { folder_id, titulo, lugar, fecha, hora, asistentes, foto_url, foto_base64, foto_name } = body;

      if (!folder_id) {
        return res.status(400).json({ ok: false, error: "folder_id es obligatorio para Make" });
      }

      // Construir FormData para Make
      const formData = new FormData();
      formData.append("folder_id", folder_id);
      formData.append("titulo", titulo || "Reunión Sin Título");
      formData.append("nombre_reunion", titulo || "Reunión Sin Título");
      formData.append("lugar", lugar || "Oficina");
      formData.append("lugar_reunion", lugar || "Oficina");
      formData.append("fecha", fecha || "");
      formData.append("hora", hora || "");
      formData.append("asistentes", asistentes || "Gonzalo Lucena");

      // Si viene foto en base64, convertirla a Blob para Make
      if (foto_base64) {
        const base64Data = foto_base64.replace(/^data:image\/\w+;base64,/, "");
        const photoBuffer = Buffer.from(base64Data, "base64");
        const photoBlob = new Blob([photoBuffer], { type: "image/jpeg" });
        formData.append("foto", photoBlob, foto_name || "foto_reunion.jpg");
      }

      console.log(`[MeetingPipeline] Despachando a Make Webhook con folder_id: ${folder_id}...`);
      const makeRes = await fetch(MAKE_WEBHOOK_URL, {
        method: "POST",
        body: formData
      });

      const makeText = await makeRes.text();
      console.log(`[MeetingPipeline] Respuesta de Make: ${makeRes.status} - ${makeText}`);

      return res.status(200).json({
        ok: makeRes.ok,
        status: makeRes.status,
        makeResponse: makeText,
        folder_id: folder_id
      });
    }

    return res.status(405).json({ ok: false, error: "Método no permitido" });
  } catch (err) {
    console.error("[MeetingPipeline] Error fatal:", err);
    return res.status(500).json({ ok: false, error: err.message });
  }
}
