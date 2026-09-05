/*
 * Revisión del cut (§37) y transiciones de fase (§38–§42).
 *
 * La fecha del 30 de noviembre es una revisión OBLIGATORIA, no una orden.
 * Salidas permitidas: MAINTENANCE · EXTEND_CUT · MAINTENANCE_THEN_SECOND_CUT.
 * Nunca se extiende automáticamente.
 */

import { CUT, TDEE_ESTIMADO, UMBRALES } from "../datos/config.js";
import { diasEntre, sumarDias } from "./fechas.js";
import { adherencia, mediaKcal, mediaPasos, recuperacionMedia } from "./nutricion.js";
import { cinturaDeReferencia, media7, pesosValidos, ultimaCintura, ultimoPeso } from "./peso.js";
import { completadas } from "./fuerza.js";

export const DECISIONES = [
  { id: "MAINTENANCE", letra: "A", texto: "Pasar a mantenimiento" },
  { id: "EXTEND_CUT", letra: "B", texto: "Extender cut" },
  { id: "MAINTENANCE_THEN_SECOND_CUT", letra: "C", texto: "Mantenimiento y 2º bloque más adelante" },
];

/** Los inputs de la revisión (§37): inicio · ahora · cambio. */
export function datosRevision({ diario, cintura, sesiones, carreras, ajustes, hoy }) {
  const inicio = ajustes?.faseDesde && ajustes?.faseManual ? ajustes.faseDesde : CUT.inicio;
  const pv = pesosValidos(diario);
  const pesoInicial = pv.find((p) => p.fecha >= inicio) || pv[0] || null;
  const pesoActual = ultimoPeso(diario, hoy);
  const m7Inicio = media7(pv, sumarDias(inicio, 6), 3);
  const m7Ahora = media7(pv, hoy, 3);
  const cInicio = cinturaDeReferencia(cintura, inicio);
  const cAhora = ultimaCintura(cintura, hoy);
  const recInicio = recuperacionMedia(diario, sumarDias(inicio, 6), 7);
  const recAhora = recuperacionMedia(diario, hoy, 7);
  const pasosInicio = mediaPasos(diario, sumarDias(inicio, 6), 7);
  const pasosAhora = mediaPasos(diario, hoy, 7);
  const kcalInicio = mediaKcal(diario, sumarDias(inicio, 6), 7);
  const kcalAhora = mediaKcal(diario, hoy, 7);
  const semanas = Math.max(1, diasEntre(inicio, hoy) / 7);
  const sesionesCut = completadas(sesiones).filter((s) => s.fecha >= inicio).length;
  const carrerasCut = carreras.filter((c) => c.fecha >= inicio).length;
  const adh = adherencia(diario, hoy, 28);

  const fila = (k, a, b, unidad = "", dec = 1) => ({ k, a, b, unidad, dec, d: a != null && b != null ? b - a : null });
  return {
    inicio,
    semanas,
    filas: [
      fila("Peso (kg)", pesoInicial?.kg ?? null, pesoActual?.kg ?? null),
      fila("Media 7 días (kg)", m7Inicio, m7Ahora),
      fila("Cintura (cm)", cInicio?.cm ?? null, cAhora?.cm ?? null),
      fila("Hambre /5", recInicio.hambre, recAhora.hambre),
      fila("Energía /5", recInicio.energia, recAhora.energia),
      fila("Sueño (h)", recInicio.sueno, recAhora.sueno),
      fila("Pasos/día", pasosInicio, pasosAhora, "", 0),
      fila("Kcal medias", kcalInicio, kcalAhora, "", 0),
    ],
    adherencia28: adh,
    sesionesCut,
    sesionesPorSemana: sesionesCut / semanas,
    carrerasCut,
  };
}

/**
 * Cambios de ajustes que produce una decisión. No escribe nada: devuelve el
 * parche para que `acciones.js` lo guarde con su entrada en el historial.
 */
export function aplicarDecision(decision, { ajustes, hoy, tdee }) {
  const mantenimientoKcal = ajustes?.tdeeReferencia || (tdee?.valido ? tdee.valor : Math.round((TDEE_ESTIMADO.min + TDEE_ESTIMADO.max) / 2));
  const kcalOrigen = ajustes?.tdeeReferencia ? "TDEE deducido aceptado" : tdee?.valido ? "último TDEE deducido válido" : "TDEE estimado (no hay deducido válido)";

  if (decision === "EXTEND_CUT") {
    const fin = sumarDias(ajustes.finProvisional || CUT.finProvisional, 28);
    return {
      parche: { decisionRevision: null, finProvisional: fin, avisoPreRevision: sumarDias(fin, -14), extensiones: (ajustes.extensiones || 0) + 1 },
      historial: { tipo: "fase", texto: `Cut extendido 4 semanas: nueva revisión el ${fin}.` },
    };
  }

  const parche = {
    faseManual: "MAINTENANCE",
    faseDesde: hoy,
    decisionRevision: decision,
    kcalObjetivo: mantenimientoKcal,
    // Las macros de mantenimiento: misma proteína y grasa, el resto a carbohidrato.
    carbosG: Math.max(0, Math.round((mantenimientoKcal - (ajustes.proteinaG || CUT.proteinaG) * 4 - (ajustes.grasaG || CUT.grasaG) * 9) / 4)),
    ultimoCambioKcal: hoy,
    mantenimientoConfirmado: null,
    segundoBloquePendiente: decision === "MAINTENANCE_THEN_SECOND_CUT",
  };
  return {
    parche,
    historial: { tipo: "fase", texto: `Mantenimiento desde ${hoy} a ${mantenimientoKcal} kcal (${kcalOrigen}).${decision === "MAINTENANCE_THEN_SECOND_CUT" ? " Segundo bloque de definición más adelante." : ""}` },
  };
}

/** §40 · Arranque de ganancia: mantenimiento confirmado + 150–200 kcal. */
export function parcheGanancia({ ajustes, hoy, superavit }) {
  const base = ajustes.kcalObjetivo;
  const kcal = base + Math.min(UMBRALES.gananciaSuperavit.max, Math.max(UMBRALES.gananciaSuperavit.min, superavit));
  return {
    parche: { faseManual: "GAIN", faseDesde: hoy, kcalObjetivo: kcal, carbosG: Math.round((kcal - ajustes.proteinaG * 4 - ajustes.grasaG * 9) / 4), ultimoCambioKcal: hoy, mantenimientoKcal: base },
    historial: { tipo: "fase", texto: `Ganancia desde ${hoy}: ${kcal} kcal (mantenimiento ${base} + ${kcal - base}).` },
  };
}

/** §42 · Mini-cut: solo si hay acumulación clara, Jose quiere y el mantenimiento es conocido. */
export function parcheMiniCut({ ajustes, hoy, kcal }) {
  return {
    parche: { faseManual: "MINI_CUT", faseDesde: hoy, kcalObjetivo: kcal, carbosG: Math.round((kcal - ajustes.proteinaG * 4 - ajustes.grasaG * 9) / 4), ultimoCambioKcal: hoy, finProvisional: sumarDias(hoy, 42), avisoPreRevision: sumarDias(hoy, 28), mantenimientoKcal: ajustes.mantenimientoKcal || ajustes.kcalObjetivo },
    historial: { tipo: "fase", texto: `Mini-cut desde ${hoy} a ${kcal} kcal, 4–6 semanas.` },
  };
}

/** Vuelta a mantenimiento desde ganancia o mini-cut. */
export function parcheVolverMantenimiento({ ajustes, hoy }) {
  const kcal = ajustes.mantenimientoKcal || ajustes.tdeeReferencia || ajustes.kcalObjetivo;
  return {
    parche: { faseManual: "MAINTENANCE", faseDesde: hoy, kcalObjetivo: kcal, carbosG: Math.round((kcal - ajustes.proteinaG * 4 - ajustes.grasaG * 9) / 4), ultimoCambioKcal: hoy, mantenimientoConfirmado: null, decisionRevision: "MAINTENANCE" },
    historial: { tipo: "fase", texto: `Mantenimiento desde ${hoy} a ${kcal} kcal.` },
  };
}
