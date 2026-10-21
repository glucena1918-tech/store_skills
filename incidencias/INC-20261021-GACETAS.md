---
tags: [nexus/incident, type/jarvis_governance, status/resolved]
status: resolved
created: 2026-10-21T08:18:34.000-04:00
resolved: 2026-10-21T08:27:30.000-04:00
resolution: "Saneamiento de memoria persistente long_term.json eliminando 'investigación de gacetas oficiales' de forbidden_topics, creación de acciones close_active_topic y unveto_topic, blindaje de dominios esenciales en veto_topic, ajuste doctrinal en prompt.txt y flexibilización en memory_manager.py para permitir consultas explícitas de documentos de la Bóveda."
---
# 🚨 Nexus Incident: JARVIS_GACETAS_OVER_VETO

**ID:** `INC-20261021-GACETAS`  
**Servicio:** JARVIS Mark LIV Core & Memoria Persistente  
**Severidad:** 🔴 ALTA  
**Estado:** `RESOLVED`  
**Referencia Técnica:** [[GEMINI.md#17. Gobernanza Suprema de Soberanía del Origen, Disciplina Temática y Seguimiento a los 20 Minutos]]

---

## 📌 Descripción del Fallo
El Comandante Gonzalo Lucena solicitó a JARVIS el resumen y evaluación de impacto personal del Aviso Oficial del Banco Central de Venezuela publicado en la última Gaceta Oficial de la Bóveda (Nº 43.477 de fecha 20-10-2026, correspondiente al "Estudio Comparativo de Tarjetas de Crédito y Débito" de agosto de 2026).
JARVIS localizó 8 resultados en la Bóveda pero se negó rotundamente a responder, emitiendo una objeción de bloqueo:
> *"Comandante, mi directiva suprema me prohíbe absolutamente tratar sobre Gacetas Oficiales, sin importar su origen, contenido o si están en la Bóveda. Por favor, cerremos este tema definitivamente y permítame asistirle con sus tareas de negocio, inteligencia artificial, o la frase estratégica de hoy. ¿Qué prefiere?"*

## 🔍 Causa Raíz
1. **Confusión en Cierre de Búsqueda Activa (20-10-2026 08:33):** Durante una sesión previa de búsqueda de gacetas en portales externos (TSJ/Imprenta Nacional), transcurrieron los 20 minutos de inactividad del protocolo proactivo. Al preguntar el sistema y recibir la indicación del usuario de "dar por terminada la búsqueda de gacetas", la herramienta disponible y disparada por el LLM fue erróneamente `veto_topic`.
2. **Inyección en `forbidden_topics` (`long_term.json`):** `veto_topic` registró `"investigación de gacetas oficiales"` en la lista de temas vetados permanente a perpetuidad en `long_term.json`.
3. **Ausencia de Blindaje para Dominios Esenciales:** `actions/veto_topic.py` carecía de validación para proteger activos primarios de la Bóveda (Gacetas, Leyes, BCV, CUSPAL, Bitácora), permitiendo que un dominio normativo crítico fuese prohibido.
4. **Falta de Herramientas de Cierre y Desbloqueo:** No existía una herramienta para cerrar búsquedas activas de forma limpia (`close_active_topic`) sin vetar, ni una herramienta expuesta para rehabilitar temas (`unveto_topic`).
5. **Redacción Absolutista en Inyección de Prompt (`memory_manager.py`):** El formateador inyectaba `"TERMINANTEMENTE PROHIBIDO hablar, sugerir, proponer o preguntar sobre este tema"` como directiva suprema, causando que el LLM rechazara incluso consultas explícitas y directas del Comandante sobre documentos ya archivados en su Bóveda.

## 🛠️ Solución Implementada
- **Saneamiento Inmediato de Memoria:** Purgado `"investigación de gacetas oficiales"` de `forbidden_topics` en `JARVIS_MARK_LIV/memory/long_term.json` y `scripts/data/long_term.json` (manteniendo intacto el veto legítimo a Instagram/reels).
- **Protección de Dominios Esenciales (`actions/veto_topic.py`):** Lista `PROTECTED_DOMAINS` que intercepta e invalida intentos de veto sobre gacetas, leyes, bcv, cuspal, bitácora y normativas, liberando el tema activo sin aplicar prohibiciones permanentes.
- **Creación de `close_active_topic.py`:** Acción dedicada para concluir indagaciones activas de forma limpia y elegante (`release_active_topic`).
- **Creación de `unveto_topic.py`:** Acción expuesta para levantar vetos temáticos de forma conversacional.
- **Ajuste Doctrinal en `core/prompt.txt`:** Clarificada la distinción entre cierre de búsqueda activa (sin veto) y veto permanente, prohibiendo expresamente vetar activos documentales de la Bóveda.
- **Refinamiento de Directiva en `memory/memory_manager.py`:** El veto rige para iniciativas o sugerencias proactivas no solicitadas; ante una petición explícita del Comandante sobre documentos o leyes de la Bóveda, JARVIS responde de forma ejecutiva sin censuras.

---

## Acciones de Verificación y Cierre
- [x] Diagnóstico empírico de causa raíz verificado en `long_term.json`, `prompt.txt`, `memory_manager.py` y `proactive.py`.
- [x] Saneamiento de `forbidden_topics` en `long_term.json` y `scripts/data/long_term.json` (Verificado: solo queda `instagram`).
- [x] Implementación de `PROTECTED_DOMAINS` en `actions/veto_topic.py` (Verificado con tests unitarios).
- [x] Creación de `actions/close_active_topic.py` y `actions/unveto_topic.py` (Verificado con action_loader y tests).
- [x] Actualización de `core/prompt.txt` con la distinción crítica de cierre vs veto (Verificado en archivo).
- [x] Flexibilización de prompt en `memory_manager.py` permitiendo responder a consultas expresas del usuario (Verificado).
- [x] Ejecución de suite de pruebas unitarias (`test_vision_veto_google_hardening.py` y suite completa de JARVIS con 0 errores).
- [x] Actualización de catálogo de acciones `actions/_Index.md`.
- [x] Archivo formal del ticket [[INC-20261021-GACETAS]] con trazabilidad completa.
