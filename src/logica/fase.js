/*
 * Fases y subestados (§3, §36–§42, §52, §53).
 *
 * Hasta el 7 sep: PRE_CUT. Desde el 8 sep: CUT. A partir de ahí NINGUNA fase
 * entra sola: las decide Jose en la revisión (30 nov) o confirmando
 * mantenimiento / arrancando ganancia / mini-cut. La fecha solo avisa.
 */

import { CUT, NOMBRE_FASE, UMBRALES } from "../datos/config.js";
import { diasEntre, sumarDias } from "./fechas.js";

export function faseActual(ajustes, hoy) {
  if (ajustes?.faseManual) return ajustes.faseManual;
  return hoy < CUT.inicio ? "PRE_CUT" : "CUT";
}

export function inicioFase(ajustes, hoy) {
  const fase = faseActual(ajustes, hoy);
  if (ajustes?.faseManual && ajustes.faseDesde) return ajustes.faseDesde;
  return fase === "PRE_CUT" ? null : CUT.inicio;
}

/** Día 1 = el día de inicio. Negativo o 0 antes de empezar. */
export function diaDeFase(ajustes, hoy) {
  const inicio = inicioFase(ajustes, hoy) || CUT.inicio;
  return diasEntre(inicio, hoy) + 1;
}

export function finProvisional(ajustes) {
  return ajustes?.finProvisional || CUT.finProvisional;
}

export function avisoPreRevision(ajustes) {
  return ajustes?.avisoPreRevision || CUT.avisoPreRevision;
}

/** "Definición · Día 12" / "Pre-cut · empieza en 3 días" / "Mantenimiento · Semana 2". */
export function etiquetaFase(ajustes, hoy) {
  const fase = faseActual(ajustes, hoy);
  if (fase === "PRE_CUT") {
    const faltan = diasEntre(hoy, CUT.inicio);
    return `Pre-cut · empieza en ${faltan} ${faltan === 1 ? "día" : "días"}`;
  }
  const dia = diaDeFase(ajustes, hoy);
  if (fase === "CUT" && hoy > finProvisional(ajustes) && !ajustes?.decisionRevision) return "Definición · Revisión pendiente";
  return `${NOMBRE_FASE[fase]} · Día ${dia}`;
}

/** Objetivo de una línea para la cabecera de HOY. */
export function objetivoFase(fase) {
  return {
    PRE_CUT: "Inicio limpio el 8 de septiembre. Estos días no juzgan la dieta.",
    CUT: "perder grasa manteniendo músculo y rendimiento.",
    MAINTENANCE: "estabilizar el nuevo peso y confirmar mantenimiento.",
    GAIN: "ganar músculo despacio, con la cintura controlada.",
    MINI_CUT: "corregir la grasa acumulada en 4–6 semanas.",
  }[fase];
}

/** §13 del visual · Aviso del cut. */
export function avisoCut(ajustes, hoy) {
  const fase = faseActual(ajustes, hoy);
  if (fase !== "CUT" || ajustes?.decisionRevision) return { mostrar: false };
  const fin = finProvisional(ajustes);
  const aviso = avisoPreRevision(ajustes);
  if (hoy >= fin) return { mostrar: true, esDiaRevision: true, titulo: "Revisión del cut" };
  if (hoy >= aviso) {
    const semanas = Math.max(1, Math.ceil(diasEntre(hoy, fin) / 7));
    return { mostrar: true, esDiaRevision: false, titulo: `Quedan ${semanas} ${semanas === 1 ? "semana" : "semanas"} para revisar el cut.` };
  }
  return { mostrar: false };
}

/** Porcentaje recorrido del cut, para la barra de PLAN. */
export function progresoCut(ajustes, hoy) {
  const fin = finProvisional(ajustes);
  const total = diasEntre(CUT.inicio, fin);
  const pct = (diasEntre(CUT.inicio, hoy) / total) * 100;
  return Math.min(100, Math.max(0, pct));
}

/** Posición del aviso (16 nov) en la barra, en %. */
export function posicionAviso(ajustes) {
  const fin = finProvisional(ajustes);
  return (diasEntre(CUT.inicio, avisoPreRevision(ajustes)) / diasEntre(CUT.inicio, fin)) * 100;
}

/**
 * §53 · Subestado.
 *   REVIEW_DUE        pasada la fecha de revisión sin decisión (o toca revisión de ganancia)
 *   RECOVERY_WARNING  semáforo rojo por recuperación
 *   INSUFFICIENT_DATA <14 días en fase, adherencia <85 % o sin tendencia
 *   TRANSITION        mantenimiento sin confirmar
 *   ACTIVE            lo demás
 */
export function subestado({ fase, hoy, ajustes, diasEnFase, adherencia7, tendencia, semaforo }) {
  if (fase === "CUT" && hoy >= finProvisional(ajustes) && !ajustes?.decisionRevision) return "REVIEW_DUE";
  if (fase === "GAIN" && ajustes?.faseDesde && diasEntre(ajustes.faseDesde, hoy) >= UMBRALES.gananciaRevisionSemanas * 7 && diasEntre(ajustes.ultimoCambioKcal || ajustes.faseDesde, hoy) >= UMBRALES.gananciaRevisionSemanas * 7) return "REVIEW_DUE";
  if (semaforo?.color === "ROJO" && /recuperación/i.test(semaforo.texto)) return "RECOVERY_WARNING";
  if (fase === "MAINTENANCE" && !ajustes?.mantenimientoConfirmado) return "TRANSITION";
  if (diasEnFase < UMBRALES.diasMinimosAntesDeAjustar || adherencia7 < UMBRALES.adherenciaMinima || tendencia == null) return "INSUFFICIENT_DATA";
  return "ACTIVE";
}

export const TEXTO_SUBESTADO = {
  ACTIVE: "Activo",
  INSUFFICIENT_DATA: "Datos insuficientes",
  REVIEW_DUE: "Revisión pendiente",
  RECOVERY_WARNING: "Aviso de recuperación",
  TRANSITION: "En transición",
};

/**
 * §39 · Mantenimiento confirmable: tendencia dentro de ±0,20 kg/semana,
 * cintura estable y actividad comparable durante varias semanas.
 */
export function mantenimientoConfirmable({ tendencias, cinturaEstable, comparables }) {
  const validas = tendencias.filter((t) => t != null);
  if (validas.length < UMBRALES.mantenimientoSemanasMin) return { ok: false, motivo: `Faltan semanas con tendencia: ${validas.length}/${UMBRALES.mantenimientoSemanasMin}.` };
  const dentro = validas.every((t) => Math.abs(t) <= UMBRALES.mantenimientoTendenciaMax);
  if (!dentro) return { ok: false, motivo: "Alguna semana se sale de ±0,20 kg." };
  if (cinturaEstable === false) return { ok: false, motivo: "La cintura no está estable." };
  if (comparables === false) return { ok: false, motivo: "La actividad no es comparable." };
  return { ok: true, motivo: "Tendencia ±0,20 kg/semana, cintura estable y actividad comparable." };
}

/** §41 · Ajuste en ganancia: revisión cada ~4 semanas. */
export function sugerenciaGanancia({ kgMes, cinturaSube, fuerzaProgresa, semanasPlano, adherencia7 }) {
  if (kgMes == null) return { accion: "ESPERAR", motivo: "Sin tendencia fiable todavía." };
  if (kgMes > UMBRALES.gananciaRitmoMes.techo || cinturaSube) return { accion: "CONSIDERAR_MENOS", motivo: `Sube ${kgMes.toFixed(2)} kg/mes o la cintura demasiado rápido. Valorar −100 kcal.` };
  if (semanasPlano >= 8 && fuerzaProgresa === false && adherencia7 >= UMBRALES.adherenciaMinima) return { accion: "CONSIDERAR_MAS", motivo: "~8 semanas plano, fuerza estancada, adherencia buena. Valorar +100 kcal." };
  if (kgMes >= UMBRALES.gananciaRitmoMes.min && kgMes <= UMBRALES.gananciaRitmoMes.max) return { accion: "MANTENER", motivo: "Peso subiendo en objetivo (0,25–0,45 kg/mes)." };
  return { accion: "MANTENER", motivo: "Sin motivo claro para tocar nada. Revisar en ~4 semanas." };
}

export { sumarDias };
