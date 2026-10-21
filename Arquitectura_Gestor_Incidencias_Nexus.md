# 🏛️ Arquitectura: Gestor de Incidencias NEXUS

**Fecha:** 2026-09-21
**Inspiración:** Basado en el enfoque de Matt Pocock, que utiliza el gestor de incidencias (archivos locales, GitHub, Linear) como el cerebro/memoria a largo plazo de los agentes de IA.

---

## 💡 El Concepto
En lugar de depender de herramientas pesadas como Jira, NEXUS utilizará **Obsidian como su Gestor de Incidencias Local**. 

Cuando el sistema (como el webhook de Vercel) capture un error fatal (ej. 502 Bad Gateway), no fallará en silencio. Envolverá el error en un "Ticket", lo subirá a Supabase y el `nexus_cloud_sync` lo escribirá directamente en el `Inbox.md` de Obsidian con etiquetas `#bug` y prioridades para que sea atendido.

---

## 1. Arquitectura del Sistema (Macro)

```mermaid
graph TD
    classDef telegram fill:#2CA5E0,stroke:#fff,stroke-width:2px,color:#fff;
    classDef vercel fill:#000,stroke:#fff,stroke-width:2px,color:#fff;
    classDef supabase fill:#3ECF8E,stroke:#fff,stroke-width:2px,color:#fff;
    classDef local fill:#7B61FF,stroke:#fff,stroke-width:2px,color:#fff;
    classDef obsidian fill:#7C3AED,stroke:#fff,stroke-width:2px,color:#fff;

    User((Usuario / Jarvis)):::telegram
    TG[Telegram API]:::telegram
    
    subgraph "Vercel Serverless (Node.js)"
        API[telegram.js Webhook]:::vercel
        ErrorHandler[Manejador de Errores]:::vercel
    end
    
    subgraph "Supabase Cloud"
        DB[(nexus_buffer)]:::supabase
    end
    
    subgraph "Laptop Local (Daemon)"
        Sync[nexus_cloud_sync.py]:::local
        Obsidian[Obsidian Inbox.md]:::obsidian
    end

    User <-->|Comandos| TG
    TG -->|POST Webhook| API
    API -->|Guarda JSON| DB
    DB -.->|Polling| Sync
    Sync -->|Escribe Archivo| Obsidian

    API -- "Falla o Try/Catch" --> ErrorHandler
    ErrorHandler -- "Sube ticket.json" --> DB
    ErrorHandler -.->|Alerta Urgente| TG
```

---

## 2. Flujo de Secuencia: Ciclo de Vida de una Incidencia

```mermaid
sequenceDiagram
    autonumber
    actor Usuario
    participant Vercel as telegram.js (Node)
    participant Supabase as Supabase Storage
    participant Daemon as nexus_cloud_sync
    participant Obsidian as Inbox.md

    Usuario->>Vercel: Envía Comando (/menu)
    Vercel->>Vercel: Procesa Lógica (try/catch)
    
    rect rgb(255, 200, 200)
        Note right of Vercel: Ocurre una excepción crítica
        Vercel-->>Usuario: ⚠️ Algo falló (Mensaje de contingencia)
        Vercel->>Vercel: Genera Ticket en formato JSON
    end
    
    Vercel->>Supabase: upload(ticket_error_123.json)
    
    loop Cada 5 minutos
        Daemon->>Supabase: Revisa nuevos archivos
    end
    
    Supabase-->>Daemon: Retorna ticket_error_123.json
    Daemon->>Daemon: Parsea prioridad (P1, P2)
    
    rect rgb(200, 255, 200)
        Note right of Daemon: Creación en Gestor Local
        Daemon->>Obsidian: Append a Inbox.md
        Note over Obsidian: #bug 🔴 INCIDENCIA CRÍTICA
    end
```

---

## 3. Patrón de Implementación en Node.js (Vercel)

Implementaremos un patrón de "Error Boundary" en `telegram.js` para atrapar errores y enviarlos a la bóveda.

```javascript
// 1. Clase constructora del Ticket
class NexusTicket {
    constructor(error, context) {
        this.id = `INC-${Date.now()}`;
        this.priority = this.determinePriority(error);
        this.title = `Fallo en ${context.action || 'Webhook'}`;
        this.description = error.message;
        this.stack = error.stack;
        this.timestamp = new Date().toISOString();
        this.status = "TODO";
    }

    determinePriority(error) {
        if (error.message.includes('timeout') || error.message.includes('502')) return 'P1';
        return 'P3';
    }

    toObsidianMarkdown() {
        return `
### 🔴 [${this.priority}] ${this.title}
- **ID:** ${this.id}
- **Fecha:** ${this.timestamp}
- **Descripción:** ${this.description}
- **Estado:** [ ] Pendiente de revisión
- **Contexto técnico:**
\`\`\`text
${this.stack}
\`\`\`
---`;
    }
}

// 2. Wrapper para manejar todas las rutas y atrapar errores
async function withIncidentTracker(handlerFn, context) {
    try {
        return await handlerFn();
    } catch (error) {
        console.error("Error capturado por el Gestor de Incidencias:", error);
        
        const ticket = new NexusTicket(error, context);
        
        await supabase.storage
            .from('nexus_buffer')
            .upload(`pending/ticket_${ticket.id}.json`, JSON.stringify(ticket));
            
        await sendTelegramMessage(ADMIN_CHAT_ID, `⚠️ Nueva Incidencia ${ticket.priority}: ${ticket.title}`);
        
        return { statusCode: 200, body: 'Error logged' };
    }
}
```
