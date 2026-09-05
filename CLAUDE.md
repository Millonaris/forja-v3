# FORJA 3.0

App personal de Jose: hipertrofia en gimnasio, definición (cut), running CaCo
0→20 km, postura, core y recuperación. PWA local-first instalada en su móvil
Android. **No es un producto**: un solo usuario, y se optimiza para él.

## Sobre Jose (el usuario)

- Habla español y escribe con erratas; responderle SIEMPRE en español, claro,
  como un entrenador, no como un desarrollador. No sabe programar.
- Quiere las cosas 100 % funcionales y SIN datos de prueba.
- Decisiones ya tomadas (no reabrir): la comida se registra en Fitia y en la
  app solo se apunta el TOTAL del día (“cierre del día”); el GPS lo lleva el
  Garmin; sin gamificación ni rachas; sin cuentas ni nube (copia = JSON).

## Fuentes de verdad

- `docs/FORJA_3_0_SOURCE_OF_TRUTH_TECNICO_2026-09-05.md` — MANDA. Lógica,
  estados, reglas, cálculos y datos. No reinterpretar, no simplificar, no
  inventar decisiones fisiológicas.
- `docs/FORJA_3_0_REDISENO_Y_CONTENIDOS_2026-09-05.md` — contenidos y UX.
- `Aplicación de Gym Industrial/` — el diseño exportado de Claude Design
  (`ForjaApp.dc.html` es el prototipo funcional; `FORJA 3.0.dc.html` el lienzo
  con las dos variantes de HOY). Se replica su estética: fondo #0A0A0B, único
  acento #FFD400, Barlow Condensed, esquinas rectas con marcas de registro.

## Comandos

```bash
npm test          # pruebas de aceptación de las reglas (node --test)
npx vite build
npm run dev       # entrada "forja3" en .claude/launch.json (puerto 5174)
npm run publicar  # tests + iconos + build + push de dist/ a gh-pages
```

## Arquitectura

React 19 + Vite + vite-plugin-pwa + Dexie (IndexedDB) con `useLiveQuery`.
Sin router: la navegación es estado en `App.jsx`.

- `src/datos/` — el PLAN escrito: `config.js` (usuario, cut, umbrales,
  mensajes §56, prohibiciones §55), `rutinas.js` (Torso A/B, Pierna A/B,
  core, postura, y el PLAN DE RUNNING definitivo de Jose: 66 sesiones S1–S66 en
  5 fases, CaCo → 30 min → 5K → 10K → 15K → 20K; la 3.0 arranca en S5), `db.js` (esquema Dexie `forja3`).
- `src/logica/` — motores puros y testeables: `peso.js` (media7, tendencia,
  cintura), `nutricion.js` (adherencia, TDEE deducido, semáforo, sugerencia
  de kcal), `progresion.js` (doble progresión), `fuerza.js` (secuencia,
  señales de descarga), `running.js` (semáforo de dolor, estados, CaCo),
  `fase.js` (fases, subestados, aviso, mantenimiento), `revision.js`
  (revisión del 30 nov y transiciones), `resumen.js` (UNA función que calcula
  todo lo que enseñan las pantallas), `acciones.js` (TODAS las escrituras).
- `src/pantallas/` — Hoy (variantes panel/foco), Entrenar (menú, fuerza,
  detalle, sesión en curso, running, rutina corta), Progreso (cuerpo, fuerza,
  running, recuperación, fotos), Plan, Revision, Ajustes.
- `pruebas/aceptacion.test.js` — las reglas que protegen el plan.

## Invariantes que NO se rompen

1. **El estado manda, la fecha solo recomienda.** La secuencia Torso A →
   Pierna A → Torso B → Pierna B avanza SOLO al completar sesiones. Sin reset
   semanal. El running avanza UNA sesión del plan por cada sesión en verde
   (no si costó demasiado, ni con dolor amarillo, ni congelado), nunca por
   calendario. 2/semana y nunca dos días seguidos.
2. **FORJA nunca cambia kcal sola.** Sugiere (MANTENER / ESPERAR /
   CONSIDERAR ±100–150) y Jose decide en PLAN → Cambiar kcal. Mínimo 14 días
   entre cambios, adherencia ≥85 %, tendencias y no pesadas.
3. **Ninguna fase entra sola.** PRE_CUT→CUT es por fecha (8 sep 2026); todo
   lo demás (mantenimiento, ganancia, mini-cut, extender) lo decide Jose en la
   revisión (30 nov) o en PLAN. El aviso del 16 nov solo avisa.
4. **Hipertrofia manda sobre running.** Si interfiere, HOLD. Nunca al revés.
5. **Las pesadas dudosas no entran** en medias ni tendencias. La BIA no
   decide nada. Los pasos son contexto, no kcal. El running ya está en los
   pasos.
6. **Descarga solo sugerida** con ≥2 señales, nunca ejecutada.
7. **Fechas**: siempre "YYYY-MM-DD" local vía `logica/fechas.js`.
8. **Ids de ejercicio estables**: `RUTINA:clave` (p. ej. `TORSO_A:jalon-pecho-prono`);
   el historial se agrupa por `clave` porque el mismo ejercicio sale en varias rutinas.

## Al terminar cualquier cambio

1. `npm test` y `npx vite build` en verde.
2. Verificar en el navegador lo que sea visible.
3. Contarle a Jose lo que cambió en términos de entrenamiento, no de código.
