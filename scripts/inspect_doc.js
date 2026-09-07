import { getGoogleAccessToken } from "../api/gmail.js";

async function main() {
  const token = await getGoogleAccessToken();
  const docId = "17uh5_1XNd70ZTBCm7vvl6JWAT94ZpI48AZLL9Dd2GB4"; // The Google Doc from 16:46
  const res = await fetch(`https://docs.googleapis.com/v1/documents/${docId}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const doc = await res.json();
  console.log("Doc title:", doc.title);
  console.log("Doc inlineObjects:", JSON.stringify(doc.inlineObjects, null, 2));
  console.log("Doc positionedObjects:", JSON.stringify(doc.positionedObjects, null, 2));
}

main().catch(console.error);
