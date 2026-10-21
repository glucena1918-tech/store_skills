---
tags: [nexus/incident, type/ui_crash, status/resolved]
status: resolved
created: 2026-10-10T12:41:27.000-04:00
resolved: 2026-10-10T12:51:00.000-04:00
resolution: "Corrección de AttributeError C.SEC en la clase C de JARVIS_MARK_LIV/ui.py mediante incorporación del color SEC (#4facfe) a la paleta, inclusión en _HUE_LINKED y blindaje defensivo con bloque try...except en el slot _show_estado_mayor_card, previniendo abortos no capturados en Qt6Core.dll (0xc0000409)."
---
# 🚨 Nexus Incident: UI_SLOT_ATTRIBUTE_ERROR_CRASH

**ID:** `INC-20261010-CRASH-UI`  
**Servicio:** JARVIS Mark LIV Core UI (`JARVIS_MARK_LIV/ui.py`)  
**Severidad:** 🔴 ALTA  
**Estado:** `RESOLVED`  
**Referencia Técnica:** [[JARVIS_MARK_LIV/ui.py#_show_estado_mayor_card]]

---

## 📌 Descripción del Fallo
Al someter a JARVIS a una prueba de razonamiento profundo del Sistema 2 ("Le di la Fase 1, respondió que tardaría 12 segundos inmediatamente se cerró..."), JARVIS anunció correctamente por voz la retención de 12 segundos, pero la ventana de la aplicación se cerró abruptamente sin mostrar ningún diálogo o traza en consola.

## 🔍 Causa Raíz
1. **Atributo Inexistente en Paleta (`class C`):** Durante la implementación de la Fase 3, en la proyección de la Tarjeta Holográfica de Estado Mayor (`_show_estado_mayor_card`), se introdujo la línea `html.append(f"<div style='color: {C.SEC}; ...'>")`. La clase `C` en `ui.py` no contenía la constante `SEC` (la cual pertenecía a `cockpit_tabs.py` como `CG.SEC`).
2. **Excepción No Capturada en Slot de PyQt6:** Al concluir el análisis del hilo en segundo plano, la emisión de `_estado_mayor_sig` activó el slot `_show_estado_mayor_card` en el hilo principal de Qt. La excepción `AttributeError: type object 'C' has no attribute 'SEC'` ocurrió dentro del bucle de eventos C++ de Qt6, provocando una llamada interna a `qFatal()` / `abort()` en `Qt6Core.dll` con código `0xc0000409` (`STATUS_STACK_BUFFER_OVERRUN`), terminando inmediatamente el proceso.

## 🛠️ Solución Implementada
- **Definición de Constante en Paleta (`JARVIS_MARK_LIV/ui.py`):**
  - Se agregó `SEC = "#4facfe"  # Ion Blue / Secondary Accent` a `class C`.
  - Se integró `"SEC"` a la tupla `_HUE_LINKED` para garantizar la consistencia en cambios dinámicos de acento.
  - Se sustituyó el acceso directo por `getattr(C, 'SEC', '#4facfe')` como medida de defensa en profundidad.
- **Blindaje Defensivo del Slot (`_show_estado_mayor_card`):**
  - Se envolvió toda la ejecución del slot en un bloque `try...except Exception as e:` con `traceback.print_exc()`, impidiendo que cualquier inconsistencia de HTML o widgets alcance el núcleo C++ de PyQt6.
- **Validación Empírica:**
  - Se simuló el despacho del evento utilizando la instancia completa de `JarvisUI` y el archivo generado `DICTAMEN_20261010_124127_Estrategia.md`, verificando el renderizado de la tarjeta y la sincronización con `EstadoMayorTab` con salida 0 y sin errores.

---

## Acciones de Verificación y Cierre
- [x] Inspección y extracción del volcado de eventos en Windows Event Log identificando `Qt6Core.dll` y código `0xc0000409` (Verificado empíricamente).
- [x] Aislamiento del error exacto en `ui.py` línea 4528 (`AttributeError: type object 'C' has no attribute 'SEC'`).
- [x] Adición de `SEC = "#4facfe"` en `class C` y en `_HUE_LINKED` en `ui.py`.
- [x] Envoltorio `try...except` con registro de traceback en `_show_estado_mayor_card`.
- [x] Comprobación de que el dictamen `DICTAMEN_20261010_124127_Estrategia.md` fue generado y persistido en la Bóveda con frontmatter OKF íntegro.
- [x] Ejecución de script de prueba PyQt6 confirmando que `JarvisUI.show_estado_mayor_card` procesa eventos limpiamente.
- [x] Trazabilidad y enlace en Bitácora Diaria `10-10-2026.md`, catálogo `_Index.md` e `Inbox.md`.
