---
tags: [nexus/incident, type/jarvis_media, status/resolved]
status: resolved
created: 2026-10-24T10:07:00.000-04:00
resolved: 2026-10-24T10:20:00.000-04:00
resolution: "Creación del módulo core/live_media_guard.py implementando NoiseGate con umbral RMS (0.015) para descartar silencio y ruido ambiental, CameraPrivacyGuard bloqueando la activación autónoma de la cámara web salvo orden explícita del Comandante, y TranscriptFilter para suprimir alucinaciones de audio en scripts no latinos (coreano/chino). Integración en core/live_engine.py reduciendo el conteo total a 2.439 líneas en estricto cumplimiento de la Regla 19."
---
# 🚨 Nexus Incident: JARVIS_HOTMIC_GHOST_ACTIVATION

**ID:** `INC-20261024-HOTMIC`  
**Servicio:** JARVIS Mark LIV Core & Captura de Medios (Audio / Visión)  
**Severidad:** 🔴 ALTA (Privacidad y Activación no autorizada de hardware)  
**Estado:** `RESOLVED`  
**Referencia Técnica:** [[GEMINI.md#19. Gobernanza de Límite Máximo de Código (2.500 Líneas)]] & [[GEMINI.md#15. Gobernanza de Cierre de Incidencias & Tickets]]

---

## 📌 Descripción del Fallo
Tras el inicio automático de JARVIS con Windows a las 08:38, sin que el Comandante interactuara ni hablara frente al equipo, el asistente comenzó a interactuar solo en el registro de la interfaz:
1. Emisión de transcripciones en coreano (`You: 수미 몇 살이야? 너는 몇 살이야?`) y alemán (`You: das Video der Kamera ist wieder online.`).
2. Activación física del sensor de la cámara web (`screen_process(angle="camera")`) respondiendo a frases ambiguas de audio capturadas del ambiente (*"Ya está ya está... Es un encanto... están viniendo bastante"*), describiendo la imagen de la habitación (*"Veo que la visual de la cámara muestra una persona frente a una pared gris"*).
3. Ejecución no solicitada de una herramienta de búsqueda web en internet: `[Search:news] noticias recientes Shenzhen personas o movimiento inusual`.
4. El ciclo solo cesó cuando el Comandante silenció manualmente el micrófono en el HUD (`SYS: Microphone muted.`).

---

## 🔍 Causa Raíz
1. **Micrófono Siempre Abierto sin Compuerta de Silencio (*Always-on Hot Mic*):** `_listen_audio` en `live_engine.py` abría el stream de entrada PCM de Realtek y enviaba cada bloque directamente a `out_queue` sin verificar un umbral de volumen mínimo (Noise Gate). El micrófono captaba ruidos estáticos, audios de televisores o videos cercanos y los transmitía a Google Gemini Live.
2. **Alucinaciones Multilingües del Reconocedor de Voz (ASR):** Ante ruidos de baja amplitud o fonemas distantes, el modelo ASR multilingüe de Gemini Live intentó empatar el ruido con lenguajes aprendidos, generando alucinaciones en coreano y alemán.
3. **Ausencia de Verificación de Intención para la Cámara Web:** La herramienta interna `screen_process(angle="camera")` se ejecutaba ciegamente cuando el modelo lo decidía, activando la cámara web física sin exigir confirmación previa del Comandante.
4. **Alucinación Encadenada de Búsqueda:** El modelo asoció fragmentos de audio ambiental con noticias internacionales y llamó a `web_search` sobre Shenzhen.

---

## 🛠️ Solución Implementada
1. **Creación de `core/live_media_guard.py`:**
   - **`NoiseGate`:** Compuerta de audio basada en nivel RMS (umbral mínimo 0.015 con 8 frames de amortiguación). Los bloques de silencio o ruido ambiental bajo son descartados localmente sin transmitirse a la nube.
   - **`CameraPrivacyGuard`:** Barrera de privacidad que bloquea toda llamada a `angle="camera"` a menos que exista una orden explícita en las últimas intervenciones del usuario (*"activa la cámara"*, *"mira por la cámara"*).
   - **`TranscriptFilter`:** Filtro de ASR que intercepta y suprime transcripciones que contengan caracteres no latinos (Hangul, CJK, Cirílico) cuando el sistema opera en español.
2. **Integración en `core/live_engine.py`:**
   - Enlace directo de `self._noise_gate` en `_listen_audio` y de `CameraPrivacyGuard` en `screen_process`.
   - Limpieza de comentarios redundantes, logrando que el conteo de líneas de `live_engine.py` **bajara de 2.459 a 2.439 líneas**, garantizando estricta gobernanza con la Regla 19.
3. **Suite de Pruebas Unitarias:** Creado `tests_media_guard_verification.py` con 7 pruebas automatizadas que verifican el filtrado de ruido, el bloqueo de cámara y la supresión de scripts asiáticos (100% aprobadas).

---

## Acciones de Verificación y Cierre
- [x] Diagnóstico empírico de causa raíz verificado con logs y trazas de `_listen_audio` y `screen_process`.
- [x] Creación del módulo desacoplado `JARVIS_MARK_LIV/core/live_media_guard.py`.
- [x] Integración de `NoiseGate`, `CameraPrivacyGuard` y `TranscriptFilter` en `core/live_engine.py`.
- [x] Auditoría de límite de líneas: `live_engine.py` cuenta con 2.439 líneas (cumplimiento total de la Regla 19 < 2.500).
- [x] Ejecución de suite de pruebas `tests_media_guard_verification.py` (7 tests ejecutados con código 0 OK).
- [x] Auditoría de seguridad con `scripts/audit_ciberseguridad.py` sobre `JARVIS_MARK_LIV/core` (Score: 100/100 A+).
- [x] Actualización del índice de incidencias `PROYECTOS DE ANTIGRAVITY/3_Archivo_Historico/store_skills/incidencias/_Index.md`.
- [x] Registro y trazabilidad en la Bitácora Diaria [[24-10-2026]].
- [x] Archivo formal del ticket [[INC-20261024-HOTMIC]].
