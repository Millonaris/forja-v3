/*
 * Peso y cintura (§21–§25, §30).
 *
 * FORJA decide por tendencias, no por una pesada aislada. La unidad de
 * decisión es la media de 7 días, y la tendencia es la diferencia entre la
 * media de esta semana y la de la anterior. Las pesadas marcadas como DUDOSAS
 * quedan fuera de todos los cálculos sensibles (§22).
 */

import { RITMO_CUT } from "../datos/config.js";
import { diasEntre, sumarDias } from "./fechas.js";

/** Pesadas con dato, de la más antigua a la más reciente. */
export function pesosTodos(diario) {
  return diario
    .filter((d) => d.pesoKg != null && d.pesoKg > 0)
    .map((d) => ({ fecha: d.fecha, kg: Number(d.pesoKg), dudosa: d.pesoConfianza === "doubtful" }))
    .sort((a, b) => a.fecha.localeCompare(b.fecha));
}

/** Solo las fiables: las dudosas no entran en medias ni tendencias (§22). */
export function pesosValidos(diario) {
  return pesosTodos(diario).filter((p) => !p.dudosa);
}

export function media(valores) {
  if (!valores.length) return null;
  return valores.reduce((a, b) => a + b, 0) / valores.length;
}

/**
 * Media de los 7 días que terminan en `hasta` (§23). Con menos de 5 pesadas
 * fiables en esa ventana no hay media: mejor "—" que un número que engaña.
 */
export function media7(validos, hasta, minimo = 5) {
  const desde = sumarDias(hasta, -6);
  const ventana = validos.filter((p) => p.fecha >= desde && p.fecha <= hasta);
  if (ventana.length < minimo) return null;
  return media(ventana.map((p) => p.kg));
}

/** §24 · tendencia = media7 de esta semana − media7 de la anterior. */
export function tendenciaSemanal(validos, hasta) {
  const actual = media7(validos, hasta);
  const previa = media7(validos, sumarDias(hasta, -7));
  if (actual == null || previa == null) return null;
  return actual - previa;
}

/** Tendencia por semana medida sobre `semanas` semanas (para el TDEE deducido). */
export function tendenciaEnSemanas(validos, hasta, semanas) {
  const actual = media7(validos, hasta);
  const previa = media7(validos, sumarDias(hasta, -7 * semanas));
  if (actual == null || previa == null) return null;
  return (actual - previa) / semanas;
}

export function pesoDelDia(diario, fecha) {
  const d = diario.find((x) => x.fecha === fecha);
  return d && d.pesoKg != null ? { fecha, kg: Number(d.pesoKg), dudosa: d.pesoConfianza === "doubtful" } : null;
}

/** La última pesada (fiable o no) hasta una fecha: sirve para pre-rellenar. */
export function ultimoPeso(diario, hasta) {
  const lista = pesosTodos(diario).filter((p) => p.fecha <= hasta);
  return lista.length ? lista[lista.length - 1] : null;
}

/** §30 · Ritmo objetivo en kg/semana para un peso de referencia. */
export function ritmoObjetivo(kgRef) {
  return {
    minKg: kgRef * RITMO_CUT.min,
    maxKg: kgRef * RITMO_CUT.max,
    techoKg: kgRef * RITMO_CUT.techoBlando,
  };
}

/**
 * Clasifica la tendencia semanal frente al ritmo objetivo.
 *   RAPIDA   pierde más que el techo blando (~0,7 %)
 *   EN_RANGO dentro de 0,4–0,6 %
 *   LENTA    pierde, pero menos del 0,4 %
 *   PLANA    ±0,15 kg
 *   SUBE     gana más de 0,15 kg
 */
export function clasificarTendencia(tendencia, kgRef) {
  if (tendencia == null) return "SIN_DATOS";
  const r = ritmoObjetivo(kgRef);
  if (tendencia < -r.techoKg) return "RAPIDA";
  if (tendencia <= -r.minKg) return "EN_RANGO";
  if (tendencia < -0.15) return "LENTA";
  if (tendencia <= 0.15) return "PLANA";
  return "SUBE";
}

export const TEXTO_TENDENCIA = {
  SIN_DATOS: "Sin datos suficientes",
  RAPIDA: "Rápida — revisa",
  EN_RANGO: "En rango",
  LENTA: "Lenta",
  PLANA: "Plana",
  SUBE: "Sube",
};

/** Serie de medias de 7 días para la gráfica: una por fecha pedida. */
export function serieMedia7(validos, fechas) {
  return fechas.map((f) => ({ fecha: f, kg: media7(validos, f, 3) }));
}

/* ---------- Cintura (§25) ---------- */

export function cinturaOrdenada(cintura) {
  return [...cintura].sort((a, b) => a.fecha.localeCompare(b.fecha));
}

export function ultimaCintura(cintura, hasta) {
  const lista = cinturaOrdenada(cintura).filter((c) => c.fecha <= hasta);
  return lista.length ? lista[lista.length - 1] : null;
}

/** La primera medición desde una fecha (el inicio de la fase). */
export function cinturaDeReferencia(cintura, desde) {
  const lista = cinturaOrdenada(cintura);
  return lista.find((c) => c.fecha >= desde) || lista[0] || null;
}

/** Toca medir si no hay medida en los últimos 7 días. */
export function tocaMedirCintura(cintura, hoy) {
  const u = ultimaCintura(cintura, hoy);
  return !u || diasEntre(u.fecha, hoy) >= 7;
}

/** Cintura estable en las últimas `semanas`: cambio ≤ 0,5 cm en valor absoluto. */
export function cinturaEstable(cintura, hoy, semanas = 2) {
  const lista = cinturaOrdenada(cintura).filter((c) => c.fecha <= hoy && diasEntre(c.fecha, hoy) <= semanas * 7 + 3);
  if (lista.length < 2) return null;
  return Math.abs(lista[lista.length - 1].cm - lista[0].cm) <= 0.5;
}

/** Cintura bajando en las últimas semanas (≥0,5 cm menos). */
export function cinturaBaja(cintura, hoy, semanas = 2) {
  const lista = cinturaOrdenada(cintura).filter((c) => c.fecha <= hoy && diasEntre(c.fecha, hoy) <= semanas * 7 + 3);
  if (lista.length < 2) return null;
  return lista[lista.length - 1].cm - lista[0].cm <= -0.5;
}
