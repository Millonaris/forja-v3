/*
 * Acciones: TODAS las escrituras a la base de datos pasan por aquí.
 * Cada acción hace una cosa y deja el registro coherente. Las pantallas no
 * tocan Dexie directamente.
 */

import { db, guardarAjustes, leerAjustes } from "../datos/db.js";
import { PLAN_RUNNING, RUTINAS, idEjercicio, sesionRunning } from "../datos/rutinas.js";
import { hoyISO } from "./fechas.js";
import { avanza, estadoRunning, semaforoDolor } from "./running.js";
import { aplicarDecision, parcheGanancia, parcheMiniCut, parcheVolverMantenimiento } from "./revision.js";

async function actualizarDia(fecha, cambios) {
  const actual = (await db.diario.get(fecha)) || { fecha };
  await db.diario.put({ ...actual, ...cambios, fecha });
}

/* ---------- Cuerpo ---------- */

export async function guardarPeso({ fecha = hoyISO(), kg, dudosa = false, grasaBIA = null }) {
  await actualizarDia(fecha, { pesoKg: Number(kg), pesoConfianza: dudosa ? "doubtful" : "normal", grasaBIA: grasaBIA != null && grasaBIA !== "" ? Number(grasaBIA) : null });
}

export async function borrarPeso(fecha) {
  await actualizarDia(fecha, { pesoKg: null, pesoConfianza: null, grasaBIA: null });
}

export async function guardarCintura({ fecha = hoyISO(), cm }) {
  await db.cintura.put({ fecha, cm: Number(cm) });
}

export async function borrarCintura(fecha) {
  await db.cintura.delete(fecha);
}

export async function guardarRecuperacion({ fecha = hoyISO(), hambre, energia, suenoHoras, suenoCalidad }) {
  await actualizarDia(fecha, { hambre: Number(hambre), energia: Number(energia), suenoHoras: Number(suenoHoras), suenoCalidad: Number(suenoCalidad) });
}

/**
 * El cierre del día: el TOTAL que Jose copia de Fitia, los pasos del Garmin y,
 * si el día es SOCIAL, la estimación de restaurante (§45) con su confianza.
 */
export async function guardarCierre({ fecha = hoyISO(), tipoDia, kcal, proteinaG, carbosG, grasaG, pasos, comidaSocial = false, comidaSocialEstimada = false, restaurantePreset = null, restauranteKcal = null, restauranteConfianza = null, bebidas = null, notas = "" }) {
  const num = (v) => (v == null || v === "" ? null : Number(v));
  await actualizarDia(fecha, { tipoDia, kcal: num(kcal), proteinaG: num(proteinaG), carbosG: num(carbosG), grasaG: num(grasaG), pasos: num(pasos), comidaSocial: !!comidaSocial, comidaSocialEstimada: !!comidaSocialEstimada, restaurantePreset, restauranteKcal: num(restauranteKcal), restauranteConfianza, bebidas, notas });
}

/** §4B · Marcar el tipo de día de hoy: social planeada / fuerza planeada. */
export async function fijarTipoDia(fecha, tipo) {
  await actualizarDia(fecha, { socialPlaneada: tipo === "SOCIAL", fuerzaPlaneada: tipo === "STRENGTH", tipoDia: tipo });
}

export async function guardarNota(fecha, notas) {
  await actualizarDia(fecha, { notas });
}

/* ---------- Fuerza ---------- */

/** Abre una sesión con las series vacías de la rutina. Solo puede haber una abierta. */
export async function empezarSesion(rutinaId, fecha = hoyISO()) {
  const abierta = await db.sesionesFuerza.where("estado").equals("en-curso").first();
  if (abierta) return abierta.id;
  const rutina = RUTINAS[rutinaId];
  const series = rutina.ejercicios.flatMap((e) => Array.from({ length: e.series }, (_, k) => ({ ejercicioId: idEjercicio(rutinaId, e.clave), clave: e.clave, nombre: e.nombre, numero: k + 1, kg: "", reps: "", rir: "", completada: false })));
  return db.sesionesFuerza.add({ fecha, rutinaId, estado: "en-curso", series, empezadaEn: Date.now(), descansoFin: null, descansoEjercicio: null });
}

/**
 * Escritura ATÓMICA de una serie. Sin la transacción, escribir kg y reps muy
 * seguidos hacía "leer → modificar → guardar" dos veces a la vez y la segunda
 * pisaba a la primera (se perdían los kg). Dexie encadena las transacciones.
 */
export async function actualizarSerie(sesionId, indice, cambios) {
  await db.transaction("rw", db.sesionesFuerza, async () => {
    const s = await db.sesionesFuerza.get(sesionId);
    if (!s) return;
    const series = s.series.map((x, i) => (i === indice ? { ...x, ...cambios } : x));
    await db.sesionesFuerza.update(sesionId, { series });
  });
}

export async function guardarDescanso(sesionId, descansoFin, descansoEjercicio = null) {
  await db.transaction("rw", db.sesionesFuerza, async () => {
    await db.sesionesFuerza.update(sesionId, { descansoFin, descansoEjercicio });
  });
}

/** Finaliza: guarda solo las series con algo apuntado. Sin series, no hay sesión. */
export async function finalizarSesion(sesionId, notas = "") {
  const s = await db.sesionesFuerza.get(sesionId);
  if (!s) return { ok: false, motivo: "No existe la sesión." };
  const series = s.series.filter((x) => x.completada || Number(x.reps) > 0).map((x) => ({ ...x, kg: x.kg === "" ? null : Number(x.kg), reps: x.reps === "" ? null : Number(x.reps), rir: x.rir === "" ? null : Number(x.rir), completada: true }));
  if (!series.length) return { ok: false, motivo: "Marca al menos una serie antes de finalizar." };
  await db.sesionesFuerza.update(sesionId, { estado: "completada", series, terminadaEn: Date.now(), notas, descansoFin: null });
  return { ok: true, series: series.length };
}

export async function cancelarSesion(sesionId) {
  await db.sesionesFuerza.delete(sesionId);
}

export async function borrarSesion(sesionId) {
  await db.sesionesFuerza.delete(sesionId);
}

/* ---------- Running ---------- */

/**
 * Guarda una sesión de running. Si va en verde, no interfiere y no se pidió
 * repetirla, se avanza a la siguiente del plan (progresión por sesiones, no
 * por calendario). Si Jose marca que interfiere con la fuerza, se congela (§17).
 */
export async function guardarCarrera(datos) {
  const ajustes = await leerAjustes();
  const sesion = datos.sesion ?? ajustes.sesionRunning ?? 5;
  const plan = sesionRunning(sesion);
  const fila = { fecha: datos.fecha || hoyISO(), sesion, codigo: plan.codigo, fase: plan.fase, duracionMin: Number(datos.duracionMin) || 0, correrMin: Number(datos.correrMin) || 0, andarMin: Number(datos.andarMin) || 0, distanciaKm: datos.distanciaKm ? Number(datos.distanciaKm) : null, fcMedia: datos.fcMedia ? Number(datos.fcMedia) : null, fcMax: datos.fcMax ? Number(datos.fcMax) : null, rpe: datos.rpe ? Number(datos.rpe) : null, sensacion: datos.sensacion ? Number(datos.sensacion) : null, dolor: Number(datos.dolor) || 0, persiste: !!datos.persiste, alteraMarcha: !!datos.alteraMarcha, interfiere: !!datos.interfiere, repetir: !!datos.repetir, notas: datos.notas || "" };
  await db.carreras.add(fila);
  const carreras = await db.carreras.toArray();
  const cambios = {};
  if (fila.interfiere) cambios.estadoRunning = "HOLD";
  const estado = estadoRunning({ ...ajustes, ...cambios }, carreras);
  if (sesion === (ajustes.sesionRunning ?? 5) && avanza({ carrera: fila, estado, sesion })) cambios.sesionRunning = sesion + 1;
  if (Object.keys(cambios).length) await guardarAjustes(cambios);
  return { semaforo: semaforoDolor(fila), avanzaA: cambios.sesionRunning != null ? sesionRunning(cambios.sesionRunning) : null, hold: fila.interfiere, repetir: fila.repetir };
}

export async function borrarCarrera(id) {
  await db.carreras.delete(id);
}

/** Congelar / abrir la progresión a mano. */
export async function fijarEstadoRunning(estado) {
  await guardarAjustes({ estadoRunning: estado === "HOLD" ? "HOLD" : "PROGRESS" });
}

export async function fijarSesionRunning(n) {
  await guardarAjustes({ sesionRunning: Math.max(1, Math.min(PLAN_RUNNING.length, Number(n))) });
}

/* ---------- Rutinas cortas ---------- */

export async function completarRutinaCorta(tipo, fecha = hoyISO()) {
  await db.extras.add({ fecha, tipo, en: Date.now() });
}

/* ---------- Fotos ---------- */

export async function guardarFoto(imagen, { pose, fecha = hoyISO() }) {
  return db.fotos.add({ fecha, pose, imagen });
}

export async function borrarFoto(id) {
  await db.fotos.delete(id);
}

/* ---------- Plan: kcal y fases (nunca automáticas) ---------- */

export async function cambiarKcal({ kcal, proteinaG, carbosG, grasaG, motivo = "" }) {
  const a = await leerAjustes();
  const hoy = hoyISO();
  await guardarAjustes({ kcalObjetivo: Number(kcal), proteinaG: Number(proteinaG), carbosG: Number(carbosG), grasaG: Number(grasaG), ultimoCambioKcal: hoy });
  await db.historial.add({ fecha: hoy, tipo: "kcal", texto: `${a.kcalObjetivo} → ${kcal} kcal (${proteinaG}P/${carbosG}C/${grasaG}G). ${motivo}`.trim() });
}

/** En CUT se cambian los tres objetivos por tipo de día a la vez (3.1). */
export async function cambiarObjetivosDia({ rest, strength, social, proteinaG, grasaG, motivo = "" }) {
  const a = await leerAjustes();
  const hoy = hoyISO();
  const carbos = (kcal) => Math.max(0, Math.round((kcal - proteinaG * 4 - grasaG * 9) / 4));
  const objetivosDia = {
    REST: { kcal: Number(rest), proteinaG: Number(proteinaG), carbosG: carbos(rest), grasaG: Number(grasaG) },
    STRENGTH: { kcal: Number(strength), proteinaG: Number(proteinaG), carbosG: carbos(strength), grasaG: Number(grasaG) },
    SOCIAL: { kcal: Number(social), proteinaG: Number(proteinaG), carbosG: null, grasaG: null },
  };
  const media = Math.round((rest * 2 + strength * 3 + social * 2) / 7);
  await guardarAjustes({ objetivosDia, kcalObjetivo: media, proteinaG: Number(proteinaG), carbosG: carbos(strength), grasaG: Number(grasaG), ultimoCambioKcal: hoy });
  const antes = a.objetivosDia || {};
  await db.historial.add({ fecha: hoy, tipo: "kcal", texto: `Descanso ${antes.REST?.kcal ?? "—"} → ${rest} · Fuerza ${antes.STRENGTH?.kcal ?? "—"} → ${strength} · Social ${antes.SOCIAL?.kcal ?? "—"} → ${social} kcal (${proteinaG} P · ${grasaG} G). ${motivo}`.trim() });
}

export async function aceptarTdee(valor) {
  await guardarAjustes({ tdeeReferencia: Number(valor) });
  await db.historial.add({ fecha: hoyISO(), tipo: "tdee", texto: `TDEE deducido aceptado como referencia: ${valor} kcal.` });
}

export async function decidirRevision(decision, tdee) {
  const ajustes = await leerAjustes();
  const hoy = hoyISO();
  const { parche, historial } = aplicarDecision(decision, { ajustes, hoy, tdee });
  await guardarAjustes(parche);
  await db.historial.add({ fecha: hoy, ...historial });
}

export async function confirmarMantenimiento() {
  const a = await leerAjustes();
  await guardarAjustes({ mantenimientoConfirmado: hoyISO(), mantenimientoKcal: a.kcalObjetivo, tdeeReferencia: a.kcalObjetivo });
  await db.historial.add({ fecha: hoyISO(), tipo: "fase", texto: `Mantenimiento confirmado a ${a.kcalObjetivo} kcal.` });
}

export async function empezarGanancia(superavit = 150) {
  const ajustes = await leerAjustes();
  const { parche, historial } = parcheGanancia({ ajustes, hoy: hoyISO(), superavit });
  await guardarAjustes(parche);
  await db.historial.add({ fecha: hoyISO(), ...historial });
}

export async function empezarMiniCut(kcal) {
  const ajustes = await leerAjustes();
  const { parche, historial } = parcheMiniCut({ ajustes, hoy: hoyISO(), kcal: Number(kcal) });
  await guardarAjustes(parche);
  await db.historial.add({ fecha: hoyISO(), ...historial });
}

export async function volverAMantenimiento() {
  const ajustes = await leerAjustes();
  const { parche, historial } = parcheVolverMantenimiento({ ajustes, hoy: hoyISO() });
  await guardarAjustes(parche);
  await db.historial.add({ fecha: hoyISO(), ...historial });
}

export async function fijarVariante(varianteHoy) {
  await guardarAjustes({ varianteHoy });
}

export async function fijarFechasCut({ finProvisional, avisoPreRevision }) {
  await guardarAjustes({ finProvisional, avisoPreRevision });
}

export { guardarAjustes };
