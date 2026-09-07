// Google Workspace / Gmail Cloud Service 24/7 para JARVIS
// Permite crear borradores y gestionar correos directamente desde la nube sin depender de la laptop

const GOOGLE_CREDS_B64 = process.env.GOOGLE_OAUTH_CREDS || 
  "eyJjbGllbnRfaWQiOiAiNjE0MzQ2NTYzNzQzLTdoNDlka2JnNnR1Y2lqZXBhYzU4Ymc3aDQ5bGtjczZjLmFwcHMuZ29vZ2xldXNlcmNvbnRlbnQuY29tIiwgImNsaWVudF9zZWNyZXQiOiAiR09DU1BYLUNiOFlsbnN5eWhzNTBYc2M0V0VJWHUxYkZfVF8iLCAicmVmcmVzaF90b2tlbiI6ICIxLy8wNUhDNWdoT3MzX3lGQ2dZSUFSQUFHQVVTTndGLUw5SXJxU3cxbndIaG1DZzFUUmxPUTZublhSclBSTnF4dWF2aHdweDVJUncwdF9Wb3ViOWtiLXBvWi03c2drN0kwR05OWmpZIiwgInRva2VuX3VyaSI6ICJodHRwczovL29hdXRoMi5nb29nbGVhcGlzLmNvbS90b2tlbiJ9";

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

/**
 * Crea un evento en Google Calendar directamente desde la nube 24/7
 */
export async function createCalendarEventCloud(eventData) {
  try {
    const token = await getGoogleAccessToken();
    const dateStr = eventData.date || new Date().toISOString().split("T")[0];
    const startTime = eventData.start_time || "10:00";
    const endTime = eventData.end_time || "11:00";

    const startIso = `${dateStr}T${startTime}:00-04:00`;
    const endIso = `${dateStr}T${endTime}:00-04:00`;

    const payload = {
      summary: eventData.summary || eventData.title || "Reunión de Trabajo CUSPAL",
      description: eventData.description || "Agendado automáticamente por JARVIS Cloud Gateway",
      start: { dateTime: startIso, timeZone: "America/Caracas" },
      end: { dateTime: endIso, timeZone: "America/Caracas" }
    };

    const res = await fetch("https://www.googleapis.com/calendar/v3/calendars/primary/events", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    if (res.ok) {
      const data = await res.json();
      return { ok: true, id: data.id, link: data.htmlLink };
    } else {
      const errTxt = await res.text();
      console.error("Error en Google Calendar API:", errTxt);
      return { ok: false, error: errTxt };
    }
  } catch (e) {
    console.error("Excepción creando evento en Calendar:", e);
    return { ok: false, error: e.message };
  }
}

/**
 * Busca contactos en Google Contacts (People API) por nombre, apellido o correo
 */
export async function searchGoogleContactsCloud(query) {
  if (!query || !query.trim()) return [];
  try {
    const token = await getGoogleAccessToken();
    const encoded = encodeURIComponent(query.trim());
    const url = `https://people.googleapis.com/v1/people:searchContacts?query=${encoded}&readMask=names,emailAddresses,phoneNumbers`;
    const res = await fetch(url, {
      headers: { "Authorization": `Bearer ${token}` }
    });

    if (res.ok) {
      const data = await res.json();
      const results = data.results || [];
      const contacts = results.map(r => {
        const p = r.person || {};
        return {
          name: p.names?.[0]?.displayName || "Sin nombre",
          email: p.emailAddresses?.[0]?.value || "",
          phone: p.phoneNumbers?.[0]?.value || ""
        };
      });
      if (contacts.length > 0) return contacts;
    }

    // Fallback: listar conexiones y filtrar en memoria
    const listUrl = `https://people.googleapis.com/v1/people/me/connections?personFields=names,emailAddresses,phoneNumbers&pageSize=250`;
    const listRes = await fetch(listUrl, {
      headers: { "Authorization": `Bearer ${token}` }
    });
    if (!listRes.ok) return [];
    const listData = await listRes.json();
    const conns = listData.connections || [];
    const qLower = query.toLowerCase().trim();
    return conns.filter(c => {
      const name = c.names?.[0]?.displayName?.toLowerCase() || "";
      const email = c.emailAddresses?.[0]?.value?.toLowerCase() || "";
      return name.includes(qLower) || email.includes(qLower);
    }).map(c => ({
      name: c.names?.[0]?.displayName || "Sin nombre",
      email: c.emailAddresses?.[0]?.value || "",
      phone: c.phoneNumbers?.[0]?.value || ""
    }));
  } catch (e) {
    console.error("Error buscando contactos en Google People API:", e);
    return [];
  }
}

/**
 * Resuelve automáticamente el correo de un contacto por su nombre
 */
export async function resolveContactEmail(nameOrEmail) {
  if (!nameOrEmail || !nameOrEmail.trim()) return "";
  const clean = nameOrEmail.trim();
  // Si ya es un correo electrónico válido, devolverlo
  if (/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(clean)) {
    return clean;
  }
  // Buscar en la libreta de contactos
  const contacts = await searchGoogleContactsCloud(clean);
  if (contacts && contacts.length > 0) {
    const withEmail = contacts.find(c => c.email && c.email.includes("@"));
    if (withEmail) return withEmail.email;
  }
  return clean;
}

