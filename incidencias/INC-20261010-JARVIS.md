---
tags: [nexus/incident, type/jarvis_governance, status/resolved]
status: resolved
created: 2026-10-10T09:52:55.000-04:00
resolved: 2026-10-10T10:05:00.000-04:00
resolution: "Reprogramación y blindaje integral de JARVIS Mark LIV: fijación de ventana mínima de 3600s (1 hora) para chequeos ergonómicos, erradicación de falsas referencias a proyectos de Power BI en memoria y prompts, y veto permanente con lista negra a Napoleón Bonaparte y Sun Tzu en daily_quote_manager, proactive.py, prompt.txt y GEMINI.md."
---
# 🚨 Nexus Incident: JARVIS_GOVERNANCE_DRIFT

**ID:** `INC-20261010-JARVIS`  
**Servicio:** JARVIS Mark LIV Core & Subagentes  
**Severidad:** 🔴 ALTA  
**Estado:** `RESOLVED`  
**Referencia Técnica:** [[GEMINI.md#16. Gobernanza Suprema de Citas, Frecuencia de Descanso y Erradicación de Falsos Proyectos]]

---

## 📌 Descripción del Fallo
El Comandante reportó desviaciones de conducta inaceptables en JARVIS:
1. Interrupciones con recordatorios de descanso cada 5 minutos, rompiendo el flujo de trabajo.
2. Alucinación e insistencia reiterada sobre avances en un inexistente "Proyecto de Power BI".
3. Insistencia recurrente en citas y pensamientos de Napoleón Bonaparte y Sun Tzu, a pesar de rechazos previos explícitos.

## 🔍 Causa Raíz
1. **Falta de Guardrail Temporal en ProactiveEngine (`proactive.py`):** La rotación de contexto (`_rotation % 3`) activaba el foco ergonómico en ciclos cortos (cada 20 min o ante silencios breves) sin verificar un piso mínimo de 1 hora de trabajo continuo.
2. **Sembrado de Alucinación en Memoria y Sesiones (`long_term.json`):** El campo `identity.comandante` contenía `(Power BI / DAX)` y los resúmenes de sesiones anteriores registraron interacciones pasadas sobre Power BI, alimentando el sesgo en el prompt builder.
3. **Hardcoding y Ausencia de Lista Negra en Generador de Citas (`daily_quote_manager.py` y `prompt.txt`):** Sun Tzu estaba codificado en la lista de contingencia offline (`STRATEGIC_QUOTES`), como ejemplo en el prompt de Gemini online y en `core/prompt.txt`. No existía una función de filtrado/veto que interceptara a Napoleón y Sun Tzu.

## 🛠️ Solución Implementada
- **Piso de 1 Hora en ProactiveEngine (`actions/proactive.py`):** Variable `min_break_interval = 3600` (1 hora) y `_last_break_reminder`. Si no ha transcurrido 1 hora completa de operación continua, el foco de descanso es bloqueado automáticamente y reemplazado por silencio o insight estratégico.
- **Veto Permanente y Sanitización en Citas (`plugins/daily_quote_manager.py`):**
  - Eliminadas citas de Sun Tzu de `STRATEGIC_QUOTES` (reemplazadas por Simón Bolívar y George S. Patton).
  - Implementada lista negra `BANNED_AUTHORS = ['napoleon', 'napoleón', 'bonaparte', 'sun tzu', 'suntzu', 'sunzi', 'sun-tzu', 'sun tsu']` y validador `is_banned_author()`.
  - Descarte estricto en búsqueda web (DDG), generación online (Gemini) y contingencia offline.
  - Bloqueo preventivo en `run()` con aviso directo si el usuario o el modelo solicita un autor vetado.
- **Erradicación de Falsos Proyectos en Memoria (`memory/long_term.json`):**
  - Removido `(Power BI / DAX)` de `identity.comandante`.
  - Agregadas directivas explícitas de preferencias: `anti_hallucination_powerbi`, `frecuencia_descanso` y `veto_autores`.
  - Saneamiento de resúmenes históricos de sesión eliminando menciones erróneas.
- **Actualización de Protocolo Central y Gobernanza (`core/prompt.txt` y `GEMINI.md`):**
  - Incorporada sección `[GOBERNANZA SUPREMA :: DESCANSOS, PROYECTOS Y AUTORES]` en `prompt.txt`.
  - Añadida **Regla Inquebrantable #16** en `GEMINI.md` consagrando el veto permanente de Napoleón y Sun Tzu, descanso mínimo de 1 hora y erradicación de falsos proyectos de Power BI.

---

## Acciones de Verificación y Cierre
- [x] Diagnóstico empírico de causa raíz en `proactive.py`, `daily_quote_manager.py`, `prompt.txt` y `long_term.json` (Verificado con grep y view_file).
- [x] Modificación de `daily_quote_manager.py` con lista negra y sustitución de citas (Verificado con script de testing).
- [x] Modificación de `proactive.py` imponiendo `min_break_interval = 3600` y directivas anti-Power BI (Verificado empíricamente).
- [x] Saneamiento integral de `long_term.json` purgando Power BI e inyectando preferencias de veto (Verificado con grep).
- [x] Actualización de `core/prompt.txt` y `GEMINI.md` con la Regla Inquebrantable #16 (Verificado en archivo).
- [x] Ejecución de suite de pruebas unitarias validando que `is_banned_author` y `build_prompt` operan al 100% (Código de salida 0).
- [x] Registro y enlace de incidencia en Bitácora Diaria, Catálogo e Inbox (Completado).
