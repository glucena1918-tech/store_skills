import { getGoogleAccessToken } from "../api/gmail.js";

async function main() {
  const token = await getGoogleAccessToken();
  const parentId = "1FSEVr3Bq8vlKAq-RbOT755rArrSCxUi3"; // MINUTA REUNIÓN

  // Check if 01_AUDIOS_ENTRADA exists
  const query = `'${parentId}' in parents and name = '01_AUDIOS_ENTRADA' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`;
  const sRes = await fetch(`https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const sData = await sRes.json();
  if (sData.files && sData.files.length > 0) {
    console.log("Found existing 01_AUDIOS_ENTRADA:", sData.files[0].id);
    return sData.files[0].id;
  }

  // Create it
  const cRes = await fetch("https://www.googleapis.com/drive/v3/files", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      name: "01_AUDIOS_ENTRADA",
      mimeType: "application/vnd.google-apps.folder",
      parents: [parentId]
    })
  });
  const cData = await cRes.json();
  console.log("Created 01_AUDIOS_ENTRADA:", cData.id);
  return cData.id;
}

main().catch(console.error);
