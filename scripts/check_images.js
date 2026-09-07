import { getGoogleAccessToken } from "../api/gmail.js";

async function main() {
  const token = await getGoogleAccessToken();
  const q = encodeURIComponent("mimeType contains 'image'");
  const res = await fetch(`https://www.googleapis.com/drive/v3/files?q=${q}&pageSize=15&fields=files(id,name,mimeType,createdTime,parents,size)`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const data = await res.json();
  console.log("Images found in Drive:", JSON.stringify(data.files, null, 2));
}

main().catch(console.error);
