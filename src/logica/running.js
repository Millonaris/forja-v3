/*
 * Running (§16–§20, §49, §54).
 *
 * Hobby complementario: 2 sesiones/semana base, RPE 3–4, sin HIIT. La
 * progresión CaCo sube por sesiones en verde, y se CONGELA si hay conflicto
 * con la hipertrofia. Nunca se reduce la fuerza para mantener el running.
 */

import { MENSAJES, RUNNING } from "../datos/config.js";
import { CACO, duracionCaco } from "../datos/rutinas.js";
import { diasEntre, sumarDias } from "./fechas.js";

/** §19 · Semáforo de dolor. */
export function semaforoDolor({ dolor = 0, persiste = false, alteraMarcha = false }) {
  if (alteraMarcha || dolor >= 6) return "RED";
  if (persiste || dolor >= 3) return "YELLOW";
  return "GREEN";
}

export const TEXTO_DOLOR = {
  GREEN: "Verde: continuar.",
  YELLOW: "Amarillo: no progresar.",
  RED: "Rojo: parar y valorar.",
};

export function carrerasOrdenadas(carreras) {
  return [...carreras].sort((a, b) => b.fecha.localeCompare(a.fecha) || (b.id ?? 0) - (a.id ?? 0));
}

/**
 * §54 · Estado del running. `ajustes.estadoRunning` guarda el HOLD manual
 * (o el automático por interferencia); el dolor de la última sesión manda
 * sobre lo demás.
 */
export function estadoRunning(ajustes, carreras) {
  const ultima = carrerasOrdenadas(carreras)[0];
  if (ultima) {
    const sem = semaforoDolor(ultima);
    if (sem === "RED") return "RED_PAIN";
    if (sem === "YELLOW") return "YELLOW_PAIN";
  }
  if (ajustes?.estadoRunning === "HOLD") return "HOLD";
  return "PROGRESS";
}

export const TEXTO_ESTADO_RUNNING = {
  PROGRESS: "Progresión abierta",
  HOLD: "Progresión congelada",
  YELLOW_PAIN: "Amarillo · no progresar",
  RED_PAIN: "Rojo · parar y valorar",
};

/** Sesiones en verde al nivel actual (las que cuentan para subir). */
export function verdesEnNivel(carreras, nivel) {
  return carreras.filter((c) => c.nivel === nivel && semaforoDolor(c) === "GREEN" && !c.interfiere).length;
}

/** Se sube de nivel con ≥2 sesiones en verde y sin conflicto con la fuerza. */
export function puedeSubir(estado, verdes, nivel) {
  return estado === "PROGRESS" && verdes >= 2 && nivel < CACO.length - 1;
}

export function sesionesEnSemana(carreras, hoy) {
  const desde = sumarDias(hoy, -6);
  return carreras.filter((c) => c.fecha >= desde && c.fecha <= hoy).length;
}

export function hechaEl(carreras, fecha) {
  return carreras.some((c) => c.fecha === fecha);
}

/** §20 · Nutrición según la duración de la sesión. */
export function nutricionRunning(minutos) {
  if (minutos < 45) return "Sesión <45 min: no cambies las calorías del día.";
  if (minutos <= 75) return "Sesión de 45–75 min: mismas calorías. No comas “las del reloj”.";
  if (minutos <= 90) return "Sesión de 75–90 min: puedes considerar 30–50 g de carbohidrato extra ese día.";
  return "Sesión >90 min: 30–50 g CHO extra ese día y 30–60 g CHO/h durante la sesión según tolerancia.";
}

/** Nota de progresión para la pantalla de running. */
export function notaProgresion({ estado, verdes, nivel }) {
  const c = CACO[nivel];
  if (estado === "RED_PAIN") return "Última sesión en rojo. Parar running y valorar antes de la siguiente.";
  if (estado === "YELLOW_PAIN") return "Última sesión en amarillo. Repite " + c.codigo + " sin progresar hasta que desaparezca.";
  if (estado === "HOLD") return "Progresión congelada: interfiere con fuerza o recuperación. " + MENSAJES.running20k;
  if (nivel >= CACO.length - 1) return "Nivel máximo de la escalera. Objetivo 20 km alcanzado: mantener sin fecha ni obligación.";
  if (verdes >= 2) return `Dos sesiones en verde: la próxima puede ser ${CACO[nivel + 1].codigo}. Solo si no interfiere con fuerza.`;
  return `Sesiones en verde a este nivel: ${verdes}/2. Progresión solo si no interfiere con fuerza.`;
}

/** Recomendación de running para HOY (§57 runningRecommendation). */
export function recomendacionHoy({ estado, carreras, hoy, fuerzaHoy }) {
  if (hechaEl(carreras, hoy)) return { hacer: false, texto: "Running hecho hoy." };
  if (estado === "RED_PAIN") return { hacer: false, texto: "Rojo: sin running hasta valorar." };
  const n = sesionesEnSemana(carreras, hoy);
  if (n >= RUNNING.sesionesBaseSemana) return { hacer: false, texto: `Ya llevas ${n} sesiones esta semana. Base: 2/semana.` };
  const ultima = carrerasOrdenadas(carreras)[0];
  if (ultima && diasEntre(ultima.fecha, hoy) < 2 && fuerzaHoy) return { hacer: false, texto: "Corriste hace poco y hoy hay fuerza: prioridad a la hipertrofia." };
  return { hacer: true, texto: estado === "PROGRESS" ? "Running fácil disponible" : "Running fácil · repetir sesión" };
}

export { CACO, duracionCaco };
