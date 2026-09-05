/*
 * Running (§16–§20, §49, §54) sobre el plan definitivo de 66 sesiones.
 *
 * Hobby complementario: 2 sesiones/semana, nunca dos días seguidos, RPE 3–4,
 * sin HIIT. Se avanza UNA sesión por cada sesión completada en verde; si
 * costó demasiado se repite; con dolor amarillo no se avanza; si interfiere
 * con la hipertrofia se CONGELA. Nunca se reduce la fuerza por el running.
 */

import { MENSAJES, RUNNING } from "../datos/config.js";
import { FASES_RUNNING, PLAN_RUNNING, sesionRunning } from "../datos/rutinas.js";
import { diasEntre, sumarDias } from "./fechas.js";

/** §19 · Semáforo de dolor. */
export function semaforoDolor({ dolor = 0, persiste = false, alteraMarcha = false }) {
  if (alteraMarcha || dolor >= 6) return "RED";
  if (persiste || dolor >= 3) return "YELLOW";
  return "GREEN";
}

export const TEXTO_DOLOR = { GREEN: "Verde: continuar.", YELLOW: "Amarillo: no progresar.", RED: "Rojo: parar y valorar." };

export function carrerasOrdenadas(carreras) {
  return [...carreras].sort((a, b) => b.fecha.localeCompare(a.fecha) || (b.id ?? 0) - (a.id ?? 0));
}

/** §54 · Estado del running: el dolor de la última sesión manda; luego el HOLD. */
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

/**
 * ¿Se avanza a la siguiente sesión tras guardar ésta? Solo si va en verde,
 * no interfiere con la fuerza, no se pidió repetir y la progresión no está
 * congelada.
 */
export function avanza({ carrera, estado, sesion }) {
  if (sesion >= PLAN_RUNNING.length) return false;
  if (estado !== "PROGRESS") return false;
  if (carrera.interfiere || carrera.repetir) return false;
  return semaforoDolor(carrera) === "GREEN";
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

export function faseDe(n) {
  return FASES_RUNNING.find((f) => f.fase === sesionRunning(n).fase);
}

/** Cuántas sesiones del plan quedan y las semanas orientativas a 2/semana. */
export function restante(n) {
  const quedan = PLAN_RUNNING.length - n + 1;
  return { quedan, semanas: Math.ceil(quedan / RUNNING.sesionesBaseSemana) };
}

/** Nota de progresión para la pantalla de running. */
export function notaProgresion({ estado, sesion, ultima }) {
  const s = sesionRunning(sesion);
  if (estado === "RED_PAIN") return "Última sesión en rojo. Parar running y valorar antes de la siguiente.";
  if (estado === "YELLOW_PAIN") return `Última sesión en amarillo. Repite S${s.n} (${s.codigo}) sin progresar hasta que desaparezca.`;
  if (estado === "HOLD") return "Progresión congelada: interfiere con fuerza o recuperación. " + MENSAJES.running20k;
  if (ultima && ultima.repetir && ultima.sesion === s.n) return `La última vez S${s.n} costó demasiado: se repite. No pasa nada.`;
  if (sesion >= PLAN_RUNNING.length) return "Última sesión del plan: 20 km. Sin fecha, sin obligación.";
  const sig = sesionRunning(sesion + 1);
  return `Si sale en verde, la siguiente será S${sig.n} · ${sig.codigo}. Si cuesta demasiado, se repite.`;
}

/** Recomendación de running para HOY (§57). Nunca dos días seguidos. */
export function recomendacionHoy({ estado, carreras, hoy, fuerzaHoy }) {
  if (hechaEl(carreras, hoy)) return { hacer: false, texto: "Running hecho hoy." };
  if (estado === "RED_PAIN") return { hacer: false, texto: "Rojo: sin running hasta valorar." };
  const ultima = carrerasOrdenadas(carreras)[0];
  if (ultima && diasEntre(ultima.fecha, hoy) < 2) return { hacer: false, texto: "Corriste ayer: nunca dos días seguidos." };
  const n = sesionesEnSemana(carreras, hoy);
  if (n >= RUNNING.sesionesBaseSemana) return { hacer: false, texto: `Ya llevas ${n} sesiones esta semana. Base: 2/semana.` };
  if (fuerzaHoy) return { hacer: false, texto: "Hoy hay fuerza: prioridad a la hipertrofia." };
  return { hacer: true, texto: estado === "PROGRESS" ? "Running fácil disponible" : "Running fácil · repetir sesión" };
}

export { PLAN_RUNNING, FASES_RUNNING, sesionRunning };
