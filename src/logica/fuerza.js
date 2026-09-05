/*
 * Fuerza (§5–§13, §48).
 *
 * La secuencia Torso A → Pierna A → Torso B → Pierna B avanza SOLO al
 * completar sesiones, nunca por calendario. No hay reset semanal.
 * La adaptación post-vacaciones está terminada: rutina normal.
 */

import { RUTINAS, SECUENCIA } from "../datos/rutinas.js";
import { diasEntre } from "./fechas.js";
import { ESTADOS, repsTotales, veredicto } from "./progresion.js";

export const VUELTA_TRAS_PAUSA = false; // §5 · strengthReturnFromBreak

/** Sesiones completadas, de la más antigua a la más reciente. */
export function completadas(sesiones) {
  return sesiones.filter((s) => s.estado === "completada").sort((a, b) => a.fecha.localeCompare(b.fecha) || (a.id ?? 0) - (b.id ?? 0));
}

/** §6 · La siguiente de la secuencia según la última completada. */
export function siguienteRutina(sesiones) {
  const lista = completadas(sesiones);
  if (!lista.length) return SECUENCIA[0];
  const ultima = lista[lista.length - 1];
  const i = SECUENCIA.indexOf(ultima.rutinaId);
  return SECUENCIA[(i + 1) % SECUENCIA.length];
}

export function ultimaCompletada(sesiones) {
  const lista = completadas(sesiones);
  return lista.length ? lista[lista.length - 1] : null;
}

export function ultimaDe(sesiones, rutinaId) {
  const lista = completadas(sesiones).filter((s) => s.rutinaId === rutinaId);
  return lista.length ? lista[lista.length - 1] : null;
}

export function hechaEl(sesiones, fecha) {
  return completadas(sesiones).some((s) => s.fecha === fecha);
}

export function sesionAbierta(sesiones) {
  return sesiones.find((s) => s.estado === "en-curso") || null;
}

/** Volumen (kg × reps) de una sesión. */
export function volumen(sesion) {
  return (sesion.series || []).reduce((t, s) => t + (Number(s.kg) || 0) * (Number(s.reps) || 0), 0);
}

export function seriesHechas(sesion) {
  return (sesion.series || []).filter((s) => s.completada || Number(s.reps) > 0).length;
}

/**
 * Historial por clave de ejercicio: { clave → [{fecha, sesionId, rutinaId, series}] }
 * de la más nueva a la más vieja. Se agrupa por CLAVE y no por rutina porque
 * "Elevaciones laterales" es el mismo ejercicio en las cuatro.
 */
export function historialPorEjercicio(sesiones) {
  const mapa = new Map();
  for (const s of completadas(sesiones).reverse()) {
    const porClave = new Map();
    for (const serie of s.series || []) {
      if (!porClave.has(serie.clave)) porClave.set(serie.clave, []);
      porClave.get(serie.clave).push(serie);
    }
    for (const [clave, series] of porClave) {
      if (!mapa.has(clave)) mapa.set(clave, []);
      mapa.get(clave).push({ fecha: s.fecha, sesionId: s.id, rutinaId: s.rutinaId, series: series.sort((a, b) => a.numero - b.numero) });
    }
  }
  return mapa;
}

/** Veredicto de cada ejercicio de una rutina. */
export function veredictosDeRutina(rutinaId, historial) {
  return RUTINAS[rutinaId].ejercicios.map((e) => ({ ejercicio: e, veredicto: veredicto(e, historial.get(e.clave) || []) }));
}

/**
 * §13 · Señales de descarga. Nunca automática por calendario; se SUGIERE si
 * aparecen varias señales, y nunca se ejecuta sin confirmación.
 */
export function senalesDeload({ sesiones, recuperacion, veredictosTodos }) {
  const senales = [];
  const revisar = (veredictosTodos || []).filter((v) => v.veredicto.id === ESTADOS.REVISAR.id).length;
  if (revisar >= 2) senales.push(`Regresión repetida en ${revisar} ejercicios.`);
  const r = recuperacion || {};
  if (r.energia != null && r.n >= 4 && r.energia < 2.5) senales.push("Energía baja varios días.");
  if ((r.sueno != null && r.n >= 4 && r.sueno < 6.5) || (r.calidad != null && r.n >= 4 && r.calidad < 2.5)) senales.push("Sueño peor.");
  if (r.hambre != null && r.n >= 4 && r.hambre >= 4.5) senales.push("Hambre muy alta.");

  // Rendimiento decreciente: en las dos últimas vueltas de cada rutina, menos reps totales.
  const lista = completadas(sesiones);
  let decrecientes = 0;
  for (const id of Object.keys(RUTINAS)) {
    const deRutina = lista.filter((s) => s.rutinaId === id).slice(-3);
    if (deRutina.length === 3) {
      const t = deRutina.map((s) => repsTotales(s.series || []));
      if (t[0] > t[1] && t[1] > t[2]) decrecientes++;
    }
  }
  if (decrecientes >= 2) senales.push("Rendimiento decreciente en varias rutinas.");

  // Fatiga acumulada: muchas sesiones seguidas sin ningún descanso de ≥2 días.
  const ultimas = lista.slice(-8);
  if (ultimas.length === 8 && diasEntre(ultimas[0].fecha, ultimas[7].fecha) <= 9) senales.push("Fatiga acumulada: 8 sesiones en ≤9 días.");

  return { senales, sugerir: senales.length >= 2 };
}

/** Resumen por ejercicio para PROGRESO → FUERZA: última serie, mejor serie, nº sesiones. */
export function resumenEjercicios(historial) {
  const filas = [];
  for (const [clave, lista] of historial) {
    let mejor = null;
    for (const h of lista) for (const s of h.series) {
      if (s.kg == null || !(Number(s.reps) > 0)) continue;
      const v = Number(s.kg) * Number(s.reps);
      if (!mejor || v > mejor.v) mejor = { v, kg: s.kg, reps: s.reps };
    }
    const ult = lista[0].series.find((s) => Number(s.reps) > 0) || lista[0].series[0];
    filas.push({ clave, sesiones: lista.length, ultima: ult ? `${ult.kg ?? "–"}×${ult.reps ?? "–"}` : "—", mejor: mejor ? `${mejor.kg}×${mejor.reps}` : "—", ultimaFecha: lista[0].fecha });
  }
  return filas.sort((a, b) => b.ultimaFecha.localeCompare(a.ultimaFecha));
}

/** ¿La fuerza se mantiene? Compara reps totales de las dos últimas vueltas. `null` sin datos. */
export function fuerzaEstable(sesiones) {
  const lista = completadas(sesiones);
  let comparadas = 0, caidas = 0;
  for (const id of Object.keys(RUTINAS)) {
    const deRutina = lista.filter((s) => s.rutinaId === id).slice(-2);
    if (deRutina.length === 2) {
      comparadas++;
      const [a, b] = deRutina.map((s) => repsTotales(s.series || []));
      if (b < a * 0.9) caidas++;
    }
  }
  if (comparadas < 2) return null;
  return caidas < 2;
}
