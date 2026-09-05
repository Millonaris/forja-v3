/*
 * Doble progresión (§11, §12).
 *
 * Para un rango 8–12: mantener carga → ganar repeticiones → cuando TODAS las
 * series llegan al extremo alto con el RIR correcto → subir la carga mínima
 * práctica → volver a construir reps. No se exige progreso en todos los
 * ejercicios cada sesión.
 *
 * Veredictos: SUBE / LLENA / MANTÉN / REVISAR. Ninguno es un reproche.
 */

import { kg as fmtKg } from "./formato.js";

export const ESTADOS = {
  SUBE: { id: "sube", texto: "Sube peso" },
  LLENA: { id: "llena", texto: "Llena el rango" },
  MANTEN: { id: "manten", texto: "Mantén" },
  REVISAR: { id: "revisar", texto: "Revisar" },
};

/** El peso de trabajo de una sesión: el más repetido, no el máximo. */
export function pesoDeTrabajo(series) {
  const cuenta = new Map();
  for (const s of series) {
    if (s.kg == null || s.kg === "") continue;
    const k = Number(s.kg);
    cuenta.set(k, (cuenta.get(k) ?? 0) + 1);
  }
  if (!cuenta.size) return null;
  return [...cuenta.entries()].sort((a, b) => b[1] - a[1] || b[0] - a[0])[0][0];
}

export function repsTotales(series) {
  return series.reduce((t, s) => t + (Number(s.reps) || 0), 0);
}

function conReps(series) {
  return series.filter((s) => s.reps != null && s.reps !== "" && Number(s.reps) > 0);
}

/**
 * Veredicto de un ejercicio a partir de su historial (`historial` = lista de
 * {fecha, series}, de la más nueva a la más vieja).
 */
export function veredicto(ejercicio, historial) {
  const ultima = historial[0];
  if (!ultima) {
    return { ...ESTADOS.LLENA, motivo: `Primera vez: busca un peso que te deje en RIR 1–2 dentro de ${ejercicio.repMin}–${ejercicio.repMax}. Esa será tu referencia.` };
  }
  const series = conReps(ultima.series);
  if (!series.length) return { ...ESTADOS.LLENA, motivo: "La última sesión no tiene repeticiones apuntadas." };

  const peso = pesoDeTrabajo(series);
  const total = repsTotales(series);
  const rangoLleno = series.every((s) => Number(s.reps) >= ejercicio.repMax);
  const bajoElRango = series.every((s) => Number(s.reps) < ejercicio.repMin);
  const pesoAnterior = historial[1] ? pesoDeTrabajo(conReps(historial[1].series)) : null;
  const pesoRecienSubido = peso != null && pesoAnterior != null && peso > pesoAnterior;
  const rires = series.map((s) => s.rir).filter((r) => r != null && r !== "").map(Number);
  const todasConRir = rires.length === series.length;

  if (bajoElRango) {
    return {
      ...ESTADOS.REVISAR,
      motivo: pesoRecienSubido
        ? `El salto a ${fmtKg(peso)} fue grande: te quedas por debajo de ${ejercicio.repMin}. Vuelve a ${fmtKg(pesoAnterior)} o usa un incremento menor.`
        : `Por debajo de ${ejercicio.repMin} reps en todas las series a ${fmtKg(peso)}. Baja el incremento mínimo y reconstruye desde ahí.`,
    };
  }

  if (rangoLleno) {
    if (todasConRir && rires.every((r) => r >= 1)) {
      return { ...ESTADOS.SUBE, motivo: `Techo del rango (${ejercicio.repMax}) en todas las series a ${fmtKg(peso)} con RIR correcto. Sube el incremento MÍNIMO y vuelve a ${ejercicio.repMin}–${ejercicio.repMin + 2}.` };
    }
    if (todasConRir) {
      return { ...ESTADOS.MANTEN, motivo: `Llegaste a ${ejercicio.repMax} pero rozando el fallo. Repite ${fmtKg(peso)} buscando el techo con RIR 1–2, y entonces sube.` };
    }
    return { ...ESTADOS.SUBE, motivo: `Techo del rango a ${fmtKg(peso)}. Si el esfuerzo fue RIR 1–2, sube el incremento mínimo. Apunta el RIR y esta recomendación afinará sola.` };
  }

  if (pesoRecienSubido) {
    return { ...ESTADOS.LLENA, motivo: `Peso nuevo (${fmtKg(pesoAnterior)} → ${fmtKg(peso)}): reconstruye hacia ${ejercicio.repMax} en todas. Caer reps con peso nuevo es progreso, no retroceso.` };
  }

  const previa = historial.slice(1).find((h) => pesoDeTrabajo(conReps(h.series)) === peso);
  if (previa) {
    const antes = repsTotales(conReps(previa.series));
    if (total > antes) return { ...ESTADOS.MANTEN, motivo: `+${total - antes} reps (${antes} → ${total}) a ${fmtKg(peso)}. Va bien: objetivo de la próxima, ${total + 1} totales o más.` };

    const atascos = sesionesSinMejorar(historial, peso);
    const vaSobrado = todasConRir && rires.every((r) => r >= 3);
    if (atascos >= 3 && vaSobrado) return { ...ESTADOS.LLENA, motivo: `${atascos} sesiones sin mejorar a ${fmtKg(peso)}, pero con RIR 3+: vas lejos del fallo. Acércate a RIR 1–2 y la rep extra sale sola.` };
    if (atascos >= 5) return { ...ESTADOS.REVISAR, motivo: `${atascos} sesiones clavado en ${total} reps a ${fmtKg(peso)}. Toca cambiar el estímulo: −5 % y reconstruir con carrerilla.` };
    if (atascos >= 3) return { ...ESTADOS.REVISAR, motivo: `Tres sesiones sin pasar de ${total} reps a ${fmtKg(peso)}. ¿Descansos, sueño, técnica? Si todo está bien, prueba −5 % y reconstruye.` };
    if (total < antes) return { ...ESTADOS.MANTEN, motivo: `Día flojo (${antes} → ${total} reps). Una sesión no es tendencia: repite ${fmtKg(peso)} y recupera las ${antes}.` };
    return { ...ESTADOS.LLENA, motivo: `Clavado en ${total} reps a ${fmtKg(peso)}. Objetivo: +1 rep en la primera serie.` };
  }

  return { ...ESTADOS.LLENA, motivo: `${total} reps a ${fmtKg(peso)}. Sigue con este peso hasta ${ejercicio.repMax} en todas las series con RIR 1–2.` };
}

/** El reto de HOY, en una línea, a partir de la última sesión del ejercicio. */
export function objetivoDeHoy(ejercicio, seriesAnteriores) {
  if (!seriesAnteriores?.length) return null;
  const series = conReps(seriesAnteriores);
  if (!series.length) return null;
  const peso = pesoDeTrabajo(series);
  const total = repsTotales(series);
  const rangoLleno = series.every((s) => Number(s.reps) >= ejercicio.repMax);
  const bajoElRango = series.every((s) => Number(s.reps) < ejercicio.repMin);
  const rires = series.map((s) => s.rir).filter((r) => r != null && r !== "").map(Number);
  const sinFallo = rires.length === series.length && rires.every((r) => r >= 1);
  const sobrado = rires.length === series.length && rires.every((r) => r >= 3);
  if (bajoElRango) return `Baja un punto desde ${fmtKg(peso)} y llena el rango.`;
  if (rangoLleno && sinFallo) return `SUBE el mínimo desde ${fmtKg(peso)} y apunta a ${ejercicio.repMin}–${ejercicio.repMin + 2}.`;
  if (rangoLleno) return `Repite ${fmtKg(peso)} buscando el techo con RIR 1–2.`;
  if (sobrado) return `${fmtKg(peso)} · fuiste sobrado (RIR 3+): suma reps sin miedo.`;
  return `${fmtKg(peso)} · batir ${total} reps totales.`;
}

function sesionesSinMejorar(historial, peso) {
  const mismas = historial.filter((h) => pesoDeTrabajo(conReps(h.series)) === peso);
  let cuenta = 0;
  for (let i = 0; i < mismas.length - 1; i++) {
    if (repsTotales(conReps(mismas[i].series)) > repsTotales(conReps(mismas[i + 1].series))) break;
    cuenta++;
  }
  return cuenta;
}

/** "70 kg · 10/10/9 · RIR 2" */
export function resumirSeries(series) {
  const s = conReps(series || []);
  if (!s.length) return null;
  const peso = fmtKg(pesoDeTrabajo(s));
  const reps = s.map((x) => x.reps ?? "–").join("/");
  const rires = s.map((x) => x.rir).filter((r) => r != null && r !== "").map(Number);
  const rir = rires.length ? ` · RIR ${Math.min(...rires)}` : "";
  return `${peso} · ${reps}${rir}`;
}
