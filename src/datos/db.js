/*
 * FORJA 3.0 · Base de datos local (IndexedDB vía Dexie).
 *
 * Todo vive en el móvil: sin cuenta, sin servidor. La copia de seguridad es
 * un JSON exportado desde Ajustes.
 *
 * Fechas: siempre "YYYY-MM-DD" local (ver logica/fechas.js).
 *
 * Tablas:
 *  - ajustes        fila única id=1: fase, kcal, macros, estado del running…
 *  - diario         una fila por día (§46): peso, kcal, macros, pasos, recuperación.
 *  - cintura        una fila por medición semanal (§25).
 *  - sesionesFuerza una fila por sesión, con sus series dentro (§48).
 *  - carreras       una fila por sesión de running (§49).
 *  - extras         rutinas cortas completadas (postura / core).
 *  - fotos          front / side / back con fecha (§50), como Blob.
 *  - historial      cambios de kcal y de fase, con fecha y motivo.
 */

import Dexie from "dexie";
import { CUT } from "./config.js";
import { SESION_RUNNING_INICIAL } from "./rutinas.js";

export const db = new Dexie("forja3");

db.version(1).stores({
  ajustes: "id",
  diario: "fecha",
  cintura: "fecha",
  sesionesFuerza: "++id, fecha, rutinaId, estado",
  carreras: "++id, fecha, nivel",
  extras: "++id, fecha, tipo",
  fotos: "++id, fecha, pose",
  historial: "++id, fecha, tipo",
});

/** Ajustes por defecto: el plan del 5 de septiembre tal cual. */
export const AJUSTES_INICIALES = {
  id: 1,
  // La fase la decide la fecha (PRE_CUT → CUT el 8 sep) hasta que Jose tome
  // una decisión en la revisión; a partir de ahí manda `faseManual`.
  faseManual: null,
  faseDesde: null,
  finProvisional: CUT.finProvisional,
  avisoPreRevision: CUT.avisoPreRevision,
  kcalObjetivo: CUT.kcal,
  proteinaG: CUT.proteinaG,
  carbosG: CUT.carbosG,
  grasaG: CUT.grasaG,
  ultimoCambioKcal: CUT.inicio,
  decisionRevision: null,
  mantenimientoConfirmado: null, // fecha en la que Jose lo confirmó
  tdeeReferencia: null, // el último TDEE deducido válido que Jose aceptó
  estadoRunning: "PROGRESS",
  sesionRunning: SESION_RUNNING_INICIAL, // S5: la siguiente del plan de 66 sesiones
  varianteHoy: "panel",
  ultimaCopia: null,
};

export async function leerAjustes() {
  return (await db.ajustes.get(1)) || AJUSTES_INICIALES;
}

export async function guardarAjustes(cambios) {
  const actuales = (await db.ajustes.get(1)) || AJUSTES_INICIALES;
  const nuevos = { ...actuales, ...cambios, id: 1 };
  await db.ajustes.put(nuevos);
  return nuevos;
}

/** Al arrancar: si no hay ajustes, se siembran los del plan. */
export async function asegurarAjustes() {
  const hay = await db.ajustes.get(1);
  if (!hay) { await db.ajustes.put(AJUSTES_INICIALES); return; }
  // Instalaciones de la primera publicación (5 sep 2026) guardaban un nivel
  // CaCo; el plan definitivo va por sesiones S1–S66 y arranca en S5.
  if (hay.sesionRunning == null) await db.ajustes.update(1, { sesionRunning: SESION_RUNNING_INICIAL });
}
