// Google Workspace / Gmail Cloud Service 24/7 para JARVIS
// Permite crear borradores y gestionar correos directamente desde la nube sin depender de la laptop

const GOOGLE_CREDS_B64 = process.env.GOOGLE_OAUTH_CREDS || 
  "eyJjbGllbnRfaWQiOiAiNjE0MzQ2NTYzNzQzLTdoNDlka2JnNnR1Y2lqZXBhYzU4Ymc3aDQ5bGtjczZjLmFwcHMuZ29vZ2xldXNlcmNvbnRlbnQuY29tIiwgImNsaWVudF9zZWNyZXQiOiAiR09DU1BYLUNiOFlsbnN5eWhzNTBYc2M0V0VJWHUxYkZfVF8iLCAicmVmcmVzaF90b2tlbiI6ICIxLy8wNWFYTlBYc3pUZV83Q2dZSUFSQUFHQVVTTndGLUw5SXJfTXpHSnFVV0wza3MzRXJKWFQwbmVJeWpCWTVNMVhnTW9qbGNVUHJOQm9Fak0yQnBTam9maGlFQ0xHWWg1U0ZxS1pZIiwgInRva2VuX3VyaSI6ICJodHRwczovL29hdXRoMi5nb29nbGVhcGlzLmNvbS90b2tlbiJ9";

let cachedToken = null;
let tokenExpiry = 0;

export async function getGoogleAccessToken() {
  const now = Date.now();
  if (cachedToken && tokenExpiry > now + 60000) {
    return cachedToken;
  }

  try {
    const creds = JSON.parse(Buffer.from(GOOGLE_CREDS_B64, "base64").toString("utf-8"));
    const params = new URLSearchParams({
      client_id: creds.client_id,
      client_secret: creds.client_secret,
      refresh_token: creds.refresh_token,
      grant_type: "refresh_token"
    });

    const res = await fetch(creds.token_uri || "https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params.toString()
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Google OAuth error (${res.status}): ${errText}`);
    }

    const data = await res.json();
    cachedToken = data.access_token;
    tokenExpiry = now + ((data.expires_in || 3600) * 1000);
    return cachedToken;
  } catch (err) {
    console.error("Error renovando Google Access Token:", err);
    throw err;
  }
}

/**
 * Crea un borrador oficial en Gmail directamente desde la nube
 */
export async function createGmailDraftCloud(subject, body, to = "") {
  try {
    const token = await getGoogleAccessToken();

    const emailHeaders = [
      `Subject: =?utf-8?B?${Buffer.from(subject).toString("base64")}?=`,
      "Content-Type: text/plain; charset=utf-8",
      "MIME-Version: 1.0"
    ];

    if (to && to.trim()) {
      emailHeaders.push(`To: ${to.trim()}`);
    }

    const fullMessage = `${emailHeaders.join("\r\n")}\r\n\r\n${body}`;
    const raw = Buffer.from(fullMessage)
      .toString("base64")
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");

    const res = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/drafts", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        message: { raw: raw }
      })
    });

    if (!res.ok) {
      const errData = await res.text();
      console.error("Error en API Gmail Drafts:", errData);
      return { ok: false, error: errData };
    }

    const draft = await res.json();
    return {
      ok: true,
      draftId: draft.id,
      messageId: draft.message?.id
    };
  } catch (e) {
    console.error("Excepción creando borrador en Gmail:", e);
    return { ok: false, error: e.message };
  }
}

/**
 * Envía un correo electrónico directamente desde Gmail
 */
export async function sendGmailEmailCloud(to, subject, body) {
  try {
    const token = await getGoogleAccessToken();

    const emailHeaders = [
      `To: ${to.trim()}`,
      `Subject: =?utf-8?B?${Buffer.from(subject).toString("base64")}?=`,
      "Content-Type: text/plain; charset=utf-8",
      "MIME-Version: 1.0"
    ];

    const fullMessage = `${emailHeaders.join("\r\n")}\r\n\r\n${body}`;
    const raw = Buffer.from(fullMessage)
      .toString("base64")
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");

    const res = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ raw: raw })
    });

    if (!res.ok) {
      const errData = await res.text();
      return { ok: false, error: errData };
    }

    const sent = await res.json();
    return {
      ok: true,
      messageId: sent.id
    };
  } catch (e) {
    console.error("Excepción enviando correo en Gmail:", e);
    return { ok: false, error: e.message };
  }
}
